import { useState } from 'react'
import { Phone, MapPin, Send, MessageCircle, CheckCircle2, Globe2 } from 'lucide-react'

export default function AboutContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'School Campus Inquiry',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Globe2 className="w-3.5 h-3.5" />
            <span>About AutoBell & Worldwide Support</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Pioneering Smart Campus IoT Infrastructure
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            AutoBell was created with one uncompromising mission: to eliminate lost classroom instructional minutes through high-resilience IoT hardware, atomic clock scheduling, and instant campus-wide PA broadcasts.
          </p>
        </div>

        {/* Global Hubs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-4xl mb-3">🇵🇰</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Pakistan (Global HQ & R&D)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Hardware design, embedded firmware & manufacturing.</p>
            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <span>AutoBell IoT Labs, Model Town, Lahore, Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                <a href="https://wa.me/923000780280" className="hover:underline font-semibold">
                  +92 300 0780280 (WhatsApp)
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-4xl mb-3">🇦🇪</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              UAE & GCC Regional Office
            </h3>
            <p className="text-xs text-slate-500 mb-4">Gulf ministry compliance & regional distribution.</p>
            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <span>Dubai Silicon Oasis, DTEC, Dubai, United Arab Emirates</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                <span>+971 50 829 4110</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-4xl mb-3">🇬🇧</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              UK & European Operations
            </h3>
            <p className="text-xs text-slate-500 mb-4">European GDPR compliance & educational logistics.</p>
            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <span>71-75 Shelton Street, Covent Garden, London, UK</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                <span>+44 20 8144 7920</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 lg:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Get in Touch with Our Educational Support Team
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Whether you have questions about wiring to an existing campus amplifier, need a customized multi-campus tender quotation, or want firmware assistance, we're here to help.
              </p>

              <div className="p-6 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200">
                  <MessageCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Instant WhatsApp Direct Chat</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  For quickest response, message our senior hardware technician directly on WhatsApp.
                </p>
                <a
                  href="https://wa.me/923000780280"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-sm hover:bg-teal-500 transition-colors"
                >
                  <span>Chat on WhatsApp (+92 300 0780280)</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Dispatched!</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Thank you, <strong>{form.name}</strong>. An AutoBell representative will reply to <strong>{form.email}</strong> within 4 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Salman Khan"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="salman@school.edu.pk"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="+92 300 0000000"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Inquiry Topic
                      </label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="School Campus Inquiry">New School Campus Inquiry</option>
                        <option value="Hardware Compatibility">Hardware & Wiring Compatibility</option>
                        <option value="Wholesale & Dealership">Reseller & Wholesale Dealership</option>
                        <option value="Technical Support">Technical & Firmware Support</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Your Message / Campus Details *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please share details about your school campus, number of classrooms, and any specific requirements..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

