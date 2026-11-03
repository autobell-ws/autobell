import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCurrency } from '@/context/CurrencyContext'
import { AudioSoundboard } from '@/components/public/AudioSoundboard'
import { RoiCalculator } from '@/components/public/RoiCalculator'
import {
  Cpu,
  WifiOff,
  Mic,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sun,
  Layers,
  Volume2,
  Check,
  ChevronRight,
  Star,
  Zap,
} from 'lucide-react'

export default function Home() {
  const { convertPrice } = useCurrency()
  const starterPrice = convertPrice(349, 84500)

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-400/15 dark:bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Top Tag */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider"
              >
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span>Next-Gen IoT School PA & Bell Ecosystem</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]"
              >
                The Smart IoT School Bell & <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600">
                  PA Audio Management
                </span>{' '}
                Platform.
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                Eliminate manual bell delays, automate period timetables directly from your smartphone or PC, and broadcast crystal-clear voice notices campus-wide — <strong className="text-slate-900 dark:text-white font-semibold">100% offline reliable</strong> with internal RTC flash memory.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <Link
                  to="/buy"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-teal-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
                >
                  <span>Order Starter Kit ({starterPrice.formatted})</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#soundboard"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Listen to Chimes</span>
                </a>
              </motion.div>

              {/* Bullet highlights */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Zero-delay offline RTC execution
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  UPS / Solar 24V DC ready
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  3-Year Hardware Warranty
                </span>
              </div>
            </div>

            {/* Right Product Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#1B365D] p-3 shadow-2xl border border-slate-800/80 group">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[360px] p-4">
                  <img
                    src="/images/autobell_with_external_speaker.jpg"
                    alt="AutoBell Controller wired with External Horn PA Speaker"
                    className="w-full h-auto object-cover rounded-xl shadow-lg transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Floating Status Pill */}
                  <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ESP32-S3 Dual-Core Active</span>
                  </div>

                  {/* Floating Offline Pill */}
                  <div className="absolute bottom-4 right-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-cyan-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
                    <WifiOff className="w-3.5 h-3.5 text-cyan-400" />
                    <span>100% Offline Flash Memory</span>
                  </div>
                </div>

                {/* Micro controller badge */}
                <div className="p-4 bg-slate-900/90 rounded-2xl mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">AutoBell Core DIN-Rail Unit</h4>
                      <p className="text-[11px] text-slate-400">2.8" LCD Screen • 10A Bell Relay • RJ45 LAN</p>
                    </div>
                  </div>
                  <Link
                    to="/products"
                    className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                  >
                    <span>Specs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. TRUST & PROOF TICKER */}
      <section className="border-y border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                100+
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Campuses Modernized
              </p>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
                1,000,000+
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Bells Executed with 0 Delay
              </p>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                99.99%
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Hardware Reliability
              </p>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                4 Markets
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Pakistan, GCC, Africa & UK
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE SOUNDBOARD SECTION */}
      <section id="soundboard" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AudioSoundboard />
      </section>

      {/* 4. CORE VALUE GRID */}
      <section className="py-16 lg:py-24 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Campus Automation Superpowers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Engineered Specifically for Real-World School Campuses
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
              Standard mechanical timers drift, and manual bells depend on unpunctual peons. AutoBell delivers total school audio precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                1-Tap Profile Switching
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Effortlessly toggle entire school timetable profiles: Normal School Day, Exam Timetable, Friday Prayer Special, Ramadan Short Hours, or Half-Day schedules with a single tap.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Zero-Downtime Offline RTC
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                When campus Wi-Fi drops or the internet is cut, AutoBell continues ringing with microsecond precision from internal LittleFS flash memory and battery-backed DS3231 RTC.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Solar & UPS Inverter Ready
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Operates smoothly on standard 24V DC / 12V DC power inputs. Immune to brownouts and load-shedding, perfectly integrating with campus UPS and solar setups.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Live Mic & AI Text-to-Speech
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Broadcast live voice notices directly from the principal's smartphone browser or type text notices that AutoBell automatically synthesizes into clear classroom PA audio.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Instant Emergency Lockdown
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                High-priority emergency override triggers continuous evacuation sirens across all speakers instantly from authorized staff phones or hardware wall-switches.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Multi-Building Multi-Zone Audio
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Control junior school, senior wing, laboratory block, and assembly ground speakers independently on separate timetable schedules without sound interference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE ROI CALCULATOR */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RoiCalculator />
      </section>

      {/* 6. REGIONAL MARKET HIGHLIGHTS */}
      <section className="py-16 lg:py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Global Platform, Tailored for Your Region
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
              Engineered with specialized localization, cultural schedules, and local payment methods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pakistan */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-3xl mb-3">🇵🇰</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                Pakistan (Anchor)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Load-shedding resilient, UPS solar integration, Friday Jumu'ah timetable, and JazzCash/EasyPaisa gateway.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>Rs. PKR Local Billing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>WhatsApp +92 Support</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>Ramadan & Adhan Chimes</span>
                </li>
              </ul>
            </div>

            {/* Middle East & GCC */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-3xl mb-3">🇦🇪 🇸🇦</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                Middle East & GCC
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Bilingual English/Arabic RTL support, automated prayer calculation (Fajr/Dhuhr/Asr), and heat-resistant casing.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>AED & SAR Currency</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>Apple Pay & Mada Gateway</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>Corporate PO Invoicing</span>
                </li>
              </ul>
            </div>

            {/* Africa */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-3xl mb-3">🇳🇬 🇰🇪 🇿🇦</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                Africa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Ultra-resilient over GSM/low-bandwidth cellular connections, volume bundles, and mobile money gateways.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>Paystack & Flutterwave</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>M-Pesa Supported</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>Multi-Campus Pricing</span>
                </li>
              </ul>
            </div>

            {/* Europe */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-3xl mb-3">🇬🇧 🇪🇺</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                UK & Europe
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Full GDPR privacy compliance, CE & RoHS certified industrial controllers, and automatic British Summer Time (BST) sync.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>EUR (€) & GBP (£) Billing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>SEPA & Stripe Direct</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-500" />
                  <span>B2B VAT Invoicing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Trusted by School Leaders & Principals
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            See how educational campuses run punctually every day with AutoBell.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
              "We struggled for years with peons ringing bells 2-3 minutes late, disrupting 30 classrooms each time. AutoBell solved this permanently in 1 day. The Friday timetable switch is an absolute lifesaver."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                MA
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Principal M. Asif</h4>
                <p className="text-[11px] text-slate-400">Beaconhouse School System, Lahore</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
              "The ability to type an announcement in my office and have AutoBell speak it cleanly over the courtyard speakers without static or echoing has modernized our entire campus communication."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                TR
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tariq Rashid</h4>
                <p className="text-[11px] text-slate-400">City School Network, Rawalpindi</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
              "During load shedding when the main power cuts, the internal RTC clock doesn't lose a second. When the generator kicks in, the bells are already right on schedule. Remarkable engineering."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                KH
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Kamran Hafeez</h4>
                <p className="text-[11px] text-slate-400">Army Public School, Gujranwala</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA STRIP */}
      <section className="py-16 bg-gradient-to-r from-[#1B365D] via-teal-900 to-[#1B365D] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Modernize Your School Bell & PA Audio?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Order the plug-and-play AutoBell Starter Kit today with free worldwide shipping, or speak directly with an educational solutions engineer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/buy"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/30 transition-all hover:scale-105"
            >
              Order Starter Kit Now
            </Link>
            <a
              href="https://wa.me/923000780280"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              Direct WhatsApp (+92 300 0780280)
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

