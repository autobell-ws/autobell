-- Archive.org MP3 Stream Program & Scheduler Items
CREATE TABLE IF NOT EXISTS public.archive_stream_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
    title text NOT NULL,
    url text NOT NULL,
    start_time text NOT NULL DEFAULT '08:00',
    duration_minutes integer DEFAULT 10,
    duration_seconds integer DEFAULT 0,
    days_of_week integer[] DEFAULT '{0,1,2,3,4,5,6}',
    position integer NOT NULL DEFAULT 1,
    is_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archive_stream_items_school_pos 
ON public.archive_stream_items (school_id, position);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.archive_stream_items TO anon, authenticated, service_role;
