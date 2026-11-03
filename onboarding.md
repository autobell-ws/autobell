# Master Implementation Prompt: Zero-Touch Commercial Retail Onboarding & Activation System for AutoBell

> **Document Type:** Master Implementation Blueprint & Autonomous Execution Prompt  
> **Target Audience:** Engineering Team / AI Autonomous Agents  
> **Applicable Products:** AutoBell Pro S3, AutoBell Mini, Mobile App (React Native/Expo), Web Dashboard, Supabase Backend, Factory Batch Tooling.  
> **Core Objective:** Enable AutoBell to be sold off-the-shelf in retail shops, electronics markets, and through educational distributors. Any customer (school head, administrator, factory manager) must be able to take the device out of the box, connect it to WiFi, pair it with their smartphone or web dashboard, and have it immediately active with a 1-Year Free Cloud Service **without any manual intervention, phone call, ticket, or approval from the AutoBell Super Admin / Owner**.

---

## 1. Executive Summary & Architecture Overview

Currently, onboarding requires either pre-configuring devices or manual Super Admin intervention:
1. Devices use a static setup SSID (`AutoBell-Setup`), causing network collisions when multiple units are powered nearby.
2. The firmware's captive portal asks customers for developer credentials (`Supabase URL`, `Supabase Anon Key`, and `School UUID`), which no non-technical retail customer can provide.
3. The database migration marks newly claimed devices as `pending_activation`, requiring the Super Admin to manually approve tickets or review payment slips.
4. Neither the Mobile App nor the Web Dashboard has a public self-serve registration flow for new schools.

This prompt provides the end-to-end specification and code to replace that legacy model with a **consumer-grade, zero-friction 3-step onboarding pipeline**:

