import { useState } from 'react'
import { Lock } from 'lucide-react'

export default function LegalPage() {
  const [tab, setTab] = useState<'privacy' | 'terms' | 'gdpr' | 'warranty'>('privacy')

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 text-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Compliance & Legal Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            AutoBell Terms, Privacy & Warranty Policies
          </h1>
          <p className="text-xs text-slate-500 mt-2">Effective Date: November 2026</p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2 justify-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'privacy'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setTab('terms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'terms'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setTab('gdpr')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'gdpr'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            GDPR Compliance
          </button>
          <button
            type="button"
            onClick={() => setTab('warranty')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'warranty'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            3-Year Hardware Warranty
          </button>
        </div>

        {/* Tab Contents */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg text-xs leading-relaxed space-y-6 text-slate-600 dark:text-slate-300">
          {tab === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Data Privacy Policy</h2>
              <p>
                AutoBell ("we", "our") respects the privacy rights of all educational institutions, staff, and students. We only process data required to schedule campus bells, synchronize device clocks, and enable authorized live voice PA broadcasts.
              </p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-2">Data Collection & Use:</h3>
              <p>
                - We do not store student biometric or personal identity records.
                <br />
                - Audio voice announcements broadcast live are processed in transient memory and not retained unless saved as an explicit custom pre-announcement by the school admin.
                <br />
                - All telemetry between AutoBell IoT controllers and the Supabase cloud gateway is encrypted using TLS 1.3.
              </p>
            </div>
          )}

          {tab === 'terms' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Terms of Service</h2>
              <p>
                By deploying AutoBell hardware or subscribing to the AutoBell cloud management platform, your institution agrees to use the software solely for legitimate educational bell scheduling and emergency safety broadcasts.
              </p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-2">Service Availability:</h3>
              <p>
                AutoBell controllers are engineered with 100% autonomous local flash memory and an internal precision real-time hardware clock. Even if internet service is interrupted, scheduled period bells will continue to ring on time without disruption.
              </p>
            </div>
          )}

          {tab === 'gdpr' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. European GDPR Compliance</h2>
              <p>
                For our educational customers in the United Kingdom and European Union, AutoBell complies fully with Regulation (EU) 2016/679 (General Data Protection Regulation).
              </p>
              <p>
                - Data Minimization: We collect only institution name, administrator email, and school bell timetables.
                <br />
                - Right to Erasure: School administrators can export or purge their timetable history and device configurations at any time.
                <br />
                - Security by Design: Role-Based Access Control (RBAC) enforces strict isolation between school tenants.
              </p>
            </div>
          )}

          {tab === 'warranty' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. 3-Year Hardware Warranty & Replacement SLA</h2>
              <p>
                Every AutoBell Core IoT Controller (Industrial DIN-rail unit) and Outdoor Weatherproof Horn Speaker is backed by our comprehensive 3-Year Limited Hardware Warranty.
              </p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-2">Warranty Inclusions:</h3>
              <p>
                - Protection against manufacturing defects, relay failure, and power surge damage.
                <br />
                - Free replacement unit dispatched upon diagnostic verification by an AutoBell certified technician.
                <br />
                - Advance replacement units for institutions on the Enterprise Academy bundle.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

