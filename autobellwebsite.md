# AutoBell Worldwide Platform: Master Implementation Prompt

**Official Website Domain:** [https://www.autobell.pk](https://www.autobell.pk)  
**Platform Type:** Unified Public Marketing, E-Commerce Store & Multi-Role SaaS IoT Portal  
**Target Global Markets:** Pakistan (Primary Anchor), Middle East & GCC, Africa, and Europe (UK & EU)

---

## 1. Project Overview & Vision

You are tasked with building the official, production-grade, globally accessible website and web platform for **AutoBell** hosted at **www.autobell.pk**.

AutoBell is an enterprise-grade, cloud-managed SaaS + IoT hardware ecosystem that automates school bells, scheduled chimes, pre-announcement audio jingles, automated Text-to-Speech (TTS) notices, and instant campus emergency lockdown sirens for educational institutions worldwide.

### The Unified Architecture Goal
The website `www.autobell.pk` must seamlessly serve two interconnected experiences under a single, unified domain:
1. **Public-Facing Portal & E-Commerce Store:** World-class marketing website, interactive hardware showcase, audio chime previewer, ROI calculator, and multi-currency checkout for purchasing AutoBell hardware kits and SaaS subscriptions.
2. **Unified Login & Multi-Role App Gateway:** A single `/login` authentication screen powered by Supabase GoTrue Auth that automatically detects user roles and routes them to their dedicated application portal:
   - **Super Admin (`super_admin`):** Global hardware inventory, tenant school oversight, device provisioning, partner management, firmware OTA updates, and system health telemetry (`/super-admin`).
   - **School Admin / Customer (`school_admin` / `operator`):** Campus bell schedules, profile switching (Regular, Exam, Ramadan, Half-Day), audio broadcasts, TTS notices, emergency lockdown trigger, and device settings (`/dashboard`).
   - **Channel Partner / Reseller (`partner`):** Deal tracking, prospective campus leads, commission payouts, and hardware sales (`/partner`).
   - **Campus Staff / Teacher (`staff` / `teacher`):** Read-only timetable access and authorized live broadcast trigger.

---

## 2. Global Strategy & Regional Customization

The platform serves worldwide educational institutions with specialized localization, payment gateways, and feature sets for four core regions:

### A. Pakistan (Primary Anchor Market)
* **Local Currency:** Pakistani Rupee (`PKR` / `Rs.`).
* **Core Pain Points Addressed:** 
  - Severe electrical load-shedding and power fluctuations.
  - Unpunctual manual bell staff (peons) resulting in lost instructional minutes.
  - Complex mechanical timer boxes that drift out of sync.
* **AutoBell Selling Points:**
  - **100% Offline RTC Memory:** Bells ring with atomic precision from local flash memory even during internet drops and power restoration.
  - **Power Inverter / Solar Ready:** 24V DC input compatible with school UPS and solar systems.
* **Cultural & Religious Schedules:**
  - Dedicated Friday prayer (Jumu'ah) timetable automation.
  - Ramadan special school hours profiles.
  - Pre-Adhan and Adhan chimes with customizable 2–5 second pause delays.
* **Payment Gateways:**
  - JazzCash, EasyPaisa, 1Link / PayFast Direct Bank Debit, Direct Bank Wire Upload, and Stripe PKR.
* **Local Lead Capture & Support:**
  - Sticky floating WhatsApp sales button pre-configured with Pakistani business line (+92) for direct communication with school decision-makers.

### B. Middle East & GCC (UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain)
* **Local Currency:** `AED`, `SAR`, `QAR`, `USD`.
* **Language & Layout:** Full bilingual support with English & Modern Standard Arabic, including an **RTL (Right-to-Left)** layout switch.
* **Regional Features:**
  - Automated prayer times calculation (Fajr, Dhuhr, Asr) integrated into campus bells.
  - Ministry of Education academic calendar compliance.
  - Heat-resistant rugged industrial hardware casing certified for Gulf climate conditions.
* **Payment & Procurement:**
  - Stripe (Credit/Debit Cards, Apple Pay, Mada for KSA), Corporate Invoicing & Purchase Orders (PO).

### C. Africa (Nigeria, Kenya, South Africa, Egypt, Ghana)
* **Local Currency:** `USD`, `NGN`, `KES`, `ZAR`, `EGP`.
* **Core Value Proposition:**
  - Ultra-resilient over intermittent GSM/Wi-Fi networks with low-bandwidth sync.
  - Affordable multi-campus hardware packages with volume discounts.
* **Payment Gateways:**
  - Paystack, Flutterwave, M-Pesa, and Stripe.

### D. Europe (UK, EU, Nordics)
* **Local Currency:** `EUR` (€), `GBP` (£), `USD` ($).
* **Compliance & Trust:**
  - Strict GDPR compliance (cookie consent manager, EU data processing options, Data Processing Agreement downloads).
  - CE & RoHS certification badges.
  - Automatic Daylight Saving Time (BST / CET) clock adjustments.
* **Payment Gateways:**
  - Stripe (SEPA Direct Debit, Credit Cards, Apple Pay, Google Pay, Klarna/iDEAL), B2B VAT reverse-charge automated invoicing.

---

## 3. Information Architecture & Route Hierarchy

```
www.autobell.pk/
├── / (Homepage — Hero, Hardware + Speaker Showcase, Soundboard, ROI Calculator, Testimonials)
├── /products (Detailed Hardware Specifications: Controller, Horn Speakers, Sound Columns, Relays)
├── /pricing (Interactive Multi-Currency Hardware & SaaS Cloud Bundles)
├── /solutions
│   ├── /solutions/k12-schools (Primary & Secondary Schools)
│   ├── /solutions/colleges-universities (Multi-Building Campuses)
│   └── /solutions/faith-schools (Madrasas & Faith Academies)
├── /buy (E-Commerce Kit Customizer & Multi-Step Checkout Wizard)
├── /calculator (Lost Teaching Hours & Financial Payback Calculator)
├── /demo (Interactive Virtual Bell Soundboard & Live Video Demo Booking)
├── /partners (School IT Resellers & Distributor Portal Sign-up)
├── /about & /contact
├── /legal (Privacy Policy, Terms of Service, GDPR Compliance, Hardware Warranty)
│
├── /login (Unified Authentication Gateway)
│   ├── [Redirects -> /super-admin] (if role === 'super_admin')
│   ├── [Redirects -> /dashboard]   (if role === 'school_admin' || role === 'operator')
│   └── [Redirects -> /partner]     (if role === 'partner')
```

---

## 4. Key Public Pages & Component Specifications

### 1. Homepage (`/`)
* **Header / Navigation:**
  - AutoBell Logo, Links: *Products*, *Solutions*, *Pricing*, *Audio Demo*, *Partners*.
  - Right Actions: *Country/Currency Selector Dropdown* (Auto-detected via GeoIP), *Login Button* (routes to `/login`), and high-contrast *Order Kit / Book Demo* CTA button.
* **Hero Section:**
  - **Headline:** *"The Smart IoT School Bell & PA Audio Management Platform."*
  - **Subheadline:** *"Eliminate manual bell delays, automate period timetables from your smartphone, and broadcast crystal-clear audio campus-wide — 100% offline reliable."*
  - **Primary CTAs:** `[Order Starter Kit]` (links to `/buy`) & `[Listen to Chimes]` (opens interactive soundboard).
  - **Hero Visual:** High-resolution product showcase featuring the DIN-rail mounted AutoBell Controller (2.8" LCD, green/cyan status LEDs, RJ45 cable) wired alongside a wall-mounted external campus PA horn speaker.
* **Trust & Proof Ticker:**
  - Metric counters: *"100+ Campuses Modernized | 1,000,000+ Bells Executed with 0 Delay | 99.99% Hardware Reliability"*.
* **Interactive Soundboard Preview:**
  - In-browser interactive audio player letting principals audition real tones:
    1. *Classic Westminster Chime*
    2. *Soft Acoustic Marimba*
    3. *Pre-Announcement Chime + 3s Pause + Voice Notice*
    4. *Continuous Emergency Evacuation Siren*
* **Core Value Grid (Interactive Feature Cards):**
  - **1-Tap Profile Switch:** Seamlessly switch between Normal, Exam, Half-Day, or Ramadan schedules.
  - **Zero-Downtime Offline Memory:** Internal LittleFS flash & RTC chip ring bells even during internet outages or power cuts.
  - **Text-to-Speech & Live Mic:** Type announcements or broadcast live voice to any classroom speaker zone.
  - **Instant Emergency Lockdown:** High-priority override slider triggers campus-wide lockdown sirens.
* **Interactive ROI & Lost-Minutes Calculator:**
  - Sliders for *Number of Classrooms* and *Average Daily Periods*.
  - Calculates: *"Your campus loses ~24 instructional hours per month with manual bells. AutoBell pays for itself in 3 weeks."*
* **Customer Testimonials & School Logos:**
  - Case studies from school principals and administrators across Pakistan, UAE, UK, and Africa.
* **Footer:**
  - Multi-region contact numbers (WhatsApp +92 for Pakistan, +971 for GCC, +44 for UK/Europe), ISO/CE compliance badges, social media links, and newsletter signup.

### 2. Hardware Showcase (`/products`)
* Detailed technical breakdowns with high-res zoomable photos of:
  - **AutoBell Core IoT Controller:** Dual-core ESP32-S3, 2.8" TFT color screen, industrial DIN-rail casing, RJ45 Ethernet, 2.4GHz Wi-Fi, 24V In, 10A Bell Relay Out, USB-C programming port, hardware watchdog.
  - **High-Output Outdoor PA Horn Speaker (30W / 50W):** Weatherproof IP66 horn speaker for open fields, playgrounds, and assembly grounds.
  - **Indoor Acoustic Wall Sound Column (15W / 30W):** Elegant acoustic wall speaker for corridors, auditoriums, and administrative offices.
  - **Relay Expansion Box:** Multi-zone control module for separate primary, secondary, and administrative wing bells.
  - **Downloadable PDF Datasheet & Architectural Spec Sheet** for school IT directors.

### 3. Pricing & E-Commerce Flow (`/pricing` & `/buy`)
* **Currency Switcher:** Auto-detects visitor IP or allows manual switch between `USD ($)`, `PKR (Rs.)`, `SAR (﷼)`, `AED (د.إ)`, `EUR (€)`, `GBP (£)`.
* **Hardware Kits:**
  - **Basic Kit:** 1x AutoBell Controller + Power Adapter + Mounting Hardware.
  - **Campus Standard Kit:** 1x AutoBell Controller + 2x Outdoor Horn Speakers + Connecting Relays.
  - **Complete Academy Bundle:** 1x AutoBell Controller + 4x Weatherproof Speakers + 1-Year Priority Hardware Replacement SLA.
* **SaaS Cloud Subscriptions:**
  - **Annual Cloud License:** Remote web/mobile schedule management, unlimited profile switches, unlimited TTS announcements, automated daily backups, and OTA firmware updates.
* **Checkout Engine (`/buy`):**
  - **Step 1:** Configure School Profile (Institution Name, Campus Address, Contact Person, Estimated Students).
  - **Step 2:** Select Hardware Package & Optional Add-on Speakers.
  - **Step 3:** Select Cloud SaaS Plan (Annual or Multi-Year with discount).
  - **Step 4:** Dynamic Payment Gateway Integration:
    - *Pakistan:* JazzCash / EasyPaisa API, 1Link Direct Bank Debit, or Manual Bank Wire slip upload.
    - *Europe / Middle East / Americas:* Stripe Elements (Credit Cards, Apple Pay, Google Pay, SEPA, Mada).
    - *Africa:* Paystack / Flutterwave.
  - **Step 5 (Post-Purchase Automated Provisioning):**
    - The checkout webhook triggers a Supabase Edge Function that automatically creates the customer's school tenant in `schools`, creates their admin account in `auth.users`, assigns the `school_admin` role in `user_roles`, reserves their hardware MAC/Serial from `device_inventory`, and emails them an instant Setup Wizard & Login link!

---

## 5. Unified Login & Multi-Role Gateway (`/login`)

The website features a single, beautifully designed login portal at `/login`:
* **Branded Interface:** Deep Navy Blue and Cyan Teal theme with dynamic school greetings.
* **Authentication Provider:** Supabase GoTrue Auth (Email & Password, Magic Link, and optional Google Workspace SSO for schools).
* **Role-Based Redirect Matrix (Post-Login Hook):**
  ```typescript
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  switch (userRole?.role) {
    case 'super_admin':
      navigate('/super-admin');
      break;
    case 'school_admin':
    case 'operator':
      navigate('/dashboard');
      break;
    case 'partner':
      navigate('/partner');
      break;
    case 'teacher':
    case 'staff':
      navigate('/dashboard/broadcast');
      break;
    default:
      navigate('/dashboard');
  }
  ```
* **Impersonation Support:** Maintains the existing Super Admin impersonation banner allowing platform admins to debug customer dashboards seamlessly.

---

## 6. Technical Stack & Architecture Guidelines

* **Frontend Framework:** React 18 with Vite, TypeScript, Tailwind CSS, Lucide React icons, and Framer Motion.
* **Design Tokens & Brand Colors:**
  - Primary Authority: Deep Navy Blue (`#1B365D`)
  - Accent / Tech: Electric Cyan / Ocean Teal (`#008080` / `#00B4D8`)
  - Neutral Background: Crisp Clean Slate (`#F8FAFC` to `#0F172A`)
  - Status Indicators: Emerald Green (`#10B981`) for Online/Ready, Cyan (`#06B6D4`) for NTP Sync.
* **Backend & Database:** Existing Supabase project (`zoqzgirtrhpxodrutjvs`) with PostgreSQL, Row Level Security (RLS), Edge Functions, and Storage buckets.
* **New Database Tables Required for E-Commerce:**
  - `products` (id, sku, name, description, category, price_usd, price_pkr, price_aed, price_sar, price_eur, price_gbp, stock, image_url).
  - `orders` (id, school_id, customer_email, customer_phone, country, shipping_address, total_amount, currency, payment_gateway, payment_status, tracking_number, created_at).
  - `order_items` (id, order_id, product_id, quantity, unit_price).
  - `subscriptions` (id, school_id, plan_name, billing_cycle, start_date, renewal_date, status).
* **Internationalization (i18n):** `react-i18next` for instant language toggling (English, Arabic with RTL, and Urdu).
* **Performance Standards:** 95+ Google Lighthouse score, <1.2s First Contentful Paint (FCP), automated WebP image optimization, and full mobile responsiveness.

---

## 7. Phased Implementation Roadmap

1. **Phase 1: Public Routing & Layout Integration**
   - Refactor `App.tsx` to mount public marketing routes at root `/` while keeping existing protected routes (`/dashboard`, `/super-admin`, `/partner`) completely intact.
2. **Phase 2: Component & Landing Page Construction**
   - Build `Navbar.tsx`, `Hero.tsx`, `HardwareShowcase.tsx`, `AudioSoundboard.tsx`, `RoiCalculator.tsx`, `RegionalSelector.tsx`, and `Footer.tsx`.
3. **Phase 3: Multi-Currency E-Commerce Store & Checkout**
   - Create `/products`, `/pricing`, and the multi-step `/buy` checkout wizard with Stripe + Pakistan/Africa gateway fallback.
4. **Phase 4: Automated Customer Provisioning Edge Function**
   - Implement the `order-fulfillment` webhook to auto-provision the school tenant, user credentials, and assign device hardware from inventory upon payment confirmation.
5. **Phase 5: Testing & Global Launch Verification**
   - Verify multi-currency price calculations, test mobile responsiveness, test regional WhatsApp routing, and confirm seamless role-based login routing across all user types.