```
+----------------------------------------------------------------------------------------------------+
|                                    THE 2-MINUTE CUSTOMER JOURNEY                                   |
|                                                                                                    |
|   [ Step 1: Unbox & Power ]       [ Step 2: Connect WiFi ]          [ Step 3: Scan QR & Activate ] |
|   Customer plugs 12V DC power     Phone connects to dynamic         Customer scans box QR in app.  |
|   into AutoBell & speaker.        hotspot "AutoBell-XXXX".          Instant validation of Serial   |
|   Status LED pulses Blue.         Captive portal asks ONLY for      & Claim PIN. 1-Year Free Cloud |
|   Hotspot broadcasts.             school WiFi SSID & Password.      instantly active. Ready!       |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Retail Packaging, Hardware Identity & Security

### 2.1 The Retail Box & Controller Label
Every manufactured AutoBell unit must have a tamper-evident label applied to the **controller back** and duplicated on the **outside of the retail box**:

```
+-------------------------------------------------------------------------+
|  [ AutoBell Logo ]                           Model: AutoBell Pro S3     |
|                                                                         |
|      +----------------+       Scan with AutoBell App to Pair            |
|      |  ############  |       Serial Number : AB-2026-94812             |
|      |  ## QR CODE ## |       Claim PIN     : 648-291                   |
|      |  ############  |       WiFi Hotspot  : AutoBell-9481             |
|      +----------------+                                                 |
|                                                                         |
|   🎁 Includes 12 Months Complimentary Cloud Schedule & Announcement Hub |
+-------------------------------------------------------------------------+
```

### 2.2 Security Model: Serial Number + 6-Digit Claim PIN
- **Anti-Sniffing / Anti-Theft Guard:** A simple sequential Serial Number is vulnerable to brute-force claiming.
- Each device is provisioned at the factory with a cryptographically random **6-digit Claim PIN** (e.g. `648291`).
- The database stores only the `SHA-256` hash of this PIN.
- To claim a device, the user must provide both the **Serial Number** and the **Claim PIN** (or scan the QR code containing both).

### 2.3 Universal QR Code Payload
The QR code encodes a universal URI deep link:
```text
https://app.autobell.pk/setup?sn=AB-2026-94812&pin=648291
```
- **Mobile App Installed:** Deep link opens the AutoBell app directly into the "Device Claimed" confirmation screen.
- **Web Fallback:** If scanned with a standard camera on a laptop or phone without the app, it redirects to the responsive Web Dashboard onboarding page with the Serial & PIN already populated.

---

## 3. Firmware Architecture (Zero Developer Leakage)

> *Notice for Firmwares:* When updating firmware, keep existing bell logic and scheduling intact. Replace the legacy WiFiManager setup portal with the modern consumer configuration portal below.

### 3.1 Dynamic Hotspot SSID
The ESP32 must not broadcast a generic `AutoBell-Setup`. It must dynamically generate its SSID based on the last 4 characters of its hardware MAC address:
```cpp
uint8_t mac[6];
WiFi.macAddress(mac);
char apSsid[32];
snprintf(apSsid, sizeof(apSsid), "AutoBell-%02X%02X", mac[4], mac[5]);
```

### 3.2 Purged Captive Portal (Removing Technical Inputs)
Remove all custom parameters requesting:
- `Supabase URL` *(bake into firmware build config)*
- `Supabase Anon Key` *(bake into firmware build config)*
- `School ID / UUID` *(resolved automatically in the cloud upon claim)*
- `Device Name` *(set automatically by the customer in their mobile app)*

The captive portal must contain **strictly two fields**:
1. **Network Name (SSID):** Auto-scanned dropdown of 2.4 GHz WiFi networks with signal strength bars.
2. **WiFi Password.**

### 3.3 Visual & Audio State Machine

| Hardware Event | LED Behavior | Audio / Speaker Prompt |
| :--- | :--- | :--- |
| **Boot / Setup Mode (Hotspot active)** | Pulsing Blue | Short 1-tone chime |
| **Connecting to WiFi** | Fast Blinking Amber | Silent |
| **Connected to Internet & Cloud** | Solid Green | 2-tone rising chime (or: *"AutoBell connected to WiFi"*) |
| **Device Claimed by Customer** | 3 Green Flashes then Solid | Pleasant bell strike (or: *"AutoBell activated for [School]"*) |
| **WiFi Failed / Wrong Password** | Slow Blinking Red | Low buzz tone |

### 3.4 Hardware Factory Reset Button
If a customer moves the device to a new WiFi network or changes their router password:
- Holding the physical **BOOT / SETUP button for 10 seconds** clears the NVS WiFi credentials and reboots the ESP32 directly into the `AutoBell-XXXX` setup hotspot mode.

---

## 4. Database & Cloud Activation Engine (Supabase / PostgreSQL)

Apply the following migration to enable self-serve registration, Claim PIN verification, and instantaneous 1-Year Free Cloud activation.

### 4.1 Migration SQL: `20261104000000_retail_zero_touch_onboarding.sql`

```sql
-- ==============================================================================
-- AUTOBELL ZERO-TOUCH RETAIL ONBOARDING & ACTIVATION SYSTEM
-- ==============================================================================

-- 1. Extend device_inventory for retail distribution & PIN authentication
ALTER TABLE public.device_inventory
ADD COLUMN IF NOT EXISTS claim_pin_hash text,
ADD COLUMN IF NOT EXISTS wholesale_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS warranty_months int DEFAULT 12;

