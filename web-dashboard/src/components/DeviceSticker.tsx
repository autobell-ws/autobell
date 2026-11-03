import { QRCodeSVG } from 'qrcode.react'

export interface DeviceStickerProps {
  serialNumber: string
  macAddress: string
  claimPin?: string | null
  modelName?: string | null
  schoolName?: string | null
  compact?: boolean
  className?: string
}

/**
 * Clean model name ensuring internal component chips or third-party part numbers
 * are NEVER displayed on customer-facing retail stickers.
 */
function sanitizeModelName(rawModel?: string | null): string {
  if (!rawModel) return 'AutoBell Pro'
  const lower = rawModel.toLowerCase()
  if (lower.includes('mini') || lower.includes('c3') || lower.includes('compact')) {
    return 'AutoBell Mini'
  }
  return 'AutoBell Pro'
}

/**
 * Extracts the last 4 characters from MAC to construct the dynamic setup hotspot SSID.
 */
function getSetupHotspot(mac: string): string {
  const clean = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase()
  const last4 = clean.slice(-4) || 'SETUP'
  return `AutoBell-${last4}`
}

export function DeviceSticker({
  serialNumber,
  macAddress,
  claimPin,
  modelName,
  schoolName,
  compact = false,
  className = ''
}: DeviceStickerProps) {
  const model = sanitizeModelName(modelName)
  const hotspot = getSetupHotspot(macAddress)
  const pinClean = claimPin ? claimPin.replace(/[^0-9]/g, '') : null
  const formattedPin = pinClean && pinClean.length === 6 ? `${pinClean.slice(0, 3)}-${pinClean.slice(3)}` : pinClean

  // Universal setup URL for retail onboarding
  const setupUrl = `https://app.autobell.pk/setup?sn=${encodeURIComponent(serialNumber)}${pinClean ? `&pin=${encodeURIComponent(pinClean)}` : ''}`

  return (
    <div
      className={`autobell-device-sticker bg-white text-black font-sans select-none border-2 border-black rounded-lg p-3 sm:p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between ${
        compact ? 'w-[320px] min-h-[200px]' : 'w-[380px] min-h-[235px]'
      } ${className}`}
      style={{
        boxSizing: 'border-box',
        color: '#000000',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {/* 1. Header: Logo, Company & Model */}
      <div className="border-b-2 border-black pb-2 mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="AutoBell"
            className="h-7 w-auto object-contain rounded"
            onError={(e) => {
              // Graceful fallback if image is not accessible in print mode
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
          <div>
            <div className="text-base font-black tracking-tight leading-none text-black">
              AUTOBELL
            </div>
            <div className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-800 leading-tight">
              Product of Digitap Business Solution
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-extrabold uppercase px-1.5 py-0.5 border border-black rounded bg-neutral-100 text-black inline-block">
            {model}
          </div>
          <div className="text-[8px] font-mono text-neutral-600 mt-0.5">
            220V AC • 50Hz
          </div>
        </div>
      </div>

      {/* 2. Middle Body: Identifiers & QR Code */}
      <div className="grid grid-cols-12 gap-2 items-center mb-2">
        {/* Hardware Identifiers */}
        <div className="col-span-8 space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-600 w-16">
              Serial No:
            </span>
            <span className="text-xs font-mono font-black text-black tracking-wider">
              {serialNumber}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-600 w-16">
              Device MAC:
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-900 tracking-normal">
              {macAddress}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-600 w-16">
              Hotspot:
            </span>
            <span className="text-[10px] font-mono font-extrabold text-blue-900 bg-blue-50 px-1 py-0.2 border border-blue-200 rounded">
              {hotspot}
            </span>
          </div>

          {formattedPin && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-600 w-16">
                Claim PIN:
              </span>
              <span className="text-[11px] font-mono font-black text-emerald-800 tracking-widest bg-emerald-50 px-1 py-0.2 border border-emerald-300 rounded">
                {formattedPin}
              </span>
            </div>
          )}

          {schoolName && (
            <div className="text-[8.5px] text-neutral-600 truncate max-w-[210px]">
              Assigned: <strong className="text-black">{schoolName}</strong>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="col-span-4 flex flex-col items-center justify-center pl-1 border-l border-neutral-300">
          <div className="p-1 bg-white border border-black rounded shadow-none">
            <QRCodeSVG
              value={setupUrl}
              size={compact ? 56 : 64}
              level="M"
              includeMargin={false}
            />
          </div>
          <span className="text-[7.5px] font-bold text-center text-neutral-800 mt-1 uppercase tracking-tight">
            Scan to Pair
          </span>
        </div>
      </div>

      {/* 3. Onboarding Steps (Compact 3-Step Retail Flow) */}
      <div className="bg-neutral-50 border border-neutral-300 rounded p-1.5 mb-2">
        <div className="text-[8px] font-bold uppercase tracking-wider text-neutral-700 mb-0.5">
          Quick Setup (3 Simple Steps):
        </div>
        <div className="text-[8px] text-neutral-900 leading-tight space-y-0.5">
          <div>
            <strong>1. Power:</strong> Connect power cable to 220V AC & connect speaker.
          </div>
          <div>
            <strong>2. WiFi:</strong> Connect phone to WiFi <strong>{hotspot}</strong> & set router password.
          </div>
          <div>
            <strong>3. Pair:</strong> Scan QR code or visit <strong>app.autobell.pk/setup</strong> to activate.
          </div>
        </div>
      </div>

      {/* 4. Footer: Website, Support Email, Warranty Badge */}
      <div className="border-t border-neutral-300 pt-1.5 flex items-center justify-between text-[8px] text-neutral-700">
        <div className="flex items-center gap-2">
          <span>Web: <strong className="text-black">www.autobell.pk</strong></span>
          <span>•</span>
          <span>Email: <strong className="text-black">support@autobell.pk</strong></span>
        </div>
        <div className="text-[7.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1 rounded">
          1-Year Cloud Free
        </div>
      </div>
    </div>
  )
}
