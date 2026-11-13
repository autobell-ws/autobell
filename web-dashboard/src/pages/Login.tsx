import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Mail, Lock, AlertTriangle, ShieldCheck, Radio, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState<number>(0)
  const navigate = useNavigate()
  const { user, role, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!user || authLoading || !role) return
    if (role === 'super_admin') {
      navigate('/super-admin', { replace: true })
    } else if (role === 'partner') {
      navigate('/partner', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [user, role, authLoading, navigate])

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime <= 0) return
    const timer = setInterval(() => {
      setLockoutTime((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutTime])

  if (user) {
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockoutTime > 0) return

    setLoading(true)
    setError(null)

    // Password Policy Check
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('impersonatedSchoolId')
      sessionStorage.removeItem('impersonatedPartnerId')
      sessionStorage.removeItem('inspectedSchoolId')
      sessionStorage.removeItem('inspectedPartnerId')
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      const nextAttempts = failedAttempts + 1
      setFailedAttempts(nextAttempts)

      // Lockout logic after 5 failed attempts
      if (nextAttempts >= 5) {
        setLockoutTime(60) // 60s lockout
        setError('Too many failed login attempts. Account temporarily locked for 60 seconds.')
        setFailedAttempts(0)
      } else {
        setError(`${authError.message} (${5 - nextAttempts} attempts remaining before temporary lockout)`)
      }
    } else {
      setFailedAttempts(0)
      const userMetaRole = (authData.user?.app_metadata?.role as string) ||
                           (authData.user?.user_metadata?.role as string) ||
                           (email.trim().toLowerCase() === 'muddasirh@gmail.com' ? 'super_admin' : null)
      if (userMetaRole === 'super_admin') {
        navigate('/super-admin', { replace: true })
      } else if (userMetaRole === 'partner') {
        navigate('/partner', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen font-sans bg-background text-foreground">
      {/* Left side: Premium SaaS Enterprise Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-12 flex-col justify-between overflow-hidden border-r border-border/40">
        {/* Abstract Ambient Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="AutoBell Logo" 
            className="h-10 w-auto object-contain rounded-xl shadow-md"
          />
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">AutoBell</span>
            <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Enterprise Cloud Platform</span>
          </div>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Next-Gen Smart Campus Automation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Autonomous School Bells & Multi-Zone Cloud PA System
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Effortlessly schedule daily timetable bells, stream live multi-lingual TTS voice broadcasts, and manage your IoT bell controller fleet from anywhere in the world.
          </p>

          {/* Feature Highlights Cards */}
          <div className="grid gap-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Zero-Downtime Autonomous Schedules</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Bell schedules persist in ESP32 offline flash storage, ringing accurately even during internet outages.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Sub-Second Multi-Zone Cloud Broadcasts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant TTS and live microphone streaming across targeted zones or entire school campuses.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Enterprise Fleet Reliability</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time voltage telemetry, automatic battery-mode failover, and instantaneous emergency stop.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Trust Indicator */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>End-to-End Encrypted Hardware Sync</span>
          </div>
          <span className="font-mono text-[11px]">v3.2 Enterprise</span>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 sm:px-6 lg:px-12 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-7 rounded-3xl bg-card p-8 sm:p-10 shadow-card border border-border/80 relative z-10"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
              <img
                src="/logo.png"
                alt="AutoBell Logo"
                className="h-12 w-auto object-contain rounded-xl"
              />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Sign in to AutoBell
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xs">
              Enter your authorized institutional credentials
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/25 flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {lockoutTime > 0 && (
              <div className="rounded-xl bg-amber-500/15 p-3 text-xs text-amber-700 dark:text-amber-400 border border-amber-500/25 text-center font-mono font-bold">
                Account locked. Try again in {lockoutTime} seconds.
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email-address" className="block text-xs font-bold text-foreground/90 tracking-wide select-none">
                  Institutional Email
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={lockoutTime > 0}
                    className="flex h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 pl-10 text-sm text-foreground placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary disabled:opacity-50"
                    placeholder="admin@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold text-foreground/90 tracking-wide select-none">
                    Security Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={lockoutTime > 0}
                    className="flex h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 pl-10 text-sm text-foreground placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary disabled:opacity-50"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutTime > 0}
              className="w-full flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>

            <div className="pt-2 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Protected by 256-Bit Hardware Encryption</span>
              </div>
            </div>
          </form>
        </motion.div>
        
        <footer className="absolute bottom-4 text-center">
          <p className="text-xs text-muted-foreground">
            AutoBell Cloud OS &copy; {new Date().getFullYear()} — All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}