-- 2. Self-Serve Customer & School Registration RPC
CREATE OR REPLACE FUNCTION public.register_customer_and_school(
    p_admin_name text,
    p_school_name text,
    p_campus_name text DEFAULT 'Main Campus',
    p_city text DEFAULT 'Default City',
    p_phone text DEFAULT ''
)
RETURNS json AS $$
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

    -- 1. Create the new School
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
        'paid', -- Trial / Retail Bundle
        now() + interval '1 year'
    )
    RETURNING id INTO v_school_id;

    -- 2. Link User as School Admin
    UPDATE public.users
    SET school_id = v_school_id,
        role = 'admin',
        full_name = TRIM(p_admin_name)
    WHERE id = v_user_id;

    -- 3. Create Default Bell Profile (Standard 8-Period Bell Schedule)
    INSERT INTO public.profiles (school_id, name, is_active)
    VALUES (v_school_id, 'Standard School Schedule', true);

    RETURN json_build_object(
        'success', true,
        'school_id', v_school_id,
        'school_name', p_school_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.register_customer_and_school(text, text, text, text, text) TO authenticated;


-- 3. Zero-Touch Device Claim & Activation RPC
CREATE OR REPLACE FUNCTION public.claim_and_activate_device(
    p_serial_number text,
    p_claim_pin text,
    p_device_name text
)
RETURNS json AS $$
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
    WHERE id = auth.uid() AND role IN ('admin', 'school_admin');

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
    v_pin_cleaned := REPLACE(TRIM(p_claim_pin), '-', '');
    IF v_inventory.claim_pin_hash IS NOT NULL THEN
        v_computed_hash := encode(digest(v_pin_cleaned, 'sha256'), 'hex');
        IF v_inventory.claim_pin_hash <> v_computed_hash AND v_inventory.claim_pin_hash <> v_pin_cleaned THEN
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
    ));

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.claim_and_activate_device(text, text, text) TO authenticated;
```

---

## 5. Mobile App Implementation (React Native / Expo)

### 5.1 Self-Serve Customer Signup Screen (`mobile-app/src/screens/RegisterScreen.tsx`)
Add a clean registration screen accessible directly from the login page:
- Inputs: Admin Full Name, School Name, Campus Name, City, Phone, Email, Password.
- Logic:
  ```ts
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) throw authError;

  const { error: rpcError } = await supabase.rpc('register_customer_and_school', {
    p_admin_name: fullName,
    p_school_name: schoolName,
    p_campus_name: campusName || 'Main Campus',
    p_city: city,
    p_phone: phone
  });
  if (rpcError) throw rpcError;
  ```

### 5.2 Device Onboarding & QR Scanner Screen (`mobile-app/src/screens/ClaimDeviceScreen.tsx`)
Provide a guided 3-step setup modal with a live camera QR scanner:
1. **Camera Scanner:** Uses `expo-camera` or `react-native-camera` to scan the label QR code.
2. **Auto-Parser:** Automatically parses `sn` and `pin` from deep link URL:
   ```ts
   function parseQR(qrString: string) {
     try {
       const url = new URL(qrString);
       const sn = url.searchParams.get('sn');
       const pin = url.searchParams.get('pin');
       return { sn, pin };
     } catch {
       // Support raw string fallback: "SN:PIN"
       const parts = qrString.split(':');
       return { sn: parts[0], pin: parts[1] };
     }
   }
   ```
3. **Claim Execution:** Calls `claim_and_activate_device`:
   ```ts
   const { data, error } = await supabase.rpc('claim_and_activate_device', {
     p_serial_number: serialNumber,
     p_claim_pin: claimPin,
     p_device_name: deviceName || 'Main Campus Bell'
   });
   ```
4. **Celebration & Sound Test Screen:**
   - Shows green checkmark with *"Device Activated Successfully!"*
   - Displays 1-Year Free Service expiry date.
   - Provides an immediate **"Ring Test Bell"** button sending a 2-second test chime via `command_queue` to confirm end-to-end operation.

---

## 6. Web Dashboard Implementation

### 6.1 Public Self-Serve Registration Page (`web-dashboard/src/pages/Register.tsx`)
Create a public route `/register` with matching modern styling, linked from `Login.tsx`:
- Replaces the message *"Access is restricted to authorized personnel only"* with:  
  *"New customer? Register your school and claim your AutoBell."*

### 6.2 Deep Link Claim Route (`web-dashboard/src/pages/ClaimDevice.tsx` / `/setup`)
- Listens for query parameters `?sn=...&pin=...`.
- If the customer is not logged in: saves the query parameters in `localStorage`, prompts registration/login, and executes claim immediately upon login.
- If already logged in: opens the Claim Confirmation Dialog, pre-fills Serial Number & PIN, and executes 1-click activation.

---

## 7. Factory Batch Provisioning Tool (CLI Script)

Create a Node.js utility script `scripts/factory-batch-generator.mjs` used in manufacturing:

```javascript
/**
 * Factory Batch Generator
 * Usage: node scripts/factory-batch-generator.mjs --batch 2026-B1 --count 50 --model S3
 * Generates serial numbers, MAC addresses, random 6-digit Claim PINs, computes SHA-256 hashes,
 * inserts rows into `device_inventory`, and exports a printable CSV for sticker barcode printers.
 */
