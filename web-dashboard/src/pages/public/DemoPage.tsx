import { useState } from 'react'
import { AudioSoundboard } from '@/components/public/AudioSoundboard'
import { Video, CheckCircle2, Send } from 'lucide-react'

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    schoolName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: 'morning',
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Video className="w-3.5 h-3.5" />
            <span>Virtual Audition & Live Walkthrough</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Audition Bell Chimes & Book a 1-on-1 Campus Demo
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Test real AutoBell chimes right from your browser, or schedule a 15-minute video walkthrough with our educational solutions engineering team.
          </p>
        </div>

        {/* 1. Interactive Soundboard */}
        <AudioSoundboard />

        {/* 2. Live Demo Booking Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 lg:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-600">
                Personalized 15-Minute Session
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Book a Live Video Walkthrough with an AutoBell Engineer
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We'll demonstrate the cloud timetable scheduler, simulate a profile change in real-time, test the AI Text-to-Speech synthesizer, and answer technical questions regarding your campus wiring and speaker zones.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Review existing campus amplifier & horn compatibility</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>See Friday prayer and Ramadan timetable switching live</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Receive custom institutional quote with volume discount</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Demo Request Received!</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Our team will reach out to <strong>{formData.phone || formData.email}</strong> via WhatsApp / Email to confirm your preferred video meeting slot.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Principal Naeem"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Institution Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Army Public School"
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+92 300 1234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="admin@school.edu.pk"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Preferred Meeting Time
                    </label>
                    <select
                      value={formData.preferredTime}
                      onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      <option value="morning">Morning (10:00 AM - 1:00 PM)</option>
                      <option value="afternoon">Afternoon (2:00 PM - 5:00 PM)</option>
                      <option value="evening">Evening (6:00 PM - 8:00 PM)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirm Free Demo Request</span>
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

