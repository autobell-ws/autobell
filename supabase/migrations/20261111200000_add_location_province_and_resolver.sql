-- Migration: Add location_province and auto-resolver function
ALTER TABLE public.bell_devices 
ADD COLUMN IF NOT EXISTS location_province text;

-- Update update_device_location RPC to support province
CREATE OR REPLACE FUNCTION public.update_device_location(
  p_device_id uuid,
  p_location_city text,
  p_location_country text,
  p_location_area text DEFAULT NULL::text,
  p_location_continent text DEFAULT NULL::text,
  p_location_province text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_city text;
  v_country text;
  v_area text;
  v_continent text;
  v_province text;
BEGIN
  -- Sanitize inputs
  v_city := NULLIF(TRIM(p_location_city), '');
  IF lower(v_city) = 'null' OR lower(v_city) = 'undefined' THEN
    v_city := NULL;
  END IF;

  v_country := NULLIF(TRIM(p_location_country), '');
  IF lower(v_country) = 'null' OR lower(v_country) = 'undefined' THEN
    v_country := NULL;
  END IF;

  v_area := NULLIF(TRIM(p_location_area), '');
  IF lower(v_area) = 'null' OR lower(v_area) = 'undefined' THEN
    v_area := NULL;
  END IF;

  v_continent := NULLIF(TRIM(p_location_continent), '');
  IF lower(v_continent) = 'null' OR lower(v_continent) = 'undefined' THEN
    v_continent := NULL;
  END IF;

  v_province := NULLIF(TRIM(p_location_province), '');
  IF lower(v_province) = 'null' OR lower(v_province) = 'undefined' THEN
    v_province := NULL;
  END IF;

  UPDATE public.bell_devices
  SET
    location_city = COALESCE(v_city, location_city),
    location_country = COALESCE(v_country, location_country),
    location_area = COALESCE(v_area, location_area),
    location_province = COALESCE(v_province, location_province),
    location_continent = COALESCE(v_continent, location_continent),
    location_updated_at = now()
  WHERE id = p_device_id;
END;
$function$;
