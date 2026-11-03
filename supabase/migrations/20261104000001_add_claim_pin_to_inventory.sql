-- Add optional plaintext claim_pin column for sticker label generation & factory tracking
ALTER TABLE public.device_inventory
ADD COLUMN IF NOT EXISTS claim_pin text;

