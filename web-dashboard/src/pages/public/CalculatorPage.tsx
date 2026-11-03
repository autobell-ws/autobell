import { RoiCalculator } from '@/components/public/RoiCalculator'
import { Clock, ShieldAlert, Award } from 'lucide-react'

export default function CalculatorPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Campus Instructional ROI & Lost Time Calculator
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Discover how many classroom hours your institution recovers by switching from unpunctual manual bells to AutoBell's atomic clock automation.
          </p>
        </div>

        {/* Embedded Interactive Calculator */}
        <RoiCalculator />

        {/* Supporting Educational Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Clock className="w-8 h-8 text-rose-500 mb-4" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              The Cost of "Just 1 Minute" Delay
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              In a school with 30 sections and 8 periods a day, a 1-minute bell delay wastes 240 instructional minutes every single day — totaling over 96 curriculum hours every academic month.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <ShieldAlert className="w-8 h-8 text-amber-500 mb-4" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Mechanical Timer Drift
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Analog clock timer boxes drift by up to 5-10 minutes every month due to capacitor degradation and AC frequency swings. AutoBell uses temperature-compensated RTC crystals with NTP auto-sync.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Award className="w-8 h-8 text-emerald-500 mb-4" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Guaranteed Payback in Weeks
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Because teacher salaries represent up to 70% of private school operating budgets, eliminating wasted transit minutes between periods pays back the entire AutoBell kit investment in under 1 month.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

