import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Mail, Lock, User, Building, MapPin, Phone, AlertTriangle, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [campusName, setCampusName] = useState('Main Campus')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()
  const { user } = useAuth()

  // If already logged in, redirect to dashboard or setup if pending claim exists
  if (user && !loading && !success) {
    const pendingClaim = localStorage.getItem('autobell_pending_claim')
    if (pendingClaim) {
      navigate('/setup', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!fullName.trim() || !schoolName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      // 1. Sign up user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim()
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Registration failed. Please try again.')
      }

      // 2. Register school and associate admin via RPC
      const { error: rpcError } = await supabase.rpc('register_customer_and_school', {
        p_admin_name: fullName.trim(),
        p_school_name: schoolName.trim(),
        p_campus_name: campusName.trim() || 'Main Campus',
        p_city: city.trim() || 'Default City',
        p_phone: phone.trim()
      })

      if (rpcError) {
        console.warn('School registration RPC warning:', rpcError)
      }

      setSuccess(true)

      // 3. Check for pending device setup from deep link
      const pendingClaim = localStorage.getItem('autobell_pending_claim')
      setTimeout(() => {
        if (pendingClaim) {
          navigate('/setup', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }, 1500)
    } catch (err: unknown) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen relative">
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-background/80 backdrop-blur-md border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to AutoBell Website</span>
      </Link>

      {/* Left side with Marketing & Retail Feature Highlights */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-r border-border p-12 flex-col justify-between overflow-hidden">
        <div className="space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            Zero-Touch Instant Retail Activation
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Activate Your AutoBell in Minutes
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Register your institution to automatically unlock 12 months of complimentary cloud schedule syncing, automatic period announcements, and smart PA features.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">1-Year Free Cloud Service</h4>
                <p className="text-xs text-muted-foreground">Every retail AutoBell unit includes 365 days of full cloud scheduling and remote trigger capabilities.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Instant Self-Serve Claiming</h4>
                <p className="text-xs text-muted-foreground">Pair your device with the 6-digit Claim PIN found on your box or controller label. No manual approval required.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Full Bell Schedule Templates</h4>
                <p className="text-xs text-muted-foreground">Pre-loaded with standard 8-period school profiles ready to run immediately.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 relative z-10 shadow-sm">
          <p className="text-xs text-muted-foreground">
            Questions during unboxing? Call our 24/7 technical line or visit{' '}
            <a href="https://autobell.pk/support" className="text-primary font-medium hover:underline">
              autobell.pk/support
            </a>
          </p>
        </div>
      </div>

      {/* Right side with Registration Form */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 sm:px-6 lg:px-8 py-12 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl space-y-6 rounded-3xl bg-card/90 backdrop-blur-2xl p-8 sm:p-10 shadow-xl border border-border relative z-10"
        >
          <div className="flex flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="AutoBell Logo"
              className="h-16 w-auto max-w-full object-contain rounded-xl drop-shadow-sm mb-3"
            />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Register School Account
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Create your institution account to pair and control your AutoBell devices
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Account created successfully! Preparing your institution workspace...</span>
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Administrator Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Principal Sarah Khan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  School / Institution Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Building className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Beacon High School"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Campus
                </label>
                <input
                  type="text"
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Main Campus"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  City
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Lahore / Islamabad"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Official Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="+92 300 1234567"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Admin Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="admin@school.edu.pk"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading || success}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs font-bold text-primary-foreground bg-primary shadow-lg shadow-primary/25 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating School Workspace...
                  </>
                ) : (
                  'Create School & Activate 1-Year Free Service'
                )}
              </motion.button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in to your dashboard
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
