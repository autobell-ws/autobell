import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrency } from '@/context/CurrencyContext'
import { RegionalSelector } from '@/components/public/RegionalSelector'
import {
  Check,
  Cloud,
  ArrowRight,
} from 'lucide-react'

export default function Pricing() {
  const { convertPrice } = useCurrency()
  const [billingCycle, setBillingCycle] = useState<'annual' | 'multi_year'>('annual')

  // Hardware Kits
  const kits = [
    {
      id: 'basic',
      name: 'Controller Starter Kit',
      tagline: 'Ideal for schools with existing PA amplifiers or speakers.',
      priceUsd: 229,
      pricePkr: 58500,
      badge: 'Controller Only',
      features: [
        '1x AutoBell Core IoT Controller',
        '1x Industrial 24V DC DIN-Rail Power Supply',
        'Built-in 10A Bell Relay dry contact output',
        'Standard DIN-rail mounting hardware kit',
        '1-Year Cloud License included',
        'Email & WhatsApp Technical Support',
      ],
      popular: false,
    },
    {
      id: 'standard',
      name: 'Campus Standard Kit',
      tagline: 'The complete turn-key package for primary & middle schools.',
      priceUsd: 349,
      pricePkr: 84500,
      badge: 'Most Popular',
      features: [
        '1x AutoBell Core IoT Controller',
        '2x 50W High-Acoustic Weatherproof Horn Speakers',
        '1x Industrial 24V DC DIN-Rail Power Supply',
        'Pre-loaded studio chimes & Westminster bell tones',
        '1-Year Cloud SaaS License included',
        'Free remote onboarding & schedule configuration',
        'Priority WhatsApp & Phone Support',
      ],
      popular: true,
    },
    {
      id: 'academy',
      name: 'Complete Academy Bundle',
      tagline: 'Enterprise multi-wing coverage for large colleges & academies.',
      priceUsd: 599,
      pricePkr: 145000,
      badge: 'Enterprise Multi-Zone',
      features: [
        '1x AutoBell Core IoT Controller',
        '4x 50W Weatherproof Outdoor Horn Speakers',
        '1x 4-Zone Relay Expansion Module (independent wing bells)',
        '1x Heavy-Duty 24V 5A Industrial Power Supply',
        '2-Year Cloud SaaS License included',
        'VIP Next-Business-Day Hardware Replacement SLA',
        'Dedicated Solutions Architect Support Line',
      ],
      popular: false,
    },
  ]

  // Cloud SaaS Subscription
  const cloudLicensePriceUsd = billingCycle === 'annual' ? 79 : 139 // 139 for 2-yr
  const cloudLicensePricePkr = billingCycle === 'annual' ? 19500 : 34000
  const cloudConverted = convertPrice(cloudLicensePriceUsd, cloudLicensePricePkr)

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="flex justify-center mb-4">
            <RegionalSelector />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Transparent Global Hardware & Cloud Pricing
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Hardware kits are a one-time purchase with 1 year of cloud service included. Free replacement warranty across all regions.
          </p>
        </div>

        {/* Hardware Kits Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
          {kits.map((kit) => {
            const price = convertPrice(kit.priceUsd, kit.pricePkr)

            return (
              <div
                key={kit.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                  kit.popular
                    ? 'bg-gradient-to-b from-[#1B365D] to-slate-900 text-white shadow-2xl ring-2 ring-teal-500 scale-105 z-10'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-md'
                }`}
              >
                {kit.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
                    {kit.badge}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">{kit.name}</h3>
                      <p
                        className={`text-xs mt-1 ${
                          kit.popular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {kit.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="my-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
                    <div className="text-4xl font-black tracking-tight">{price.formatted}</div>
                    <div
                      className={`text-xs mt-1 ${
                        kit.popular ? 'text-teal-300' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      One-time hardware kit fee
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 text-xs mb-8">
                    {kit.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            kit.popular ? 'text-teal-400' : 'text-teal-600'
                          }`}
                        />
                        <span
                          className={
                            kit.popular ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={`/buy?kit=${kit.id}`}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    kit.popular
                      ? 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-lg shadow-teal-400/30'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                  }`}
                >
                  <span>Select {kit.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Cloud SaaS License Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 lg:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <Cloud className="w-3.5 h-3.5" />
                <span>Annual Cloud & OTA Maintenance License</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Yearly SaaS Management License
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                First year is 100% free with all hardware kits. Continued annual license provides remote browser timetable editing, unlimited profile switching, automatic cloud backups, AI Text-to-Speech synthesis, and Over-the-Air (OTA) firmware enhancements.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited Timetable Profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cloud Live Mic & TTS Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automated Daily Cloud Backups</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>OTA Firmware Bugfixes & Updates</span>
                </div>
              </div>
            </div>

            {/* Price Box */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
              <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('multi_year')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    billingCycle === 'multi_year'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  2 Years (Save 15%)
                </button>
              </div>

              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {cloudConverted.formatted}
                </div>
                <span className="text-xs text-slate-500">
                  {billingCycle === 'annual' ? 'per school / year' : 'for 2 years total'}
                </span>
              </div>

              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Included FREE for Year 1 with any hardware kit
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

