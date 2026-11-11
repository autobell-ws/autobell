-- Migration: Dual Channel Audio Support (Left and Right Channels)
-- Allows AutoBell devices to run independent schedule profiles, volumes, and zone labels for Left & Right stereo channels

-- 1. Add Dual-Channel Columns to bell_devices
ALTER TABLE public.bell_devices
  ADD COLUMN IF NOT EXISTS channel_mode text DEFAULT 'unified',
  ADD COLUMN IF NOT EXISTS volume_left integer DEFAULT 21,
  ADD COLUMN IF NOT EXISTS volume_right integer DEFAULT 21,
  ADD COLUMN IF NOT EXISTS profile_id_left uuid REFERENCES public.bell_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_id_right uuid REFERENCES public.bell_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel_label_left text DEFAULT 'Left Channel',
  ADD COLUMN IF NOT EXISTS channel_label_right text DEFAULT 'Right Channel';

-- 2. Constraints for volume (0-21) and mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bell_devices_channel_mode_check'
  ) THEN
    ALTER TABLE public.bell_devices
      ADD CONSTRAINT bell_devices_channel_mode_check
      CHECK (channel_mode IN ('unified', 'dual_channel'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bell_devices_volume_left_check'
  ) THEN
    ALTER TABLE public.bell_devices
      ADD CONSTRAINT bell_devices_volume_left_check
      CHECK (volume_left >= 0 AND volume_left <= 21);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bell_devices_volume_right_check'
  ) THEN
    ALTER TABLE public.bell_devices
      ADD CONSTRAINT bell_devices_volume_right_check
      CHECK (volume_right >= 0 AND volume_right <= 21);
  END IF;
END $$;

-- 3. Backfill existing devices
UPDATE public.bell_devices
SET
  channel_mode = COALESCE(channel_mode, 'unified'),
  volume_left = COALESCE(volume_left, volume, 21),
  volume_right = COALESCE(volume_right, volume, 21),
  profile_id_left = COALESCE(profile_id_left, profile_id),
  profile_id_right = COALESCE(profile_id_right, profile_id),
  channel_label_left = COALESCE(channel_label_left, 'Left Channel'),
  channel_label_right = COALESCE(channel_label_right, 'Right Channel');

-- 4. Fix update_heartbeat_with_power RPC (allow optional voltage and provide overload)
CREATE OR REPLACE FUNCTION public.update_heartbeat_with_power(
  p_device_id uuid,
  p_status text,
  p_input_voltage_mv integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bell_devices
  SET
    last_heartbeat = now(),
    status = p_status,
    input_voltage_mv = COALESCE(p_input_voltage_mv, input_voltage_mv)
  WHERE id = p_device_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_heartbeat_with_power(
  p_device_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bell_devices
  SET
    last_heartbeat = now(),
    status = p_status
  WHERE id = p_device_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_heartbeat_with_power(uuid, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_heartbeat_with_power(uuid, text) TO anon, authenticated, service_role;

-- 5. Fix register_device_from_esp to preserve customized device name and return activation
CREATE OR REPLACE FUNCTION public.register_device_from_esp(
    p_mac_address text,
    p_school_code text,
    p_device_name text DEFAULT NULL,
    p_firmware_version text DEFAULT NULL,
    p_board_type text DEFAULT 'ESP32-S3 N16R8'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_school_id uuid;
    v_device_id uuid;
    v_current_school_id uuid;
    v_school_code text;
    v_message text := 'OK';
    v_result json;
    v_act_status text := 'unactivated';
    v_sub_end_date timestamp with time zone;
    v_is_active boolean := false;
BEGIN
    -- 1. Try to resolve school_code if provided
    IF p_school_code IS NOT NULL AND TRIM(p_school_code) != '' THEN
        SELECT id, school_code INTO v_school_id, v_school_code
        FROM public.schools
        WHERE school_code = TRIM(p_school_code)
           OR (TRIM(p_school_code) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND id = TRIM(p_school_code)::uuid)
        LIMIT 1;

        IF v_school_id IS NULL THEN
            v_message := 'Invalid School Code';
        ELSE
            v_message := 'OK';
        END IF;
    END IF;

    -- 2. Check if device exists
    SELECT id, school_id, COALESCE(activation_status, 'unactivated'), subscription_end_date
    INTO v_device_id, v_current_school_id, v_act_status, v_sub_end_date
    FROM public.bell_devices
    WHERE UPPER(mac_address) = UPPER(p_mac_address);

    IF v_device_id IS NOT NULL THEN
        UPDATE public.bell_devices
        SET 
            status = 'online',
            last_heartbeat = now(),
            name = CASE 
                WHEN name IS NOT NULL AND name != 'AutoBell' AND (p_device_name IS NULL OR p_device_name = '' OR p_device_name = 'AutoBell') THEN name
                ELSE COALESCE(NULLIF(p_device_name, ''), name)
            END,
            firmware_version = COALESCE(p_firmware_version, firmware_version),
            board_type = COALESCE(p_board_type, board_type)
        WHERE id = v_device_id;
        
        IF v_current_school_id IS NULL AND v_school_id IS NOT NULL THEN
            UPDATE public.bell_devices
            SET school_id = v_school_id,
                activation_status = CASE WHEN activation_status = 'active' THEN 'active' ELSE 'pending_activation' END
            WHERE id = v_device_id;
            v_current_school_id := v_school_id;
            v_message := 'OK';
        ELSIF v_current_school_id IS NOT NULL THEN
            v_message := 'OK';
            SELECT school_code INTO v_school_code
            FROM public.schools
            WHERE id = v_current_school_id;
        END IF;
        
    ELSE
        -- Device does not exist: Create it as unactivated / pending_activation
        v_act_status := CASE WHEN v_school_id IS NOT NULL THEN 'pending_activation' ELSE 'unactivated' END;
        INSERT INTO public.bell_devices (
            mac_address, 
            name, 
            status, 
            school_id, 
            last_heartbeat, 
            firmware_version, 
            board_type,
            activation_status,
            is_paid
        )
        VALUES (
            p_mac_address, 
            COALESCE(p_device_name, 'AutoBell'), 
            'online', 
            v_school_id, 
            now(), 
            p_firmware_version, 
            p_board_type,
            v_act_status,
            false
        )
        RETURNING id INTO v_device_id;
        
        v_current_school_id := v_school_id;
        IF v_school_id IS NOT NULL THEN
            v_message := 'OK';
        END IF;
    END IF;

    -- Evaluate Active condition
    IF v_sub_end_date IS NOT NULL AND v_sub_end_date < now() THEN
        v_act_status := 'expired';
    END IF;
    v_is_active := (v_act_status = 'active');

    -- 3. Construct response
    SELECT json_build_array(
        json_build_object(
            'id', v_device_id,
            'status', 'online',
            'school_id', v_current_school_id,
            'school_code', v_school_code,
            'message', v_message,
            'activation_status', v_act_status,
            'is_activated', v_is_active,
            'subscription_end_date', v_sub_end_date
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_device_from_esp(text, text, text, text, text) TO anon, authenticated, service_role;

