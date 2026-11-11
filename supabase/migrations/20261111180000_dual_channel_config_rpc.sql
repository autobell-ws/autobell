-- Migration: Dual Channel Schedules in get_device_config
-- Provides independent schedules_left, schedules_right, volume_left, volume_right for PCM5102a Left & Right channels

CREATE OR REPLACE FUNCTION public.get_device_config(device_mac text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_device_id uuid;
    v_school_id uuid;
    v_volume integer;
    v_board_type text;
    v_channel_mode text := 'unified';
    v_volume_left integer := 21;
    v_volume_right integer := 21;
    v_profile_id_left uuid;
    v_profile_id_right uuid;
    v_channel_label_left text := 'Left Channel';
    v_channel_label_right text := 'Right Channel';
    
    v_schedule_data json;
    v_schedule_data_left json;
    v_schedule_data_right json;
    v_all_audio_data json;
    v_profile_name text;
    v_left_profile_name text;
    v_right_profile_name text;
    v_timezone_offset integer := 300;
    v_quiet_hours json;
    v_pa_enabled boolean := true;
    v_pa_url text := '';
    v_pa_delay integer := 3;
    
    -- Activation & Subscription variables
    v_act_status text := 'unactivated';
    v_sub_end_date timestamp with time zone;
    v_is_expired boolean := false;
    v_is_active boolean := false;
    
    -- Device pre-announcement overrides
    v_dev_pa_enabled boolean;
    v_dev_pa_id uuid;
    v_dev_pa_delay integer;
    
    -- School pre-announcement defaults
    v_school_pa_enabled boolean;
    v_school_pa_id uuid;
    v_school_pa_delay integer;
    v_resolved_pa_id uuid;
    
    v_active_profile_id uuid;
BEGIN
    SELECT 
        id, 
        school_id, 
        volume, 
        board_type,
        COALESCE(channel_mode, 'unified'),
        COALESCE(volume_left, volume, 21),
        COALESCE(volume_right, volume, 21),
        profile_id_left,
        profile_id_right,
        COALESCE(channel_label_left, 'Left Channel'),
        COALESCE(channel_label_right, 'Right Channel'),
        COALESCE(activation_status, 'pending_activation'),
        subscription_end_date
    INTO 
        v_device_id, 
        v_school_id, 
        v_volume, 
        v_board_type,
        v_channel_mode,
        v_volume_left,
        v_volume_right,
        v_profile_id_left,
        v_profile_id_right,
        v_channel_label_left,
        v_channel_label_right,
        v_act_status,
        v_sub_end_date
    FROM public.bell_devices
    WHERE UPPER(mac_address) = UPPER(device_mac);

    IF v_device_id IS NULL THEN
        RETURN json_build_object('error', 'Device not found');
    END IF;

    UPDATE public.bell_devices
    SET last_heartbeat = now(), status = 'online'
    WHERE id = v_device_id;

    -- Evaluate Subscription Expiry
    IF v_sub_end_date IS NOT NULL AND v_sub_end_date < now() THEN
        v_is_expired := true;
        v_act_status := 'expired';
    END IF;

    -- Evaluate Active Condition
    v_is_active := (v_act_status = 'active' AND NOT v_is_expired);

    IF NOT v_is_active OR v_school_id IS NULL THEN
        RETURN json_build_object(
            'status', 'ok',
            'is_activated', false,
            'activation_status', v_act_status,
            'is_expired', v_is_expired,
            'subscription_end_date', v_sub_end_date,
            'school_id', v_school_id,
            'profile_name', 'Activation Required',
            'volume', COALESCE(v_volume, 21),
            'channel_mode', v_channel_mode,
            'volume_left', v_volume_left,
            'volume_right', v_volume_right,
            'channel_label_left', v_channel_label_left,
            'channel_label_right', v_channel_label_right,
            'schedules', '[]'::json,
            'schedules_left', '[]'::json,
            'schedules_right', '[]'::json,
            'all_audio_files', '[]'::json
        );
    END IF;

    -- Fetch school timezone_offset
    SELECT COALESCE(s.timezone_offset, 300) INTO v_timezone_offset
    FROM public.schools s
    WHERE s.id = v_school_id;

    -- Fetch school quiet hours JSON
    SELECT json_build_object(
      'en', COALESCE(s.quiet_hours_enabled, false),
      'df', to_char(COALESCE(s.quiet_hours_disable_from, '21:00'::time), 'HH24:MI:SS'),
      'ea', to_char(COALESCE(s.quiet_hours_enable_at, '07:00'::time), 'HH24:MI:SS')
    )
    INTO v_quiet_hours
    FROM public.schools s
    WHERE s.id = v_school_id;

    -- Pre-announcement overrides & defaults
    SELECT pre_announcement_enabled, pre_announcement_id, pre_announcement_delay_seconds
    INTO v_dev_pa_enabled, v_dev_pa_id, v_dev_pa_delay
    FROM public.bell_devices
    WHERE id = v_device_id;

    SELECT COALESCE(s.pre_announcement_enabled, true), s.default_pre_announcement_id, COALESCE(s.pre_announcement_delay_seconds, 3)
    INTO v_school_pa_enabled, v_school_pa_id, v_school_pa_delay
    FROM public.schools s
    WHERE s.id = v_school_id;

    v_pa_enabled := COALESCE(v_dev_pa_enabled, v_school_pa_enabled, true);
    v_pa_delay := COALESCE(v_dev_pa_delay, v_school_pa_delay, 3);
    v_resolved_pa_id := COALESCE(v_dev_pa_id, v_school_pa_id);

    IF v_resolved_pa_id IS NOT NULL THEN
        SELECT COALESCE(file_url, '') INTO v_pa_url
        FROM public.pre_announcement_sounds
        WHERE id = v_resolved_pa_id;
    END IF;

    IF (v_pa_url IS NULL OR v_pa_url = '') THEN
        SELECT COALESCE(file_url, '') INTO v_pa_url
        FROM public.pre_announcement_sounds
        WHERE is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    -- Real audio files
    SELECT json_agg(aud) INTO v_all_audio_data FROM (
        SELECT
            af.id::text as id,
            af.id::text as audio_id,
            COALESCE(REPLACE(public.urlencode(af.storage_path), '%2F', '/'), '') as audio_url,
            COALESCE(af.duration, 0) as duration,
            COALESCE(af.track_number, 1) as track_number
        FROM public.audio_files af
        WHERE af.school_id = v_school_id
          AND (af.storage_path IS NULL OR af.storage_path NOT LIKE 'combined/%')
        ORDER BY af.created_at ASC
    ) aud;

    -- Resolve Active Profile
    SELECT id, name INTO v_active_profile_id, v_profile_name
    FROM public.bell_profiles
    WHERE school_id = v_school_id 
      AND COALESCE(board_type, 'ESP32-S3 N16R8') = COALESCE(v_board_type, 'ESP32-S3 N16R8')
      AND is_active = true
    LIMIT 1;

    IF v_active_profile_id IS NULL THEN
        SELECT id, name INTO v_active_profile_id, v_profile_name
        FROM public.bell_profiles
        WHERE school_id = v_school_id
          AND COALESCE(board_type, 'ESP32-S3 N16R8') = COALESCE(v_board_type, 'ESP32-S3 N16R8')
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    -- Resolve Left Profile (fallback to v_active_profile_id)
    IF v_profile_id_left IS NULL THEN
        v_profile_id_left := v_active_profile_id;
        v_left_profile_name := v_profile_name;
    ELSE
        SELECT name INTO v_left_profile_name FROM public.bell_profiles WHERE id = v_profile_id_left;
    END IF;

    -- Resolve Right Profile (fallback to v_active_profile_id)
    IF v_profile_id_right IS NULL THEN
        v_profile_id_right := v_active_profile_id;
        v_right_profile_name := v_profile_name;
    ELSE
        SELECT name INTO v_right_profile_name FROM public.bell_profiles WHERE id = v_profile_id_right;
    END IF;

    -- Primary Schedule Builder
    SELECT json_agg(sched) INTO v_schedule_data FROM (
        SELECT
            to_char(t.bell_time, 'HH24:MI:SS') as t,
            json_agg(DISTINCT t.d ORDER BY t.d) as d,
            COALESCE(MAX(af1.track_number), 12) as tr,
            COALESCE(MAX(af2.track_number), 0) as tr2,
            COALESCE(MAX(t.delay_seconds), 0) as ds,
            CASE
                WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN 'mp3'
                ELSE COALESCE(t.play_type, 'mp3')
            END as ty,
            CASE
                WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN ''
                WHEN t.play_type = 'tts' THEN COALESCE(t.tts_message, '')
                ELSE ''
            END as tt,
            COALESCE(bool_or(t.include_weather), false) as iw,
            COALESCE(MAX(t.label), '') as lb,
            CASE
                WHEN t.precombined_at IS NOT NULL AND (v_pa_enabled OR NOT t.precombine_chime_included) THEN
                    'combined/s_' || t.id::text || '.mp3'
                WHEN t.play_type = 'mp3' AND MAX(af1.storage_path) IS NOT NULL THEN
                    COALESCE(REPLACE(public.urlencode(MAX(af1.storage_path)), '%2F', '/'), '')
                ELSE ''
            END as audio_url,
            CASE
                WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN t.id::text
                WHEN t.play_type = 'mp3' THEN t.audio_file_id::text
                ELSE t.id::text
            END as audio_id,
            COALESCE(t.precombined_at IS NOT NULL AND t.precombine_chime_included AND v_pa_enabled, false) as pc
        FROM (
            SELECT
                bt.id,
                bt.bell_time,
                bt.audio_file_id,
                bt.audio_file_id_2,
                bt.delay_seconds,
                bt.play_type,
                bt.tts_message,
                bt.label,
                bt.precombined_at,
                bt.precombine_chime_included,
                COALESCE(bt.include_weather, false) as include_weather,
                unnest(bt.day_of_week) AS d
            FROM public.bell_times bt
            WHERE bt.profile_id = v_active_profile_id
        ) t
        LEFT JOIN public.audio_files af1 ON t.audio_file_id = af1.id
        LEFT JOIN public.audio_files af2 ON t.audio_file_id_2 = af2.id
        GROUP BY
            t.id,
            t.bell_time,
            t.audio_file_id,
            t.audio_file_id_2,
            t.play_type,
            t.tts_message,
            t.label,
            t.include_weather,
            t.precombined_at,
            t.precombine_chime_included
        ORDER BY t.bell_time
    ) sched;

    -- Left Channel Schedule
    IF v_profile_id_left = v_active_profile_id THEN
        v_schedule_data_left := v_schedule_data;
    ELSE
        SELECT json_agg(sched) INTO v_schedule_data_left FROM (
            SELECT
                to_char(t.bell_time, 'HH24:MI:SS') as t,
                json_agg(DISTINCT t.d ORDER BY t.d) as d,
                COALESCE(MAX(af1.track_number), 12) as tr,
                COALESCE(MAX(af2.track_number), 0) as tr2,
                COALESCE(MAX(t.delay_seconds), 0) as ds,
                CASE WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN 'mp3' ELSE COALESCE(t.play_type, 'mp3') END as ty,
                CASE WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN '' WHEN t.play_type = 'tts' THEN COALESCE(t.tts_message, '') ELSE '' END as tt,
                COALESCE(bool_or(t.include_weather), false) as iw,
                COALESCE(MAX(t.label), '') as lb,
                CASE WHEN t.precombined_at IS NOT NULL AND (v_pa_enabled OR NOT t.precombine_chime_included) THEN 'combined/s_' || t.id::text || '.mp3' WHEN t.play_type = 'mp3' AND MAX(af1.storage_path) IS NOT NULL THEN COALESCE(REPLACE(public.urlencode(MAX(af1.storage_path)), '%2F', '/'), '') ELSE '' END as audio_url,
                CASE WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN t.id::text WHEN t.play_type = 'mp3' THEN t.audio_file_id::text ELSE t.id::text END as audio_id,
                COALESCE(t.precombined_at IS NOT NULL AND t.precombine_chime_included AND v_pa_enabled, false) as pc
            FROM (
                SELECT bt.id, bt.bell_time, bt.audio_file_id, bt.audio_file_id_2, bt.delay_seconds, bt.play_type, bt.tts_message, bt.label, bt.precombined_at, bt.precombine_chime_included, COALESCE(bt.include_weather, false) as include_weather, unnest(bt.day_of_week) AS d
                FROM public.bell_times bt
                WHERE bt.profile_id = v_profile_id_left
            ) t
            LEFT JOIN public.audio_files af1 ON t.audio_file_id = af1.id
            LEFT JOIN public.audio_files af2 ON t.audio_file_id_2 = af2.id
            GROUP BY t.id, t.bell_time, t.audio_file_id, t.audio_file_id_2, t.play_type, t.tts_message, t.label, t.include_weather, t.precombined_at, t.precombine_chime_included
            ORDER BY t.bell_time
        ) sched;
    END IF;

    -- Right Channel Schedule
    IF v_profile_id_right = v_active_profile_id THEN
        v_schedule_data_right := v_schedule_data;
    ELSE
        SELECT json_agg(sched) INTO v_schedule_data_right FROM (
            SELECT
                to_char(t.bell_time, 'HH24:MI:SS') as t,
                json_agg(DISTINCT t.d ORDER BY t.d) as d,
                COALESCE(MAX(af1.track_number), 12) as tr,
                COALESCE(MAX(af2.track_number), 0) as tr2,
                COALESCE(MAX(t.delay_seconds), 0) as ds,
                CASE WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN 'mp3' ELSE COALESCE(t.play_type, 'mp3') END as ty,
                CASE WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN '' WHEN t.play_type = 'tts' THEN COALESCE(t.tts_message, '') ELSE '' END as tt,
                COALESCE(bool_or(t.include_weather), false) as iw,
                COALESCE(MAX(t.label), '') as lb,
                CASE WHEN t.precombined_at IS NOT NULL AND (v_pa_enabled OR NOT t.precombine_chime_included) THEN 'combined/s_' || t.id::text || '.mp3' WHEN t.play_type = 'mp3' AND MAX(af1.storage_path) IS NOT NULL THEN COALESCE(REPLACE(public.urlencode(MAX(af1.storage_path)), '%2F', '/'), '') ELSE '' END as audio_url,
                CASE WHEN t.precombined_at IS NOT NULL AND v_pa_enabled THEN t.id::text WHEN t.play_type = 'mp3' THEN t.audio_file_id::text ELSE t.id::text END as audio_id,
                COALESCE(t.precombined_at IS NOT NULL AND t.precombine_chime_included AND v_pa_enabled, false) as pc
            FROM (
                SELECT bt.id, bt.bell_time, bt.audio_file_id, bt.audio_file_id_2, bt.delay_seconds, bt.play_type, bt.tts_message, bt.label, bt.precombined_at, bt.precombine_chime_included, COALESCE(bt.include_weather, false) as include_weather, unnest(bt.day_of_week) AS d
                FROM public.bell_times bt
                WHERE bt.profile_id = v_profile_id_right
            ) t
            LEFT JOIN public.audio_files af1 ON t.audio_file_id = af1.id
            LEFT JOIN public.audio_files af2 ON t.audio_file_id_2 = af2.id
            GROUP BY t.id, t.bell_time, t.audio_file_id, t.audio_file_id_2, t.play_type, t.tts_message, t.label, t.include_weather, t.precombined_at, t.precombine_chime_included
            ORDER BY t.bell_time
        ) sched;
    END IF;

    RETURN json_build_object(
        'status', 'ok',
        'is_activated', true,
        'activation_status', 'active',
        'subscription_end_date', v_sub_end_date,
        'school_id', v_school_id,
        'timezone_offset', v_timezone_offset,
        'profile_name', COALESCE(v_profile_name, 'Unknown'),
        'profile_id_left', v_profile_id_left,
        'profile_id_right', v_profile_id_right,
        'profile_name_left', COALESCE(v_left_profile_name, v_profile_name, 'Default'),
        'profile_name_right', COALESCE(v_right_profile_name, v_profile_name, 'Default'),
        'channel_mode', v_channel_mode,
        'volume', COALESCE(v_volume, 21),
        'volume_left', COALESCE(v_volume_left, v_volume, 21),
        'volume_right', COALESCE(v_volume_right, v_volume, 21),
        'channel_label_left', COALESCE(v_channel_label_left, 'Left Channel'),
        'channel_label_right', COALESCE(v_channel_label_right, 'Right Channel'),
        'qh', COALESCE(v_quiet_hours, json_build_object('en', false, 'df', '21:00:00', 'ea', '07:00:00')),
        'pa_en', v_pa_enabled,
        'pa_url', v_pa_url,
        'pa_delay', COALESCE(v_pa_delay, 3),
        'pre_announcement_enabled', v_pa_enabled,
        'pre_announcement_url', v_pa_url,
        'pre_announcement_delay_seconds', COALESCE(v_pa_delay, 3),
        'schedules', coalesce(v_schedule_data, '[]'::json),
        'schedules_left', coalesce(v_schedule_data_left, v_schedule_data, '[]'::json),
        'schedules_right', coalesce(v_schedule_data_right, v_schedule_data, '[]'::json),
        'all_audio_files', coalesce(v_all_audio_data, '[]'::json)
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_device_config(text) TO anon, authenticated, service_role;
