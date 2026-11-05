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

  const generateStickerHtml = () => {
    if (!printRef.current) return ''

    // Grab stylesheet links and styles, strictly filtering out any rules that hide elements
    const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .filter((el) => {
        const text = el.textContent || ''
        return !text.includes('visibility: hidden') && !text.includes('autobell-printable-area')
      })
      .map((el) => el.outerHTML)
      .join('\n')

    const stickerHtml = printRef.current.innerHTML

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <base href="${window.location.origin}/" />
    <title>AutoBell Label - ${device.serialNumber}</title>
    ${headStyles}
    <style>
      @page {
        size: auto;
        margin: 4mm;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        height: auto !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      }
      body {
        display: flex !important;
        justify-content: flex-start !important;
        align-items: flex-start !important;
        padding: 4mm !important;
        visibility: visible !important;
        opacity: 1 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body * {
        visibility: visible !important;
        opacity: 1 !important;
      }
      .autobell-device-sticker {
        margin: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-shadow: none !important;
        border: 2px solid #000000 !important;
        background-color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    </style>
  </head>
  <body>
    ${stickerHtml}
  </body>
</html>`
  }

  const handlePrint = () => {
    const fullHtml = generateStickerHtml()
    if (!fullHtml) return

    // Clean up any existing iframe
    const existing = document.getElementById('autobell-sticker-print-frame')
    if (existing) {
      existing.remove()
    }

    const iframe = document.createElement('iframe')
    iframe.id = 'autobell-sticker-print-frame'
    // Positive dimensions positioned off-screen to guarantee Chrome's layout engine paints all elements
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.top = '-9999px'
    iframe.style.width = '600px'
    iframe.style.height = '500px'
    iframe.style.border = '0'
    iframe.style.opacity = '0.01'
    document.body.appendChild(iframe)

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument
    if (!frameDoc) return

    frameDoc.open()
    frameDoc.write(fullHtml)
    frameDoc.close()

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (err) {
        console.error('Sticker iframe print error:', err)
      }
    }, 300)
  }

  const handleOpenPrintWindow = () => {
    const fullHtml = generateStickerHtml()
    if (!fullHtml) return

    const printWin = window.open('', '_blank', 'width=650,height=550,menubar=no,toolbar=no,location=no,status=no')
    if (!printWin) {
      handlePrint()
      return
    }

    printWin.document.open()
    printWin.document.write(fullHtml)
    printWin.document.close()

    setTimeout(() => {
      try {
        printWin.focus()
        printWin.print()
      } catch (err) {
        console.error('Print window error:', err)
      }
    }, 350)
  }

  return (
    <>
      <style>{`
        @media print {
          .autobell-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:bg-transparent print:p-0 print:static print:block print:inset-auto">
        <div className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:border-none print:shadow-none print:bg-transparent print:max-h-none print:w-auto print:max-w-none print:overflow-visible print:m-0 print:p-0">
          {/* Header */}
          <div className="autobell-no-print px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
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
          <div className="p-6 overflow-y-auto space-y-6 flex flex-col items-center print:p-0 print:m-0 print:overflow-visible print:space-y-0 print:block">
            {/* Live Sticker Preview */}
            <div className="p-2 bg-neutral-100 rounded-xl border border-neutral-300 shadow-inner flex justify-center print:p-0 print:bg-white print:border-none print:shadow-none print:m-0">
              <div ref={printRef} className="autobell-printable-area">
                <DeviceSticker
                  serialNumber={device.serialNumber}
                  macAddress={device.macAddress}
                  claimPin={effectivePin}
                  modelName={device.modelName}
                  schoolName={device.schoolName}
                />
              </div>
            </div>

            {/* Optional PIN modifier if unassigned or testing */}
            <div className="autobell-no-print w-full bg-muted/30 border border-border rounded-xl p-4 space-y-3">
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
            <div className="autobell-no-print w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <strong>Label Printer Guide:</strong> Sized for standard thermal label printers (3.5" × 2.25" / 90mm × 58mm or standard A4 sticker sheets). Clicking <strong>Print Sticker Now</strong> opens your browser print dialog targeting strictly this single sticker.
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="autobell-no-print px-6 py-4 border-t border-border flex items-center justify-end gap-2.5 bg-muted/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleOpenPrintWindow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
              title="Open label preview and print dialog in a new clean window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Print in Window</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-lg shadow-primary/25 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label Now</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
