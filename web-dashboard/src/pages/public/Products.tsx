import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrency } from '@/context/CurrencyContext'
import {
  Cpu,
  CheckCircle2,
  ArrowRight,
  FileText,
  X,
} from 'lucide-react'

export default function Products() {
  const { convertPrice } = useCurrency()
  const [activeSpecModal, setActiveSpecModal] = useState<string | null>(null)

  const productsList = [
    {
      id: 'controller',
      sku: 'AB-CTRL-S3',
      name: 'AutoBell Core IoT Controller',
      badge: 'Flagship DIN-Rail Hardware',
      priceUsd: 199,
      pricePkr: 48500,
      image: '/images/controller.png',
      tagline: 'Dual-core ESP32-S3 industrial brain with atomic clock accuracy.',
      specs: [
        { label: 'Processor', value: 'Espressif Dual-Core ESP32-S3 (240MHz)' },
        { label: 'Display', value: '2.8-inch TFT Color Display (320x240)' },
        { label: 'RTC Chip', value: 'Maxim DS3231 Temperature-Compensated RTC' },
        { label: 'Offline Storage', value: '16MB LittleFS Internal Flash Storage' },
        { label: 'Connectivity', value: '10/100M RJ45 Ethernet + 2.4GHz 802.11b/g/n Wi-Fi' },
        { label: 'Relay Output', value: '10A / 250V AC Solid-State Dry Contact Bell Relay' },
        { label: 'Audio Engine', value: 'I2S Hardware DAC with High SNR Output' },
        { label: 'Power Input', value: '9V - 36V Wide DC Input (Inverter/Solar 24V Ready)' },
        { label: 'Form Factor', value: 'Standard 35mm DIN-Rail Flame-Retardant Industrial Enclosure' },
      ],
      features: [
        '100% offline schedule execution from flash memory',
        'Automatic NTP time synchronization when online',
        'Built-in watchdog timer for 99.99% system uptime',
        'USB-C diagnostic and factory provisioning port',
      ],
    },
    {
      id: 'horn-speaker',
      sku: 'AB-SPK-HORN50',
      name: 'Outdoor PA Horn Speaker (50W)',
      badge: 'High-Acoustic Outdoor Unit',
      priceUsd: 79,
      pricePkr: 19500,
      image: '/images/autobell_with_external_speaker.jpg',
      tagline: 'Heavy-duty IP66 weatherproof horn speaker for courtyards and sports fields.',
      specs: [
        { label: 'Power Rating', value: '50W RMS (Max 75W Peak)' },
        { label: 'SPL @ 1W/1m', value: '110 dB (Max SPL 126 dB)' },
        { label: 'Weather Protection', value: 'IP66 Certified Waterproof & Dustproof' },
        { label: 'Coverage Range', value: 'Up to 250 Meters in Open Grounds' },
        { label: 'Impedance', value: '8 Ohms / Optional 100V Line Transformer' },
        { label: 'Housing Material', value: 'UV-Stabilized High-Impact ABS with Aluminum Bracket' },
      ],
      features: [
        'Crystal-clear audio projection over noisy recess and assembly crowds',
        'Rust-proof stainless steel mounting hardware included',
        'Operating temperature: -20°C to +65°C',
      ],
    },
    {
      id: 'sound-column',
      sku: 'AB-SPK-COL30',
      name: 'Indoor Acoustic Sound Column (30W)',
      badge: 'Corridor & Classroom PA',
      priceUsd: 65,
      pricePkr: 16500,
      image: '/images/controller.png',
      tagline: 'Architectural column speaker tuned for voice intelligibility and soft chimes.',
      specs: [
        { label: 'Power Rating', value: '30W RMS (15W / 30W Taps)' },
        { label: 'Drivers', value: '4x 2.5-inch Full-Range Acoustic Drivers' },
        { label: 'Frequency Response', value: '150 Hz – 18 kHz' },
        { label: 'Line Voltage', value: '70V / 100V Multi-Tap Input' },
        { label: 'Mounting', value: 'Adjustable Wall-Mount Swivel Bracket' },
      ],
      features: [
        'Eliminates echo and reverberation in long school corridors',
        'Sleek white powder-coated aluminum casing',
        'Ideal for administrative halls, auditoriums, and classrooms',
      ],
    },
    {
      id: 'relay-box',
      sku: 'AB-RELAY-EXP4',
      name: 'Multi-Zone Relay Expansion Module',
      badge: 'Multi-Wing Segmentation',
      priceUsd: 49,
      pricePkr: 12500,
      image: '/images/controller.png',
      tagline: 'Independent 4-zone relay box for multi-building campuses.',
      specs: [
        { label: 'Channels', value: '4x Independent 10A Relays' },
        { label: 'Interface', value: 'Optically Isolated I2C / RS-485 Bus' },
        { label: 'LED Indicators', value: 'Per-Channel Active Relay Glow LEDs' },
        { label: 'Expansion', value: 'Daisy-chain up to 4 units (16 Zones Total)' },
      ],
      features: [
        'Segregate Primary, Middle, High, and Admin wing bells',
        'Prevents primary school bell from disturbing senior exam halls',
        'DIN-rail mountable right beside the AutoBell Controller',
      ],
    },
  ]

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Industrial Hardware Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Engineered for 24/7 Educational Reliability
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Discover the high-precision IoT controllers, outdoor weatherproof speakers, and multi-zone relays that power modern school campuses.
          </p>
        </div>

        {/* Products Grid */}
        <div className="space-y-12">
          {productsList.map((product, idx) => {
            const price = convertPrice(product.priceUsd, product.pricePkr)
            const isReversed = idx % 2 === 1

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg overflow-hidden"
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                    isReversed ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Image Column */}
                  <div className={`lg:col-span-5 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                    <div className="rounded-2xl bg-slate-950 p-6 border border-slate-800 flex items-center justify-center min-h-[300px] relative group overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-64 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 bg-teal-500 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {product.sku}
                      </div>
                    </div>
                  </div>

                  {/* Details Column */}
                  <div className={`lg:col-span-7 space-y-6 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div>
                      <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        {product.badge}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {product.name}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{product.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {price.formatted}
                      </span>
                      <span className="text-xs text-slate-400">Unit Price (excl. VAT / tax)</span>
                    </div>

                    {/* Features list */}
                    <div className="space-y-2">
                      {product.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Link
                        to="/buy"
                        className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
                      >
                        <span>Configure & Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setActiveSpecModal(product.id)}
                        className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-teal-500" />
                        <span>View Technical Specs</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Technical Specification Modal */}
        {activeSpecModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              {(() => {
                const prod = productsList.find((p) => p.id === activeSpecModal)
                if (!prod) return null
                return (
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
                          Engineering Datasheet
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                          {prod.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSpecModal(null)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {prod.specs.map((s, i) => (
                        <div key={i} className="py-2.5 flex justify-between gap-4">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            {s.label}
                          </span>
                          <span className="font-mono text-right text-slate-900 dark:text-white font-medium">
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-slate-500">ISO 9001 & CE Certified Spec</span>
                      <Link
                        to="/buy"
                        className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
                      >
                        Buy This Hardware
                      </Link>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

