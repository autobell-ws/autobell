import { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, X, ChevronRight, ArrowLeft, Check, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DeleteSchoolModalProps {
  isOpen: boolean
  onClose: () => void
  school: {
    id: string
    name: string
    campus_name?: string | null
  } | null
  onSuccess?: (deletedSchoolName: string) => void
}

export function DeleteSchoolModal({
  isOpen,
  onClose,
  school,
  onSuccess
}: DeleteSchoolModalProps) {
  const queryClient = useQueryClient()
  const { impersonatedSchoolId, stopImpersonation } = useAuth()

  const [step, setStep] = useState<1 | 2>(1)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setHasAcknowledged(false)
      setConfirmationText('')
      setIsDeleting(false)
      setErrorMessage(null)
    }
  }, [isOpen, school?.id])

  if (!isOpen || !school) return null

  const isNameMatch = confirmationText.trim() === school.name.trim()

  const handleProceedToStep2 = () => {
    if (!hasAcknowledged) return
    setStep(2)
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setErrorMessage(null)
  }

  const handleDelete = async () => {
    if (!isNameMatch || isDeleting) return

    setIsDeleting(true)
    setErrorMessage(null)

    try {
      // 1. Delete school from public.schools (cascades to bell_profiles, bell_times, audio_files, stream_playlist, stream_schedule, user_roles)
      // and sets NULL on bell_devices.school_id and users.school_id
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', school.id)

      if (error) throw error

      // 2. If the user is currently impersonating this school, clear impersonation
      if (impersonatedSchoolId === school.id) {
        await stopImpersonation()
      }

      // 3. Invalidate relevant queries so all tables and lists update immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['schools'] }),
        queryClient.invalidateQueries({ queryKey: ['schools_list'] }),
        queryClient.invalidateQueries({ queryKey: ['school_settings'] })
      ])

      onSuccess?.(school.name)
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete school'
      setErrorMessage(msg)
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-school-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-card border border-destructive/30 p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/70 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-destructive/15 text-destructive border border-destructive/25">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30">
                  Prompt {step} of 2
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {step === 1 ? 'Impact Assessment' : 'Final Verification'}
                </span>
              </div>
              <h3 id="delete-school-title" className="text-lg font-bold text-foreground leading-snug mt-1">
                {step === 1 ? 'Confirm School Deletion' : 'Final Name Verification'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error notification if deletion failed */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold">Error Deleting School</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: IMPACT ASSESSMENT */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider">High Severity Warning</p>
              <p className="text-sm font-medium">
                You are requesting to permanently delete <strong className="underline underline-offset-2">{school.name}</strong>
                {school.campus_name ? ` (${school.campus_name})` : ''}.
              </p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/70">
              <p className="font-semibold text-foreground text-sm mb-1">
                This irreversible action will cause the following:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-1 leading-relaxed">
                <li>
                  <strong className="text-foreground">Schedules & Bell Profiles:</strong> All period bells, examination profiles, and daily schedules will be permanently deleted.
                </li>
                <li>
                  <strong className="text-foreground">Audio Library:</strong> All uploaded custom chime files, MP3 bell recordings, and broadcast announcements will be erased.
                </li>
                <li>
                  <strong className="text-foreground">Live Streaming:</strong> All school broadcast playlists and automated streaming schedules will be removed.
                </li>
                <li>
                  <strong className="text-foreground">Hardware Controllers:</strong> Any assigned ESP32 bell controllers will be unassigned and returned to inventory.
                </li>
                <li>
                  <strong className="text-foreground">User Accounts:</strong> Staff and admin accounts bound to this school will be unassigned.
                </li>
              </ul>
            </div>

            {/* Mandatory Checkbox to unlock Step 2 */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card/80 hover:bg-accent/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  id="acknowledge-delete"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input text-destructive focus:ring-destructive accent-destructive cursor-pointer"
                />
                <span className="text-xs font-medium text-foreground select-none leading-relaxed">
                  I have read the consequences above and understand that deleting this school is permanent and completely irreversible.
                </span>
              </label>
            </div>

            {/* Action Buttons for Step 1 */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border/70">
              <Button variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleProceedToStep2}
                disabled={!hasAcknowledged}
                size="sm"
                className="gap-1.5"
              >
                <span>Proceed to Step 2</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: NAME VERIFICATION CHALLENGE */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Final Confirmation Required
              </p>
              <p className="text-xs leading-relaxed text-destructive/90">
                To prevent accidental deletion, you must type the exact school name below to unlock the deletion button.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Target School Name:
              </p>
              <div className="p-3 rounded-xl bg-muted/60 border border-border text-center font-mono font-bold text-foreground text-sm tracking-wide select-all">
                {school.name}
              </div>
            </div>

            <div className="space-y-1.5">
              <Input
                label="Type school name to confirm:"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Type "${school.name}" here`}
                autoFocus
                className={isNameMatch ? 'border-emerald-500/70 focus-visible:ring-emerald-500/30' : ''}
              />
              <div className="px-1 min-h-[20px]">
                {isNameMatch ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    School name matches. You can now permanently delete this school.
                  </p>
                ) : confirmationText.length > 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Name does not match yet. Please type the full name exactly as shown above.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Copy or type the exact name above to proceed.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons for Step 2 */}
            <div className="flex items-center justify-between pt-3 border-t border-border/70">
              <Button
                variant="outline"
                onClick={handleBackToStep1}
                disabled={isDeleting}
                size="sm"
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={onClose} disabled={isDeleting} size="sm">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!isNameMatch || isDeleting}
                  isLoading={isDeleting}
                  size="sm"
                  className="gap-1.5 shadow-sm shadow-destructive/20"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Permanently Delete School</span>
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

