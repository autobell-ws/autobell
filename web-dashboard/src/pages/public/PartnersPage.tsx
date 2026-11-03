import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Handshake, DollarSign, Award, CheckCircle2, ArrowRight, ShieldCheck, Send } from 'lucide-react'

export default function PartnersPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    country: 'Pakistan',
    businessType: 'it_reseller',
    existingSchools: '1-10',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Handshake className="w-3.5 h-3.5" />
            <span>Channel Partners & Distributors</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Partner with AutoBell to Modernize Educational Institutions
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Join our certified network of school IT suppliers, audiovisual contractors, and distributors. Earn up to 30% margin on hardware and recurring SaaS commission.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-6">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              High Margin & Recurring Revenue
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Earn lucrative upfront hardware profit margins plus 20% recurring annual SaaS license renewals for every school campus you deploy.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Dedicated Partner Portal
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Access real-time lead registration, commission tracking, marketing collateral downloads, and device provisioning from your partner dashboard.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Protected Territories & Leads
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Register educational prospective schools in your city to lock in deal exclusivity with no price-cutting or direct factory interference.
            </p>
          </div>
        </div>

        {/* Partner Sign-up Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 lg:p-12 shadow-xl">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Apply for an Authorized Partner Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fill in your details below and our channel partnership manager will review and approve your wholesale pricing tier within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Application Submitted!</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Thank you, <strong>{formData.companyName}</strong>. Our partnership team will contact you at <strong>{formData.email}</strong> to finalize onboarding and activate your partner portal login.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
                  >
                    <span>Already Approved? Sign In Here</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Company / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Audio & IT Solutions"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Bilal"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
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
                      placeholder="sales@apexsolutions.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      WhatsApp / Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+92 321 9876543"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Operating City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lahore / Karachi / Dubai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Business Category
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      <option value="it_reseller">School IT Equipment Reseller</option>
                      <option value="cctv_installer">Security & CCTV Contractor</option>
                      <option value="pa_sound">Commercial Sound & PA Integrator</option>
                      <option value="distributor">Regional Hardware Distributor</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Partner Application</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

