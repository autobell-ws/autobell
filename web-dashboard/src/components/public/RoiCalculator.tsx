import { useState } from 'react'
import { useCurrency } from '@/context/CurrencyContext'
import { Calculator, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function RoiCalculator() {
  const { currency, convertPrice } = useCurrency()

  const [classrooms, setClassrooms] = useState<number>(20)
  const [periodsPerDay, setPeriodsPerDay] = useState<number>(8)
  const [delaySeconds, setDelaySeconds] = useState<number>(45) // average 45s human bell ring drift
  const [schoolDaysPerMonth] = useState<number>(24)

  // Calculations
  // Total period transitions per day = periodsPerDay + 2 (Assembly, Recess, School End)
  const totalTransitionsPerDay = periodsPerDay + 2
  // Total delay seconds per classroom per day = totalTransitionsPerDay * delaySeconds
  // Total lost teaching hours across entire campus per month
  const totalLostSecondsPerClassPerMonth = totalTransitionsPerDay * delaySeconds * schoolDaysPerMonth
  const lostHoursPerClassMonth = totalLostSecondsPerClassPerMonth / 3600
  const totalCampusLostHoursPerMonth = Math.round(lostHoursPerClassMonth * classrooms)

  // Estimated teacher cost per hour per region
  // In PKR: ~Rs. 1,000 / hr; in USD: ~$25 / hr
  const hourlyTeacherCostUsd = currency === 'PKR' ? 3.5 : 22
  const monthlyWastedValueUsd = Math.round(totalCampusLostHoursPerMonth * hourlyTeacherCostUsd)
  const convertedWastedValue = convertPrice(monthlyWastedValueUsd)

  // AutoBell starter kit cost
  const starterKitCostUsd = 349
  const convertedStarterKit = convertPrice(starterKitCostUsd, 84500)
  // Payback time in weeks
  const paybackWeeks = Math.max(1, Math.round((starterKitCostUsd / (monthlyWastedValueUsd / 4.2)) * 10) / 10)

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-10 shadow-xl">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Calculator className="w-3.5 h-3.5" />
          <span>Interactive Campus ROI Calculator</span>
        </div>
        <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Quantify Lost Instructional Time from Manual Bells
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Even a 45-second delay or unpunctual peon per period drains hundreds of teaching hours every academic term.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sliders Column */}
        <div className="lg:col-span-7 space-y-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
          {/* Classrooms */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Number of Classrooms / Sections
              </label>
              <span className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">
                {classrooms} Classrooms
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="100"
              step="2"
              value={classrooms}
              onChange={(e) => setClassrooms(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Small (4)</span>
              <span>Medium Campus (25)</span>
              <span>Large Academy (100+)</span>
            </div>
          </div>

          {/* Daily Periods */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Daily Periods & Bell Transitions
              </label>
              <span className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">
                {periodsPerDay} Periods / Day
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="14"
              step="1"
              value={periodsPerDay}
              onChange={(e) => setPeriodsPerDay(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>4 Periods</span>
              <span>8 Standard</span>
              <span>14 Extended Timetable</span>
            </div>
          </div>

          {/* Average Delay */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Average Human Bell Delay / Discrepancy
              </label>
              <span className="text-base font-bold text-rose-500 font-mono">
                {delaySeconds} Seconds / Bell
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>15s (Minimal)</span>
              <span>45s (Average peon drift)</span>
              <span>3 Minutes (High delay)</span>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-[#1B365D] text-white p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />

          <h4 className="text-xs uppercase font-bold tracking-wider text-teal-300 mb-4 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Monthly Impact Report</span>
          </h4>

          {/* Metric 1: Lost Hours */}
          <div className="mb-5 pb-5 border-b border-slate-700/80">
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span>~{totalCampusLostHoursPerMonth}</span>
              <span className="text-sm font-normal text-slate-300">Teaching Hours</span>
            </div>
            <p className="text-xs text-rose-300 mt-1">
              Lost per month across all {classrooms} classroom sections due to manual delays.
            </p>
          </div>

          {/* Metric 2: Financial Waste */}
          <div className="mb-5 pb-5 border-b border-slate-700/80">
            <div className="text-xs uppercase tracking-wider text-slate-300 mb-1">
              Equivalent Faculty Salary Loss
            </div>
            <div className="text-3xl font-extrabold text-teal-300">
              {convertedWastedValue.formatted}
              <span className="text-xs text-slate-400 font-normal ml-2">/ month</span>
            </div>
          </div>

          {/* Metric 3: Payback */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-300 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Investment Payback Period</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              Pays for itself in ~{paybackWeeks} {paybackWeeks === 1 ? 'week' : 'weeks'}!
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Starter Kit at {convertedStarterKit.formatted} recovers its full cost through recaptured curriculum minutes.
            </p>
          </div>

          <Link
            to="/buy"
            className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Order AutoBell Kit for {classrooms} Classes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

