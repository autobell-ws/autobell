-- Migration: Add missing label and include_weather columns to bell_times
ALTER TABLE public.bell_times ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.bell_times ADD COLUMN IF NOT EXISTS include_weather boolean DEFAULT false;
