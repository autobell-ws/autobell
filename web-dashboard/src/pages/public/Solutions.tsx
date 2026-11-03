import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  School,
  Building2,
  BookOpen,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export default function Solutions() {
  const { type } = useParams<{ type?: string }>()
  const [activeTab, setActiveTab] = useState<'k12' | 'colleges' | 'faith'>(() => {
    if (type === 'colleges-universities') return 'colleges'
    if (type === 'faith-schools') return 'faith'
    return 'k12'
  })

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
            <School className="w-3.5 h-3.5" />
            <span>Campus Solutions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Tailored Automation for Every Institution Type
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Explore dedicated configurations engineered for single-building primary schools, sprawling university campuses, and faith-based academies.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              type="button"
              onClick={() => setActiveTab('k12')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'k12'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              <School className="w-4 h-4" />
              <span>K-12 Primary & High Schools</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('colleges')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'colleges'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Colleges & Universities</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faith')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'faith'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Faith Academies & Madrasas</span>
            </button>
          </div>
        </div>

        {/* Tab 1: K-12 Schools */}
        {activeTab === 'k12' && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 lg:p-12 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    K-12 Primary & Secondary Campus
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                    Punctual Bells, Gentle Chimes & Student Discipline
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Primary school students get scared by harsh electric mechanical gongs. AutoBell replaces loud metal bells with soft, soothing acoustic marimbas for kindergarten and Westminster chimes for senior grades, while ensuring faculty starts each lesson on the exact second.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Pre-Assembly National Anthem & Announcements
                        </h4>
                        <p className="text-xs text-slate-500">
                          Automate morning assembly music and prayer recitations campus-wide without manual mic plugging.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Friday & Half-Day Schedule Automation
                        </h4>
                        <p className="text-xs text-slate-500">
                          Friday classes end early for prayers. AutoBell automatically adjusts period durations with zero manual effort.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Principal Emergency Lockdown Trigger
                        </h4>
                        <p className="text-xs text-slate-500">
                          Instant emergency evacuation tone accessible from the school admin app in urgent campus security events.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link
                      to="/buy?kit=standard"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20 hover:bg-teal-500 transition-all"
                    >
                      <span>Get K-12 Campus Standard Kit</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-slate-950 p-6 border border-slate-800 shadow-2xl">
                    <img
                      src="/images/autobell_with_external_speaker.jpg"
                      alt="K12 Setup"
                      className="rounded-2xl w-full h-auto object-cover"
                    />
                    <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <strong>Recommended Package:</strong> Campus Standard Kit with 2 Outdoor Horns + 1 Indoor Corridor Column.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Colleges & Universities */}
        {activeTab === 'colleges' && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 lg:p-12 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Colleges & Multi-Building Campuses
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                    Multi-Zone Relays & Campus-Wide PA Broadcasts
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Higher education campuses have different departments with disparate lecture schedules. A science lecture must not be disrupted by an arts department break chime. AutoBell's Multi-Zone relay expansion isolates audio per wing.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Zone-Isolated Timetable Engine
                        </h4>
                        <p className="text-xs text-slate-500">
                          Up to 16 distinct physical zones triggered independently from one central dashboard.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Auditorium & Sports Ground High-Output PA
                        </h4>
                        <p className="text-xs text-slate-500">
                          Drive long-throw 50W horn speakers to cover athletics tracks, quad areas, and car parks.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Multi-Operator Role Permissions
                        </h4>
                        <p className="text-xs text-slate-500">
                          Assign department deans broadcast permissions while restricting timetable modification to the registrar.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link
                      to="/buy?kit=academy"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20 hover:bg-teal-500 transition-all"
                    >
                      <span>Get Academy Multi-Zone Bundle</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-slate-950 p-6 border border-slate-800 shadow-2xl">
                    <img
                      src="/images/controller.png"
                      alt="College Setup"
                      className="rounded-2xl w-full h-auto object-contain max-h-72 mx-auto"
                    />
                    <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <strong>Recommended Package:</strong> Complete Academy Multi-Zone Bundle with 4-Zone Relay Expansion.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Faith Schools & Madrasas */}
        {activeTab === 'faith' && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 lg:p-12 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Faith Academies, Islamic Schools & Madrasas
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                    Adhan Synchronization & Prayer Timetable Integration
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    AutoBell includes built-in prayer calculation algorithms (Fajr, Dhuhr, Asr, Maghrib, Isha) and automatic Ramadan school schedule profiles, ensuring academic study sessions harmonize seamlessly with religious observances.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Solar Prayer Time Calculation
                        </h4>
                        <p className="text-xs text-slate-500">
                          Bells dynamically shift each week in accordance with changing solar prayer times (Dhuhr/Asr).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Ramadan Short-Hours Timetable
                        </h4>
                        <p className="text-xs text-slate-500">
                          Switch to condensed 30-minute period profiles with a single tap during the holy month.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Pre-Adhan Silence & Audio Alerts
                        </h4>
                        <p className="text-xs text-slate-500">
                          Gentle pre-announcement alerts that prepare students for congregational prayer before the Adhan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link
                      to="/buy?kit=standard"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20 hover:bg-teal-500 transition-all"
                    >
                      <span>Inquire About Faith School Pricing</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-slate-950 p-6 border border-slate-800 shadow-2xl">
                    <img
                      src="/images/autobell_with_external_speaker.jpg"
                      alt="Faith School Setup"
                      className="rounded-2xl w-full h-auto object-cover"
                    />
                    <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <strong>Special Feature:</strong> Includes pre-recorded Adhan audio and Friday Jumu'ah automated profiles.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

