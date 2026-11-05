-- Add stream_volume column to bell_devices for dedicated online stream volume control
ALTER TABLE public.bell_devices ADD COLUMN IF NOT EXISTS stream_volume integer DEFAULT 15;
