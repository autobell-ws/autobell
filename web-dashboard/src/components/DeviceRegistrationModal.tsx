import { useState } from 'react'
import { X, ShieldCheck, Sparkles } from 'lucide-react'

interface DeviceRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onRegister: (data: { name: string; serial_number: string; claim_pin: string }) => Promise<void>
}

export function DeviceRegistrationModal({ isOpen, onClose, onRegister }: DeviceRegistrationModalProps) {
  const [name, setName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [claimPin, setClaimPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!serialNumber.trim()) {
      setError('Please provide the device Serial Number.')
      return
    }

    if (!claimPin.trim()) {
      setError('Please provide the 6-digit Claim PIN printed on the label.')
      return
    }

    setIsLoading(true)

    try {
      await onRegister({ 
        name: name.trim() || 'Main Campus Bell', 
        serial_number: serialNumber.trim(), 
        claim_pin: claimPin.trim() 
      })
      setName('')
      setSerialNumber('')
      setClaimPin('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register device')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-card text-foreground p-6 shadow-2xl border border-border">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">Register New Device</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3 h-3" />
              1-Year Free
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-muted-foreground mb-1">
              Device Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., Main Hall Bell / Academic Block"
              required
            />
          </div>

          <div>
            <label htmlFor="serial" className="block text-xs font-semibold text-muted-foreground mb-1">
              Serial Number (from sticker label)
            </label>
            <input
              type="text"
              id="serial"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="block w-full font-mono uppercase rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. AB-S3-2026-0001"
              required
            />
          </div>

          <div>
            <label htmlFor="pin" className="block text-xs font-semibold text-muted-foreground mb-1">
              6-Digit Claim PIN
            </label>
            <input
              type="text"
              id="pin"
              maxLength={7}
              value={claimPin}
              onChange={(e) => setClaimPin(e.target.value)}
              className="block w-full font-mono tracking-widest text-center text-lg font-bold rounded-xl border border-input bg-background px-3 py-1.5 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="648291"
              required
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Printed on the label on the back of the controller and on the outside of your retail box.
            </p>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Instant Zero-Touch Activation:</strong> Submitting a valid Serial Number and Claim PIN automatically activates 12 Months Complimentary Cloud Service.
            </span>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 shadow-md shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? 'Activating...' : 'Activate Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
