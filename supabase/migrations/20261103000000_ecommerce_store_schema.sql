-- Migration: E-Commerce Store Schema (Products, Orders, Order Items, Subscriptions)
-- Date: 2026-11-03
-- Supports AutoBell Global Marketing & E-Commerce Storefront

-- 1. Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sku text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'hardware', -- 'hardware', 'kit', 'accessory', 'service'
    price_usd numeric NOT NULL DEFAULT 0,
    price_pkr numeric NOT NULL DEFAULT 0,
    price_aed numeric NOT NULL DEFAULT 0,
    price_sar numeric NOT NULL DEFAULT 0,
    price_eur numeric NOT NULL DEFAULT 0,
    price_gbp numeric NOT NULL DEFAULT 0,
    stock integer NOT NULL DEFAULT 100,
    image_url text,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number text UNIQUE,
    school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,
    institution_name text,
    country text NOT NULL DEFAULT 'PK',
    shipping_address text NOT NULL,
    city text,
    postal_code text,
    total_amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PKR',
    payment_gateway text NOT NULL DEFAULT 'bank_transfer', -- 'stripe', 'jazzcash', 'easypaisa', 'bank_transfer', 'paystack'
    payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    tracking_number text,
    receipt_url text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL DEFAULT 0,
    total_price numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
    plan_name text NOT NULL DEFAULT 'Standard Cloud License',
    billing_cycle text NOT NULL DEFAULT 'annual', -- 'monthly', 'annual', 'multi_year'
    start_date timestamp with time zone DEFAULT now(),
    renewal_date timestamp with time zone DEFAULT (now() + interval '1 year'),
    amount numeric NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'PKR',
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Products RLS: Anyone can view active products, super admins can manage
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = true OR is_super_admin());

DROP POLICY IF EXISTS "Super admins manage products" ON public.products;
CREATE POLICY "Super admins manage products" ON public.products
    FOR ALL USING (is_super_admin());

-- Orders RLS: Anyone can create orders (public checkout), super admins can view all, users can view their own school orders
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own school orders or super admin" ON public.orders;
CREATE POLICY "Users can view own school orders or super admin" ON public.orders
    FOR SELECT USING (
        is_super_admin()
        OR (school_id IS NOT NULL AND school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()))
        OR (customer_email = auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "Super admins manage orders" ON public.orders;
CREATE POLICY "Super admins manage orders" ON public.orders
    FOR UPDATE USING (is_super_admin());

-- Order Items RLS
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "View order items" ON public.order_items;
CREATE POLICY "View order items" ON public.order_items
    FOR SELECT USING (
        is_super_admin()
        OR order_id IN (
            SELECT id FROM public.orders 
            WHERE school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid())
            OR customer_email = auth.jwt() ->> 'email'
        )
    );

-- Subscriptions RLS
DROP POLICY IF EXISTS "View subscriptions" ON public.subscriptions;
CREATE POLICY "View subscriptions" ON public.subscriptions
    FOR SELECT USING (
        is_super_admin()
        OR school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Super admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins manage subscriptions" ON public.subscriptions
    FOR ALL USING (is_super_admin());

-- 6. Trigger for Order Number Generation
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'AB-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- 7. Seed Initial Catalog Data
INSERT INTO public.products (sku, name, description, category, price_usd, price_pkr, price_aed, price_sar, price_eur, price_gbp, stock, image_url, features)
VALUES 
(
    'AB-CTRL-S3',
    'AutoBell Core IoT Controller',
    'Dual-core ESP32-S3 DIN-rail IoT controller with 2.8" TFT color display, hardware RTC clock, RJ45 Ethernet, 2.4GHz Wi-Fi, and 10A solid-state bell relay.',
    'hardware',
    199,
    48500,
    730,
    745,
    185,
    159,
    500,
    '/images/controller.png',
    '["Dual-Core ESP32-S3 Processor", "2.8\" High-Contrast Color LCD", "100% Offline Hardware RTC Memory", "RJ45 Ethernet + 2.4GHz Wi-Fi", "10A Bell Relay Output", "24V DC UPS / Solar Inverter Ready", "DIN-Rail Industrial Mount"]'::jsonb
),
(
    'AB-SPK-HORN50',
    'Outdoor PA Horn Speaker (50W)',
    'Heavy-duty weatherproof IP66 aluminum horn speaker engineered for expansive campus assembly grounds, sports fields, and quad areas.',
    'hardware',
    79,
    19500,
    290,
    295,
    74,
    64,
    350,
    '/images/autobell_with_external_speaker.jpg',
    '["50W High Acoustic Projection", "IP66 Weatherproof / Dustproof", "Long-Range Clarity up to 250 Meters", "All-Weather Aluminum Bracket", "8 Ohm / 100V Line Compatible"]'::jsonb
),
(
    'AB-SPK-COL30',
    'Indoor Acoustic Sound Column (30W)',
    'Sleek architectural sound column speaker delivering rich voice clarity and gentle chime tones for indoor hallways, auditoriums, and administrative wings.',
    'hardware',
    65,
    16500,
    240,
    245,
    60,
    52,
    300,
    '/images/controller.png',
    '["30W Wide-Dispersion Audio", "Acoustically Tuned for Clear Voice Notice", "Slim Wall-Mount Profile", "Built-in Line Transformer", "Neutral Architectural Finish"]'::jsonb
),
(
    'AB-RELAY-EXP4',
    'Multi-Zone Relay Expansion Module',
    '4-Zone independent bell relay unit for segregated primary, secondary, college, and administrative bell timetables.',
    'accessory',
    49,
    12500,
    180,
    185,
    45,
    39,
    200,
    '/images/controller.png',
    '["4 Isolated 10A Relays", "Independent Zone Timetable Control", "LED Relay Status Indicators", "I2C/RS485 Bus Connection", "Flame-Retardant Casing"]'::jsonb
),
(
    'AB-KIT-STARTER',
    'AutoBell Campus Starter Kit',
    'The complete turnkey package: 1x AutoBell Core Controller, 1x Industrial 24V Power Supply, 2x 50W Weatherproof Horn Speakers, and 1-Year Cloud License.',
    'kit',
    349,
    84500,
    1280,
    1300,
    325,
    279,
    150,
    '/images/autobell_with_external_speaker.jpg',
    '["1x AutoBell Core IoT Controller", "2x Outdoor 50W Horn Speakers", "1x 24V Industrial Power Supply", "1-Year Cloud Schedule Management", "Pre-Configured Chimes & Plug-and-Play Setup"]'::jsonb
),
(
    'AB-KIT-ACADEMY',
    'Complete Academy Multi-Zone Bundle',
    'Enterprise campus solution: 1x AutoBell Core Controller, 4x Weatherproof Speakers, 1x 4-Zone Relay Expansion Box, 1-Year Cloud License + VIP Priority Hardware SLA.',
    'kit',
    599,
    145000,
    2200,
    2250,
    555,
    479,
    80,
    '/images/autobell_with_external_speaker.jpg',
    '["1x AutoBell Core IoT Controller", "4x Outdoor Weatherproof Speakers", "1x 4-Zone Relay Expansion Module", "Multi-Wing Independent Timetables", "1-Year Priority Hardware Replacement SLA", "Dedicated WhatsApp VIP Support Line"]'::jsonb
)
ON CONFLICT (sku) DO NOTHING;

