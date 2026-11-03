import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  CheckCircle2, 
  Sparkles, 
  Bell, 
  Loader2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  RotateCw,
  QrCode,
  Volume2
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ClaimDevice() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  // Serial & PIN from URL or localStorage
  const urlSn = searchParams.get('sn') || ''
  const urlPin = searchParams.get('pin') || ''

  const [serialNumber, setSerialNumber] = useState(urlSn)
  const [claimPin, setClaimPin] = useState(urlPin)
  const [deviceName, setDeviceName] = useState('Main Campus Bell')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Activated State
  const [isActivated, setIsActivated] = useState(false)
  const [activationResult, setActivationResult] = useState<{
    device_id?: string
    serial_number?: string
    subscription_end_date?: string
    message?: string
  } | null>(null)
  
  // Ring Bell Test State
  const [testingBell, setTestingBell] = useState(false)
  const [testSuccess, setTestSuccess] = useState(false)

  // 1. Save query params to localStorage for guest users
  useEffect(() => {
    if (urlSn || urlPin) {
      localStorage.setItem('autobell_pending_claim', JSON.stringify({ sn: urlSn, pin: urlPin }))
    } else {
      const saved = localStorage.getItem('autobell_pending_claim')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.sn) setSerialNumber(parsed.sn)
          if (parsed.pin) setClaimPin(parsed.pin)
        } catch (e) {
          console.error('Failed to parse pending claim from storage', e)
        }
      }
    }
  }, [urlSn, urlPin])

  // Handle Device Claim & Activation
  const handleClaim = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!serialNumber.trim()) {
      setError('Please provide the Serial Number from the device sticker.')
      return
    }

    if (!claimPin.trim()) {
      setError('Please provide the 6-digit Claim PIN from the device sticker.')
      return
    }

    setLoading(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('claim_and_activate_device', {
        p_serial_number: serialNumber.trim(),
        p_claim_pin: claimPin.trim(),
        p_device_name: deviceName.trim() || 'Main Campus Bell'
      })

      if (rpcError) throw rpcError

      // Clean pending claim storage
      localStorage.removeItem('autobell_pending_claim')

      setActivationResult(data)
      setIsActivated(true)
    } catch (err: unknown) {
      console.error('Claim error:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim device. Please verify your Serial and PIN.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Immediate Sound Test
  const handleRingTest = async () => {
    if (!activationResult?.device_id) return
    setTestingBell(true)
    setTestSuccess(false)

    try {
      const { error: cmdError } = await supabase.from('command_queue').insert({
        device_id: activationResult.device_id,
        command: 'RING',
        payload: {
          duration_seconds: 3,
          trigger: 'retail_onboarding_test_chime',
          requested_at: new Date().toISOString()
        }
      })

      if (cmdError) throw cmdError
      setTestSuccess(true)
    } catch (err) {
      console.error('Bell test error:', err)
    } finally {
      setTestingBell(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Guest View: Scanned but not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/40 to-background px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-3xl bg-card border border-border p-8 shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <QrCode className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              AutoBell Controller Detected
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Ready to Claim Your AutoBell
            </h2>
            <p className="text-xs text-muted-foreground">
              {serialNumber ? (
                <>Found Unit Serial: <strong className="font-mono text-foreground">{serialNumber}</strong></>
              ) : (
                'Pair your hardware controller with your school account.'
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-muted/50 border border-border p-4 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              1-Year Complimentary Cloud Service Included
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Create a new school profile or sign in to your existing account. Your device will be instantly activated with automatic scheduling and remote access.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-primary-foreground bg-primary shadow-lg shadow-primary/25 hover:opacity-95 transition-all"
            >
              <span>Register New School Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-all"
            >
              <span>Sign In to Existing Account</span>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Success Celebration View
  if (isActivated && activationResult) {
    const expiryDate = activationResult.subscription_end_date 
      ? new Date(activationResult.subscription_end_date).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '1 Year from today'

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-emerald-500/5 to-background px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg rounded-3xl bg-card border border-emerald-500/20 p-8 sm:p-10 shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              Device Claimed & Activated!
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Your AutoBell is Ready to Ring
            </h2>
            <p className="text-xs text-muted-foreground">
              Serial: <span className="font-mono font-semibold text-foreground">{activationResult.serial_number || serialNumber}</span>
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-left space-y-1.5">
            <div className="font-bold text-emerald-700 dark:text-emerald-300">
              🎁 12 Months Complimentary Cloud Service Active
            </div>
            <p className="text-muted-foreground">
              Complimentary subscription valid through: <strong className="text-foreground">{expiryDate}</strong>
            </p>
          </div>

          {/* Instant Sound Test Section */}
          <div className="rounded-2xl bg-muted/40 border border-border p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Verify Hardware Audio</h4>
                <p className="text-[11px] text-muted-foreground">Send an immediate 3-second chime test to the bell speaker.</p>
              </div>
              <button
                type="button"
                onClick={handleRingTest}
                disabled={testingBell}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all disabled:opacity-50"
              >
                {testingBell ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    Ring Test Bell
                  </>
                )}
              </button>
            </div>
            {testSuccess && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Test chime command dispatched! Listen for the speaker chime.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-primary-foreground bg-primary shadow-lg shadow-primary/25 hover:opacity-95 transition-all"
            >
              <span>Go to School Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Authenticated Claim Form View
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl bg-card border border-border p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Claim Your AutoBell</h2>
              <p className="text-xs text-muted-foreground">Zero-Touch 1-Year Free Retail Activation</p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            1-Year Free
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleClaim} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Device Name
            </label>
            <input
              type="text"
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="block w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Main Hall Bell / Academic Wing"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Serial Number (from sticker label) *
            </label>
            <input
              type="text"
              required
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="block w-full font-mono rounded-xl border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              placeholder="AB-S3-2026-XXXX"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              6-Digit Claim PIN *
            </label>
            <input
              type="text"
              required
              maxLength={7}
              value={claimPin}
              onChange={(e) => setClaimPin(e.target.value)}
              className="block w-full font-mono tracking-widest text-center text-lg font-bold rounded-xl border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="648291"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Printed on the label on the back of the controller and on the outside of your retail box.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-primary-foreground bg-primary shadow-lg shadow-primary/25 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Activating Device...
                </>
              ) : (
                'Claim & Activate AutoBell'
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
            Skip for now and go to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