```

### Script Specifications:
1. Generates Serial Numbers: `AB-S3-2026-0001` to `AB-S3-2026-0050`.
2. Generates random 6-digit PINs (e.g., `582910`).
3. Computes `SHA-256` of each PIN for the database `claim_pin_hash`.
4. Generates QR Code data URL: `https://app.autobell.pk/setup?sn=AB-S3-2026-0001&pin=582910`.
5. Outputs:
   - Direct SQL / Supabase insert into `public.device_inventory`.
   - `labels_batch_2026_B1.csv` formatted for standard thermal label printers (Zebra / TSC / Brother).

---

## 8. Reseller & Distributor Consignment Subsystem

To manage wholesale distribution cleanly:
1. **Consignment Allocation:**
   When 20 units are shipped to reseller "Apex Educational Tech", the Super Admin runs:
   ```sql
   UPDATE public.device_inventory
   SET wholesale_partner_id = '<partner_id>',
       sold_at = now()
   WHERE serial_number IN ('AB-S3-2026-0001', 'AB-S3-2026-0002', ...);
   ```
2. **Reseller Dashboard Visibility:**
   Resellers can log into their Partner Portal (`/partner`) and view their allocated inventory:
   - **Units Received:** 20
   - **Activated by Customers:** 14
   - **On Shelf in Shop:** 6
3. **Automated Commission Trigger:**
   When `claim_and_activate_device` executes, if `wholesale_partner_id` is present, it writes an entry into partner commissions/rewards automatically.

---

## 9. Failure Modes & Edge Case Recovery

| Edge Case | Failure Scenario | Automated Recovery Workflow |
| :--- | :--- | :--- |
| **School changes WiFi router / password** | Device cannot connect to cloud; shows red blinking LED. | User holds the **BOOT** button for 10 seconds. Device restarts hotspot `AutoBell-XXXX`. User reconnects phone and submits new WiFi password. Device claims remain intact. |
| **Customer types wrong Claim PIN** | User mistypes 6-digit PIN. | Clear error message: *"Invalid PIN. Please verify the 6-digit PIN on the label under your device."* Brute-force rate limiting (max 5 failed attempts per 15 minutes). |
| **Device claimed before connecting to WiFi** | User scans QR code while device is still in the box. | Cloud registers the device claim immediately. When the device is later plugged in and connects to WiFi, its heartbeat matches the MAC address and instantly synchronizes all schedules. |
| **Second-hand resale / School relocation** | School sells device to another institution. | Current owner clicks **"Release / Unlink Device"** in their dashboard. The device returns to `unclaimed` state in inventory, ready to be paired with a new school. |

---

## 10. Execution Checklist for Autonomous Implementation

When implementing this system, follow this ordered checklist:

- [ ] **Step 1: Database Migration**
  - Deploy `20261104000000_retail_zero_touch_onboarding.sql`.
  - Verify `register_customer_and_school` and `claim_and_activate_device` RPC permissions and execution.
- [ ] **Step 2: Factory CLI Script**
  - Implement `scripts/factory-batch-generator.mjs` for batch label generation.
- [ ] **Step 3: Web Dashboard Self-Serve & Setup Route**
  - Create `/register` self-serve customer registration page.
  - Create `/setup` deep-link claim handler.
  - Update `DeviceRegistrationModal.tsx` to accept Serial Number and 6-digit Claim PIN.
- [ ] **Step 4: Mobile App Self-Serve & Camera Scanner**
  - Add registration screen in `mobile-app`.
  - Integrate QR Code scanner in `ClaimDeviceScreen`.
  - Add instant chime sound test trigger after pairing.
- [ ] **Step 5: Firmware Captive Portal Update**
  - Clean `WiFiManager` portal parameters (remove Supabase URL, Key, UUID).
  - Implement dynamic SSID `AutoBell-XXXX` based on chip MAC address.
  - Verify 10-second button hold for WiFi reset.
- [ ] **Step 6: End-to-End Simulation Test**
  - Simulate complete flow from unboxing to first bell ring without Super Admin involvement.

