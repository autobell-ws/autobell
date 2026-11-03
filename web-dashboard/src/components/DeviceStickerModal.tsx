import { useState, useRef } from 'react'
import { X, Printer, Copy, Check, Sparkles, ExternalLink } from 'lucide-react'
import { DeviceSticker, type DeviceStickerProps } from './DeviceSticker'

interface DeviceStickerModalProps {
  isOpen: boolean
  onClose: () => void
  device: DeviceStickerProps | null
}

export function DeviceStickerModal({ isOpen, onClose, device }: DeviceStickerModalProps) {
  const [copied, setCopied] = useState(false)
  const [customPin, setCustomPin] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !device) return null

  const effectivePin = customPin || device.claimPin || ''
  const setupUrl = `https://app.autobell.pk/setup?sn=${encodeURIComponent(device.serialNumber)}${effectivePin ? `&pin=${encodeURIComponent(effectivePin)}` : ''}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(setupUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Global CSS for Print Mode specifically isolating the sticker */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .autobell-printable-area, .autobell-printable-area * {
            visibility: visible !important;
          }
          .autobell-printable-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            display: flex !important;
            justify-content: flex-start !important;
            align-items: flex-start !important;
          }
          .autobell-no-print {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 4mm;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 autobell-no-print">
        <div className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Print Controller Back Sticker</h3>
                <p className="text-xs text-muted-foreground">Retail tamper-evident label for hardware enclosure</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex flex-col items-center">
            {/* Live Sticker Preview */}
            <div
              ref={printRef}
              className="autobell-printable-area p-2 bg-neutral-100 rounded-xl border border-neutral-300 shadow-inner flex justify-center"
            >
              <DeviceSticker
                serialNumber={device.serialNumber}
                macAddress={device.macAddress}
                claimPin={effectivePin}
                modelName={device.modelName}
                schoolName={device.schoolName}
              />
            </div>

            {/* Optional PIN modifier if unassigned or testing */}
            <div className="w-full bg-muted/30 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">6-Digit Claim PIN on Sticker</span>
                <span className="text-muted-foreground text-[11px]">Optional override</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder={device.claimPin || 'e.g. 648291'}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value)}
                  className="flex-1 font-mono tracking-widest text-center text-xs font-bold bg-background border border-border rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium border border-border hover:bg-secondary/80 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Universal setup link:{' '}
                <a href={setupUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  {setupUrl.slice(0, 45)}... <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            {/* Print Instructions */}
            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <strong>Label Printer Guide:</strong> Sized for standard thermal label printers (3.5" × 2.25" / 90mm × 58mm or standard A4 sticker sheets). Clicking <strong>Print Sticker</strong> below automatically opens your browser print dialog targeting only this label.
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-lg shadow-primary/25 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sticker Now</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
