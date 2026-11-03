-- Migration: Cleanse proprietary hardware names from public products catalog
-- Date: 2026-11-03

UPDATE public.products
SET description = 'High-performance DIN-rail IoT controller with 2.8" TFT color display, hardware RTC clock, RJ45 Ethernet, 2.4GHz Wi-Fi, and 10A solid-state bell relay.',
    features = '["Proprietary Dual-Core High-Speed Processor", "2.8\" High-Contrast Color LCD", "100% Offline Hardware RTC Memory", "RJ45 Ethernet + 2.4GHz Wi-Fi", "10A Bell Relay Output", "24V DC UPS / Solar Inverter Ready", "DIN-Rail Industrial Mount"]'::jsonb
WHERE sku = 'AB-CTRL-S3';

