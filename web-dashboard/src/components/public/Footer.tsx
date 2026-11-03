import { Link } from 'react-router-dom'
import { ShieldCheck, Mail, CheckCircle, Award } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1B365D] to-[#008080] p-1 flex items-center justify-center">
                <img src="/logo.png" alt="AutoBell" className="h-full w-full object-contain rounded-lg" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">AutoBell Worldwide</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The intelligent IoT school bell, automated timetable chime, and multi-zone PA broadcasting platform engineered for zero-delay offline reliability across 100+ educational campuses worldwide.
            </p>

            {/* Compliance & Hardware Badges */}
            <div className="pt-2 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>CE Certified</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <Award className="w-3.5 h-3.5 text-teal-400" />
                <span>RoHS Compliant</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>

          {/* Column 2: Products & Hardware */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Hardware & IoT</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/products" className="hover:text-teal-400 transition-colors">
                  AutoBell Core Controller S3
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-teal-400 transition-colors">
                  Outdoor Horn Speakers (50W)
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-teal-400 transition-colors">
                  Indoor Acoustic Columns (30W)
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-teal-400 transition-colors">
                  4-Zone Relay Expansion
                </Link>
              </li>
              <li>
                <Link to="/demo" className="hover:text-teal-400 transition-colors">
                  Virtual Bell Soundboard
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-teal-400 transition-colors">
                  All Hardware Bundles
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions & Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Solutions & Tools</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/solutions" className="hover:text-teal-400 transition-colors">
                  K-12 Primary & High Schools
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-teal-400 transition-colors">
                  Colleges & Universities
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-teal-400 transition-colors">
                  Faith Academies & Madrasas
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="hover:text-teal-400 transition-colors">
                  Lost Teaching Hours Calculator
                </Link>
              </li>
              <li>
                <Link to="/partners" className="hover:text-teal-400 transition-colors">
                  Distributor & Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-400 transition-colors">
                  Unified Portal Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Global Hubs & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Regional Contact Hubs</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-sm">🇵🇰</span>
                <div>
                  <span className="text-slate-300 font-semibold block">Pakistan (HQ)</span>
                  <a href="https://wa.me/923000780280" className="text-teal-400 hover:underline">
                    +92 300 0780280 (WhatsApp)
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sm">🇦🇪</span>
                <div>
                  <span className="text-slate-300 font-semibold block">Middle East & GCC</span>
                  <span className="text-slate-400">+971 50 829 4110</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sm">🇬🇧</span>
                <div>
                  <span className="text-slate-300 font-semibold block">UK & Europe</span>
                  <span className="text-slate-400">+44 20 8144 7920</span>
                </div>
              </li>
              <li className="flex items-center gap-2 pt-1 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <a href="mailto:info@autobell.pk" className="hover:underline">
                  info@autobell.pk
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} AutoBell Global IoT Systems. All rights reserved.</p>

          <div className="flex flex-wrap gap-6 text-xs">
            <Link to="/legal" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/legal" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link to="/legal" className="hover:text-slate-300 transition-colors">
              GDPR Compliance
            </Link>
            <Link to="/legal" className="hover:text-slate-300 transition-colors">
              Hardware Warranty (3-Year)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

