-- Migration: 20261003233000_fix_broadcast_duplicate_polling.sql
-- Description:
-- 1. Auto-expire real-time broadcast commands (VOICE_NOTE, TTS, PLAY_URL, RING) after 3 minutes in poll_commands
--    to prevent stale replay 10-15 minutes later.
-- 2. Enhance ack_command to use case-insensitive MAC matching so ESP32 can always acknowledge commands.

CREATE OR REPLACE FUNCTION public.poll_commands(device_mac text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device_id uuid;
    v_cmd record;
    v_pending_count integer;
BEGIN
    SELECT id INTO v_device_id 
    FROM public.bell_devices 
    WHERE UPPER(mac_address) = UPPER(device_mac) 
    LIMIT 1;

    IF v_device_id IS NULL THEN
        RETURN '{"has_command": false, "pending_count": 0}'::json;
    END IF;

    -- 1. Expire real-time broadcast commands older than 3 minutes (prevent delayed playback)
    UPDATE public.command_queue
    SET status = 'expired', executed_at = now()
    WHERE device_id = v_device_id
      AND LOWER(status) = 'pending'
      AND command IN ('VOICE_NOTE', 'TTS', 'PLAY_URL', 'RING')
      AND created_at < (now() - INTERVAL '3 minutes');

    -- 2. Expire any other pending commands older than 1 hour (e.g. stale config/volume)
    UPDATE public.command_queue
    SET status = 'expired', executed_at = now()
    WHERE device_id = v_device_id
      AND LOWER(status) = 'pending'
      AND created_at < (now() - INTERVAL '1 hour');

    -- 3. Auto-supersede duplicate SET_VOLUME keeping only the newest
    WITH latest_volume AS (
        SELECT id
        FROM public.command_queue
        WHERE device_id = v_device_id
          AND command = 'SET_VOLUME'
          AND LOWER(status) = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
    )
    UPDATE public.command_queue
    SET status = 'superseded', executed_at = now()
    WHERE device_id = v_device_id
      AND command = 'SET_VOLUME'
      AND LOWER(status) = 'pending'
      AND id NOT IN (SELECT id FROM latest_volume);

    -- 4. Get total active pending count
    SELECT COUNT(*) INTO v_pending_count 
    FROM public.command_queue 
    WHERE device_id = v_device_id 
      AND LOWER(status) = 'pending';

    -- 5. Select the oldest pending command
    SELECT id, command, payload INTO v_cmd 
    FROM public.command_queue 
    WHERE device_id = v_device_id 
      AND LOWER(status) = 'pending' 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_cmd.id IS NOT NULL THEN
        -- Mark as executed immediately upon pop
        UPDATE public.command_queue 
        SET status = 'executed', executed_at = now() 
        WHERE id = v_cmd.id;

        RETURN json_build_object(
            'has_command', true,
            'id', v_cmd.id,
            'command', v_cmd.command,
            'payload', v_cmd.payload,
            'pending_count', GREATEST(v_pending_count - 1, 0)
        );
    END IF;

    RETURN json_build_object('has_command', false, 'pending_count', 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.poll_commands(text) TO anon, authenticated, service_role;

-- Enhance ack_command with case-insensitive MAC matching
CREATE OR REPLACE FUNCTION public.ack_command(p_command_id bigint, p_device_mac text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device_id uuid;
BEGIN
    IF p_device_mac IS NOT NULL THEN
        SELECT id INTO v_device_id 
        FROM public.bell_devices 
        WHERE UPPER(mac_address) = UPPER(p_device_mac) 
        LIMIT 1;

        IF v_device_id IS NOT NULL THEN
            UPDATE public.command_queue 
            SET status = 'executed', executed_at = now() 
            WHERE id = p_command_id AND device_id = v_device_id;
        END IF;
    ELSE
        IF auth.uid() IS NOT NULL THEN
            UPDATE public.command_queue 
            SET status = 'executed', executed_at = now() 
            WHERE id = p_command_id;
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ack_command(bigint, text) TO anon, authenticated, service_role;
