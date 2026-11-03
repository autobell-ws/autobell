-- ==============================================================================
-- AUTOBELL ZERO-TOUCH RETAIL ONBOARDING & ACTIVATION SYSTEM
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Extend device_inventory for retail distribution & PIN authentication
ALTER TABLE public.device_inventory
ADD COLUMN IF NOT EXISTS claim_pin_hash text,
ADD COLUMN IF NOT EXISTS wholesale_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS warranty_months int DEFAULT 12;

-- 2. Extend schools table for city and contact phone
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS phone text;

-- 3. Self-Serve Customer & School Registration RPC
CREATE OR REPLACE FUNCTION public.register_customer_and_school(
    p_admin_name text,
    p_school_name text,
    p_campus_name text DEFAULT 'Main Campus',
    p_city text DEFAULT 'Default City',
    p_phone text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
    v_user_id uuid;
    v_school_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to create a school profile.';
    END IF;

    -- Check if user already owns a school
    SELECT school_id INTO v_school_id FROM public.users WHERE id = v_user_id;
    IF v_school_id IS NOT NULL THEN
        RETURN json_build_object('success', true, 'school_id', v_school_id, 'message', 'Existing school found');
    END IF;

    -- 1. Create the new School with 1-Year Free Retail Cloud Service
    INSERT INTO public.schools (
        name,
        campus_name,
        city,
        phone,
        payment_status,
        subscription_end_date
    )
    VALUES (
        TRIM(p_school_name),
        COALESCE(NULLIF(TRIM(p_campus_name), ''), 'Main Campus'),
        COALESCE(NULLIF(TRIM(p_city), ''), 'Default City'),
        TRIM(p_phone),
        'paid', -- Trial / Retail 1-Year Bundle
        now() + interval '1 year'
    )
    RETURNING id INTO v_school_id;

    -- 2. Link User as School Admin in public.users
    INSERT INTO public.users (id, full_name, role, school_id)
    VALUES (v_user_id, TRIM(p_admin_name), 'admin', v_school_id)
    ON CONFLICT (id) DO UPDATE
    SET school_id = v_school_id,
        role = 'admin',
        full_name = TRIM(p_admin_name);

    -- 3. Create Default Bell Profile (Standard 8-Period Bell Schedule)
    INSERT INTO public.bell_profiles (school_id, name, is_active)
    VALUES (v_school_id, 'Standard School Schedule', true);

    RETURN json_build_object(
        'success', true,
        'school_id', v_school_id,
        'school_name', p_school_name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_customer_and_school(text, text, text, text, text) TO authenticated;


-- 4. Zero-Touch Device Claim & Activation RPC
CREATE OR REPLACE FUNCTION public.claim_and_activate_device(
    p_serial_number text,
    p_claim_pin text,
    p_device_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
    v_school_id uuid;
    v_inventory public.device_inventory%ROWTYPE;
    v_new_device_id uuid;
    v_subscription_end timestamp with time zone;
    v_pin_cleaned text;
    v_computed_hash text;
BEGIN
    -- 1. Verify caller has admin role in their school
    SELECT school_id INTO v_school_id 
    FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'school_admin', 'super_admin');

    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'Only authorized school administrators can claim devices.';
    END IF;

    -- 2. Find device in manufactured inventory
    SELECT * INTO v_inventory
    FROM public.device_inventory
    WHERE UPPER(serial_number) = UPPER(TRIM(p_serial_number))
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid Serial Number. Please check the label on your AutoBell controller or retail box.';
    END IF;

    IF v_inventory.retired_at IS NOT NULL THEN
        RAISE EXCEPTION 'This device has been decommissioned and cannot be claimed.';
    END IF;

    -- 3. Verify Claim PIN
    v_pin_cleaned := REPLACE(TRIM(COALESCE(p_claim_pin, '')), '-', '');
    IF v_inventory.claim_pin_hash IS NOT NULL THEN
        IF v_pin_cleaned = '' THEN
            RAISE EXCEPTION 'Claim PIN is required for this device. Please enter the 6-digit PIN on the device label.';
        END IF;

        v_computed_hash := encode(digest(v_pin_cleaned, 'sha256'), 'hex');
        IF LOWER(v_inventory.claim_pin_hash) <> LOWER(v_computed_hash) AND v_inventory.claim_pin_hash <> v_pin_cleaned THEN
            RAISE EXCEPTION 'Invalid Claim PIN. Please enter the 6-digit PIN printed on your AutoBell unit label.';
        END IF;
    END IF;

    -- 4. Check if already claimed by another institution
    IF v_inventory.claimed_by_school_id IS NOT NULL AND v_inventory.claimed_by_school_id <> v_school_id THEN
        RAISE EXCEPTION 'This device is already active under another school account. Contact AutoBell support to transfer ownership.';
    END IF;

    -- 5. Calculate Subscription: 1-Year Free from the exact moment of retail claim
    v_subscription_end := now() + interval '1 year';

    -- 6. Update Inventory record
    UPDATE public.device_inventory
    SET claimed_at = COALESCE(claimed_at, now()),
        claimed_by_school_id = v_school_id,
        activation_status = 'active',
        is_paid = true,
        activated_at = COALESCE(activated_at, now()),
        subscription_end_date = v_subscription_end
    WHERE id = v_inventory.id;

    -- 7. Insert or update in active bell_devices table
    INSERT INTO public.bell_devices (
        mac_address,
        name,
        school_id,
        status,
        activation_status,
        is_paid,
        activated_at,
        subscription_end_date
    )
    VALUES (
        v_inventory.mac_address,
        COALESCE(NULLIF(TRIM(p_device_name), ''), 'Main Campus Bell'),
        v_school_id,
        'offline',
        'active',
        true,
        now(),
        v_subscription_end
    )
    ON CONFLICT (mac_address) DO UPDATE
    SET school_id = EXCLUDED.school_id,
        name = EXCLUDED.name,
        activation_status = 'active',
        is_paid = true,
        activated_at = COALESCE(public.bell_devices.activated_at, now()),
        subscription_end_date = v_subscription_end
    RETURNING id INTO v_new_device_id;

    -- 8. Ensure school subscription status is active
    UPDATE public.schools
    SET payment_status = 'paid',
        subscription_end_date = GREATEST(COALESCE(subscription_end_date, now()), v_subscription_end)
    WHERE id = v_school_id;

    -- 9. Trigger immediate configuration sync command to device
    INSERT INTO public.command_queue (device_id, command, payload)
    VALUES (v_new_device_id, 'SYNC_SCHEDULES', json_build_object(
        'reason', 'retail_claim_auto_activated',
        'school_id', v_school_id,
        'activated_at', now()
    )::jsonb);

    RETURN json_build_object(
        'success', true,
        'device_id', v_new_device_id,
        'serial_number', v_inventory.serial_number,
        'mac_address', v_inventory.mac_address,
        'activation_status', 'active',
        'subscription_end_date', v_subscription_end,
        'message', 'AutoBell successfully claimed and activated! 1-Year Free Cloud Service is active.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_and_activate_device(text, text, text) TO authenticated, service_role;

