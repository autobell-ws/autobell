import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { 
  WifiOff, 
  Settings, 
  RefreshCw, 
  Bell, 
  Calendar, 
  BellRing, 
  Volume2, 
  VolumeX, 
  HardDrive, 
  ShieldCheck, 
  MessageCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Printer,
  Sliders,
  Split,
  Radio
} from 'lucide-react'
import { DeviceRegistrationModal } from '../components/DeviceRegistrationModal'
import { DeviceSettingsModal } from '../components/DeviceSettingsModal'
import { DeviceStickerModal } from '../components/DeviceStickerModal'
import { useAuth } from '@/hooks/useAuth'

type DeviceRecord = {
  id: string
  name: string
  status: string | null
  mac_address: string | null
  last_heartbeat: string | null
  volume?: number | null
  input_voltage_mv?: number | null
  location_area?: string | null
  location_city?: string | null
  location_country?: string | null
  location_continent?: string | null
  profile_id?: string | null
  pre_announcement_enabled?: boolean | null
  pre_announcement_id?: string | null
  pre_announcement_delay_seconds?: number | null
  bell_profiles?: { name: string } | null
  board_type?: string | null
  activation_status?: string | null
  is_paid?: boolean | null
  activated_at?: string | null
  subscription_end_date?: string | null
  payment_reference?: string | null
  activation_notes?: string | null
  channel_mode?: 'unified' | 'dual_channel' | null
  volume_left?: number | null
  volume_right?: number | null
  profile_id_left?: string | null
  profile_id_right?: string | null
  channel_label_left?: string | null
  channel_label_right?: string | null
}

const ONLINE_TIMEOUT_MS = 15 * 60 * 1000

function resolveDeviceStatus(status: string | null, last_heartbeat: string | null) {
  if (last_heartbeat) {
    const last = new Date(last_heartbeat).getTime()
    if (!Number.isNaN(last)) {
      const diff = Date.now() - last
      if (diff <= ONLINE_TIMEOUT_MS) {
        return { label: 'online', isOnline: true }
      }
      return { label: 'offline', isOnline: false }
    }
  }
  if (status) {
    return { label: status, isOnline: status === 'online' }
  }
  return { label: 'unknown', isOnline: false }
}

function DualZoneController({
  device,
  allProfiles,
  profileBellCounts,
  onVolumeCommit,
  onProfileCommit,
  onRingZone,
  isActivated,
  isPendingRing
}: {
  device: DeviceRecord
  allProfiles?: { id: string; name: string; is_active: boolean }[]
  profileBellCounts?: Record<string, number>
  onVolumeCommit: (deviceId: string, volume: number, channel: 'left' | 'right' | 'both') => void
  onProfileCommit: (deviceId: string, channel: 'left' | 'right' | 'both', profileId: string) => void
  onRingZone: (device: DeviceRecord, channel: 'left' | 'right' | 'both') => void
  isActivated: boolean
  isPendingRing: boolean
}) {
  const [localLeftVol, setLocalLeftVol] = useState<number>(device.volume_left ?? device.volume ?? 21)
  const [localRightVol, setLocalRightVol] = useState<number>(device.volume_right ?? device.volume ?? 21)

  useEffect(() => {
    setLocalLeftVol(device.volume_left ?? device.volume ?? 21)
    setLocalRightVol(device.volume_right ?? device.volume ?? 21)
  }, [device.volume_left, device.volume_right, device.volume])

  const leftProfileId = device.profile_id_left || device.profile_id || 'INHERIT'
  const rightProfileId = device.profile_id_right || device.profile_id || 'INHERIT'

  const activeSchoolProfile = allProfiles?.find(p => p.is_active)
  const defaultProfileId = activeSchoolProfile?.id

  const leftEffectiveProfileId = leftProfileId === 'INHERIT' ? defaultProfileId : leftProfileId
  const rightEffectiveProfileId = rightProfileId === 'INHERIT' ? defaultProfileId : rightProfileId

  const leftPeriodsCount = leftEffectiveProfileId ? (profileBellCounts?.[leftEffectiveProfileId] ?? 0) : 0
  const rightPeriodsCount = rightEffectiveProfileId ? (profileBellCounts?.[rightEffectiveProfileId] ?? 0) : 0

  return (
    <div className="space-y-3 pt-1 border-t border-border/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Split className="h-4 w-4 text-primary" />
          Dual Channel Audio Outputs (Left & Right Zones)
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
          Independent Zones
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left Zone (Output 1) */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/[0.04] p-3 space-y-2.5 flex flex-col justify-between shadow-xs">
          <div className="space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 truncate">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-xs">L</span>
                <span className="truncate">{device.channel_label_left || 'Left Zone (Output 1)'}</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                Vol: {localLeftVol}/21
              </span>
            </div>

            {/* Schedule Selector & Period Bell Count */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  Period Schedule
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
                  🔔 {leftPeriodsCount} {leftPeriodsCount === 1 ? 'Period' : 'Periods'}
                </span>
              </div>
              <select
                value={leftProfileId}
                onChange={(e) => onProfileCommit(device.id, 'left', e.target.value)}
                className="w-full rounded-md border border-blue-500/30 bg-background px-2 py-1.5 text-xs text-foreground shadow-xs focus:border-blue-500 focus:outline-none"
                aria-label={`Select schedule for Left Zone on ${device.name}`}
              >
                <option value="INHERIT">✨ Inherit School Default</option>
                {allProfiles?.map(p => {
                  const cnt = profileBellCounts?.[p.id] ?? 0
                  return (
                    <option key={p.id} value={p.id}>
                      📋 {p.name} ({cnt} {cnt === 1 ? 'period' : 'periods'}) {p.is_active ? '★' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                  <Sliders className="h-3 w-3 text-blue-500" />
                  Zone Volume
                </span>
                <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {localLeftVol === 0 ? 'Muted' : `${localLeftVol} / 21`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="21"
                  value={localLeftVol}
                  onChange={(e) => setLocalLeftVol(parseInt(e.target.value))}
                  onPointerUp={() => onVolumeCommit(device.id, localLeftVol, 'left')}
                  onKeyUp={() => onVolumeCommit(device.id, localLeftVol, 'left')}
                  className="h-2 flex-1 cursor-pointer rounded-lg appearance-none bg-blue-500/20 accent-blue-600"
                  aria-label={`Adjust Left Zone volume for ${device.name}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newVol = localLeftVol > 0 ? 0 : 21
                    setLocalLeftVol(newVol)
                    onVolumeCommit(device.id, newVol, 'left')
                  }}
                  className={`p-1 rounded-md border text-xs transition-colors shrink-0 ${
                    localLeftVol === 0
                      ? 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25'
                      : 'bg-background text-foreground border-border/60 hover:bg-muted'
                  }`}
                  title={localLeftVol === 0 ? "Unmute Left Zone" : "Mute Left Zone"}
                >
                  {localLeftVol === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Ring Left Zone Test Button */}
          <button
            type="button"
            onClick={() => onRingZone(device, 'left')}
            disabled={!isActivated || isPendingRing}
            className={`w-full inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-all border ${
              isActivated
                ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700 focus:ring-2 focus:ring-blue-500 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground border-border/50 cursor-not-allowed opacity-60'
            }`}
            title={isActivated ? "Test ring Left Zone immediately for 5 seconds" : "Requires active subscription"}
          >
            <BellRing className="mr-1.5 h-3.5 w-3.5" />
            Ring Left Zone
          </button>
        </div>

        {/* Right Zone (Output 2) */}
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.04] p-3 space-y-2.5 flex flex-col justify-between shadow-xs">
          <div className="space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 truncate">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-black text-white shadow-xs">R</span>
                <span className="truncate">{device.channel_label_right || 'Right Zone (Output 2)'}</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                Vol: {localRightVol}/21
              </span>
            </div>

            {/* Schedule Selector & Period Bell Count */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-purple-500" />
                  Period Schedule
                </label>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold font-mono">
                  🔔 {rightPeriodsCount} {rightPeriodsCount === 1 ? 'Period' : 'Periods'}
                </span>
              </div>
              <select
                value={rightProfileId}
                onChange={(e) => onProfileCommit(device.id, 'right', e.target.value)}
                className="w-full rounded-md border border-purple-500/30 bg-background px-2 py-1.5 text-xs text-foreground shadow-xs focus:border-purple-500 focus:outline-none"
                aria-label={`Select schedule for Right Zone on ${device.name}`}
              >
                <option value="INHERIT">✨ Inherit School Default</option>
                {allProfiles?.map(p => {
                  const cnt = profileBellCounts?.[p.id] ?? 0
                  return (
                    <option key={p.id} value={p.id}>
                      📋 {p.name} ({cnt} {cnt === 1 ? 'period' : 'periods'}) {p.is_active ? '★' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                  <Sliders className="h-3 w-3 text-purple-500" />
                  Zone Volume
                </span>
                <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  {localRightVol === 0 ? 'Muted' : `${localRightVol} / 21`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="21"
                  value={localRightVol}
                  onChange={(e) => setLocalRightVol(parseInt(e.target.value))}
                  onPointerUp={() => onVolumeCommit(device.id, localRightVol, 'right')}
                  onKeyUp={() => onVolumeCommit(device.id, localRightVol, 'right')}
                  className="h-2 flex-1 cursor-pointer rounded-lg appearance-none bg-purple-500/20 accent-purple-600"
                  aria-label={`Adjust Right Zone volume for ${device.name}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newVol = localRightVol > 0 ? 0 : 21
                    setLocalRightVol(newVol)
                    onVolumeCommit(device.id, newVol, 'right')
                  }}
                  className={`p-1 rounded-md border text-xs transition-colors shrink-0 ${
                    localRightVol === 0
                      ? 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25'
                      : 'bg-background text-foreground border-border/60 hover:bg-muted'
                  }`}
                  title={localRightVol === 0 ? "Unmute Right Zone" : "Mute Right Zone"}
                >
                  {localRightVol === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Ring Right Zone Test Button */}
          <button
            type="button"
            onClick={() => onRingZone(device, 'right')}
            disabled={!isActivated || isPendingRing}
            className={`w-full inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-all border ${
              isActivated
                ? 'bg-purple-600 text-white hover:bg-purple-700 border-purple-700 focus:ring-2 focus:ring-purple-500 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground border-border/50 cursor-not-allowed opacity-60'
            }`}
            title={isActivated ? "Test ring Right Zone immediately for 5 seconds" : "Requires active subscription"}
          >
            <BellRing className="mr-1.5 h-3.5 w-3.5" />
            Ring Right Zone
          </button>
        </div>
      </div>
    </div>
  )
}

function UnifiedZoneController({
  device,
  allProfiles,
  profileBellCounts,
  onVolumeCommit,
  onProfileCommit,
  onRingZone,
  isActivated,
  isPendingRing
}: {
  device: DeviceRecord
  allProfiles?: { id: string; name: string; is_active: boolean }[]
  profileBellCounts?: Record<string, number>
  onVolumeCommit: (deviceId: string, volume: number, channel: 'left' | 'right' | 'both') => void
  onProfileCommit: (deviceId: string, channel: 'left' | 'right' | 'both', profileId: string) => void
  onRingZone: (device: DeviceRecord, channel: 'left' | 'right' | 'both') => void
  isActivated: boolean
  isPendingRing: boolean
}) {
  const [localVol, setLocalVol] = useState<number>(device.volume ?? 21)

  useEffect(() => {
    setLocalVol(device.volume ?? 21)
  }, [device.volume])

  const profileId = device.profile_id || 'INHERIT'
  const activeSchoolProfile = allProfiles?.find(p => p.is_active)
  const effectiveProfileId = profileId === 'INHERIT' ? activeSchoolProfile?.id : profileId
  const periodsCount = effectiveProfileId ? (profileBellCounts?.[effectiveProfileId] ?? 0) : 0

  return (
    <div className="space-y-3 pt-1 border-t border-border/60">
      <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-primary" />
            Unified Stereo Output (Left + Right Master)
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
            L+R Stereo
          </span>
        </div>

        {/* Schedule Selector */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 text-primary" />
              Period Schedule (Both Channels)
            </label>
            <span className="text-[10px] text-primary font-semibold font-mono">
              🔔 {periodsCount} {periodsCount === 1 ? 'Period' : 'Periods'}
            </span>
          </div>
          <select
            value={profileId}
            onChange={(e) => onProfileCommit(device.id, 'both', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-xs focus:border-primary focus:outline-none"
            aria-label={`Select schedule for ${device.name}`}
          >
            <option value="INHERIT">✨ Inherit School Default</option>
            {allProfiles?.map(p => {
              const cnt = profileBellCounts?.[p.id] ?? 0
              return (
                <option key={p.id} value={p.id}>
                  📋 {p.name} ({cnt} {cnt === 1 ? 'period' : 'periods'}) {p.is_active ? '★' : ''}
                </option>
              )
            })}
          </select>
        </div>

        {/* Master Volume */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-muted-foreground flex items-center gap-1">
              <Sliders className="h-3 w-3 text-primary" />
              Master Volume
            </span>
            <span className="font-mono text-[10px] font-bold text-primary">
              {localVol === 0 ? 'Muted' : `${localVol} / 21`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="21"
              value={localVol}
              onChange={(e) => setLocalVol(parseInt(e.target.value))}
              onPointerUp={() => onVolumeCommit(device.id, localVol, 'both')}
              onKeyUp={() => onVolumeCommit(device.id, localVol, 'both')}
              className="h-2 flex-1 cursor-pointer rounded-lg appearance-none bg-primary/20 accent-primary"
              aria-label={`Adjust master volume for ${device.name}`}
            />
            <button
              type="button"
              onClick={() => {
                const newVol = localVol > 0 ? 0 : 21
                setLocalVol(newVol)
                onVolumeCommit(device.id, newVol, 'both')
              }}
              className={`p-1.5 rounded-md border text-xs transition-colors shrink-0 ${
                localVol === 0
                  ? 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25'
                  : 'bg-background text-foreground border-border/60 hover:bg-muted'
              }`}
              title={localVol === 0 ? "Unmute master bell" : "Mute master bell"}
            >
              {localVol === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-primary" />}
            </button>
          </div>
        </div>

        {/* Ring Button */}
        <button
          type="button"
          onClick={() => onRingZone(device, 'both')}
          disabled={!isActivated || isPendingRing}
          className={`w-full inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold shadow-xs transition-all ${
            isActivated
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary'
              : 'bg-muted text-muted-foreground border border-border/50 cursor-not-allowed opacity-60'
          }`}
        >
          <BellRing className="mr-1.5 h-3.5 w-3.5" />
          Test Ring Bell (Unified L+R)
        </button>
      </div>
    </div>
  )
}

export default function BellManagement() {
  const { schoolId, role } = useAuth()
  const effectiveSchoolId = schoolId || 'c548b770-fac6-4246-9c03-2c0f3ab72474'
  const isSuperAdmin = role === 'super_admin'
  const queryClient = useQueryClient()
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Payment Slip / Activation Request state
  const [deviceForSlip, setDeviceForSlip] = useState<DeviceRecord | null>(null)
  const [slipPaymentRef, setSlipPaymentRef] = useState('')
  const [slipNotes, setSlipNotes] = useState('')

  // Sticker Print Modal State
  const [selectedStickerDevice, setSelectedStickerDevice] = useState<{
    serialNumber: string
    macAddress: string
    claimPin?: string | null
    modelName?: string | null
    schoolName?: string | null
  } | null>(null)
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false)

  const { data: devices, isLoading } = useQuery<DeviceRecord[]>({
    queryKey: ['devices', effectiveSchoolId, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from('bell_devices')
        .select('*, bell_profiles!bell_devices_profile_id_fkey(name)')
        .order('name')
      if (effectiveSchoolId) {
        query = query.eq('school_id', effectiveSchoolId)
      }
      let { data, error } = await query
      if (error) {
        console.warn("Primary device query failed, trying fallback:", error)
        const fallbackQuery = supabase
          .from('bell_devices')
          .select('*, bell_profiles(name)')
          .order('name')
        if (effectiveSchoolId) fallbackQuery.eq('school_id', effectiveSchoolId)
        const fbRes = await fallbackQuery
        if (!fbRes.error) {
          data = fbRes.data
          error = null
        } else {
          const rawQuery = supabase
            .from('bell_devices')
            .select('*')
            .order('name')
          if (effectiveSchoolId) rawQuery.eq('school_id', effectiveSchoolId)
          const rawRes = await rawQuery
          if (!rawRes.error) {
            data = rawRes.data
            error = null
          }
        }
      }
      if (error) {
        console.error("Error fetching devices:", error)
        throw error
      }
      return (data ?? []) as DeviceRecord[]
    },
    enabled: true,
    refetchInterval: 15000 // Refresh every 15 seconds to catch heartbeats
  })

  const { data: allProfiles } = useQuery({
    queryKey: ['bell_profiles', effectiveSchoolId, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from('bell_profiles')
        .select('id, name, is_active, board_type')
        .order('name')
      if (effectiveSchoolId) {
        query = query.eq('school_id', effectiveSchoolId)
      }
      const { data, error } = await query
      if (error) {
        console.error('Error fetching bell profiles:', error)
        return []
      }
      return data ?? []
    },
    enabled: true
  })

  // Count bell times (periods) per profile for immediate display
  const { data: profileBellCounts } = useQuery<Record<string, number>>({
    queryKey: ['profile_bell_counts', effectiveSchoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bell_times')
        .select('profile_id')
      if (error) {
        console.warn('Error fetching bell times counts:', error)
        return {}
      }
      const counts: Record<string, number> = {}
      data?.forEach((bt: { profile_id: string }) => {
        if (bt.profile_id) {
          counts[bt.profile_id] = (counts[bt.profile_id] || 0) + 1
        }
      })
      return counts
    },
    enabled: true
  })

  const registerDeviceMutation = useMutation({
    mutationFn: async (newDevice: { name: string; serial_number: string; claim_pin: string }) => {
      if (!schoolId) {
        throw new Error('You must be logged in with a valid school ID to register devices.')
      }

      // Try zero-touch activation with Claim PIN first
      if (newDevice.claim_pin) {
        const { error: activateError } = await supabase.rpc('claim_and_activate_device', {
          p_serial_number: newDevice.serial_number,
          p_claim_pin: newDevice.claim_pin,
          p_device_name: newDevice.name
        })
        if (!activateError) return
        console.warn('claim_and_activate_device fallback to claim_device:', activateError)
        if (activateError.message?.includes('Invalid Claim PIN')) {
          throw activateError
        }
      }

      const { error } = await supabase.rpc('claim_device', {
        p_serial_number: newDevice.serial_number,
        p_device_name: newDevice.name
      })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setIsRegisterModalOpen(false)
      setNotification({ type: 'success', message: 'Device claimed and activated successfully! 1-Year Free Cloud Service is active.' })
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error) => {
      console.error('Error registering device:', error)
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to register device. Please try again.' })
      setTimeout(() => setNotification(null), 3000)
    }
  })

  const submitSlipMutation = useMutation({
    mutationFn: async ({ deviceId, paymentRef, notes }: { deviceId: string; paymentRef: string; notes: string }) => {
      const { error } = await supabase.rpc('submit_activation_request', {
        p_device_id: deviceId,
        p_payment_reference: paymentRef,
        p_notes: notes || null
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setNotification({ type: 'success', message: 'Activation request submitted! Our support team will verify and activate your 1-Year Free subscription shortly.' })
      setTimeout(() => setNotification(null), 5000)
      setDeviceForSlip(null)
      setSlipPaymentRef('')
      setSlipNotes('')
    },
    onError: (error) => {
      console.error('Error submitting activation request:', error)
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to submit activation request.' })
      setTimeout(() => setNotification(null), 4000)
    }
  })

  const sendCommandMutation = useMutation({
    mutationFn: async ({ deviceId, command, payload = {} }: { deviceId: string, command: string, payload?: Record<string, unknown> }) => {
      if (!schoolId && !isSuperAdmin) throw new Error('No school ID found')
      
      const { data: insertedCmd, error } = await supabase.from('command_queue').insert({
        device_id: deviceId,
        command,
        payload
      }).select('id').single()
      if (error) throw error

      // Push via Supabase Realtime broadcast channels for zero-latency execution (<100ms)
      const targetDevice = devices?.find(d => d.id === deviceId)
      if (targetDevice?.mac_address) {
        const cleanMac = targetDevice.mac_address.replace(/[: -]/g, '').toUpperCase()
        const ch = supabase.channel(`device:${cleanMac}`)
        ch.subscribe((st) => {
          if (st === 'SUBSCRIBED') {
            ch.send({
              type: 'broadcast',
              event: 'command',
              payload: {
                id: insertedCmd ? String(insertedCmd.id) : undefined,
                command,
                payload
              }
            }).then(() => supabase.removeChannel(ch))
          }
        })
      }
    },
    onSuccess: (_, variables) => {
      const chDesc = variables.payload?.channel === 'left' ? 'Left Zone' : variables.payload?.channel === 'right' ? 'Right Zone' : 'Both Zones'
      setNotification({ type: 'success', message: `Command ${variables.command} (${chDesc}) sent successfully!` })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (error) => {
      console.error('Error sending command:', error)
      const message =
        error instanceof Error && error.message.includes('Test commands are disabled during quiet hours')
          ? 'Test commands are disabled during quiet hours.'
          : 'Failed to send command. Please try again.'
      setNotification({ type: 'error', message })
      setTimeout(() => setNotification(null), 3000)
    }
  })

  const updateVolumeMutation = useMutation({
    mutationFn: async ({ 
      deviceId, 
      volume, 
      channel 
    }: { 
      deviceId: string; 
      volume: number; 
      channel?: 'left' | 'right' | 'both' 
    }) => {
      if (!schoolId && !isSuperAdmin) throw new Error('No school ID found')

      const targetChannel = channel || 'both'
      const updateData: any = {}

      if (targetChannel === 'left') {
        updateData.volume_left = volume
      } else if (targetChannel === 'right') {
        updateData.volume_right = volume
      } else {
        updateData.volume = volume
        updateData.volume_left = volume
        updateData.volume_right = volume
      }

      const { error: dbError } = await supabase
        .from('bell_devices')
        .update(updateData)
        .eq('id', deviceId)

      if (dbError) throw dbError

      const { error: cmdError } = await supabase.from('command_queue').insert({
        device_id: deviceId,
        command: 'SET_VOLUME',
        payload: { 
          volume,
          channel: targetChannel,
          volume_left: updateData.volume_left,
          volume_right: updateData.volume_right
        }
      })

      if (cmdError) throw cmdError
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      const chLabel = variables.channel === 'left' ? 'Left Zone' : variables.channel === 'right' ? 'Right Zone' : 'Master'
      setNotification({ type: 'success', message: `${chLabel} volume set to ${variables.volume}/21.` })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (error) => {
      console.error('Error updating volume:', error)
      setNotification({ type: 'error', message: 'Failed to update volume. Please try again.' })
      setTimeout(() => setNotification(null), 3000)
    }
  })

  const updateZoneProfileMutation = useMutation({
    mutationFn: async ({
      deviceId,
      channel,
      profileId
    }: {
      deviceId: string
      channel: 'left' | 'right' | 'both'
      profileId: string
    }) => {
      if (!schoolId && !isSuperAdmin) throw new Error('No school ID found')

      const targetProfId = profileId === 'INHERIT' ? null : profileId
      const updateData: any = {}

      if (channel === 'left') {
        updateData.profile_id_left = targetProfId
      } else if (channel === 'right') {
        updateData.profile_id_right = targetProfId
      } else {
        updateData.profile_id = targetProfId
        updateData.profile_id_left = targetProfId
        updateData.profile_id_right = targetProfId
      }

      const { error: dbError } = await supabase
        .from('bell_devices')
        .update(updateData)
        .eq('id', deviceId)

      if (dbError) throw dbError

      const { error: cmdError } = await supabase.from('command_queue').insert({
        device_id: deviceId,
        command: 'SYNC_SCHEDULES',
        payload: {
          source: 'zone_profile_select',
          channel,
          profile_id: targetProfId,
          profile_id_left: updateData.profile_id_left,
          profile_id_right: updateData.profile_id_right
        }
      })

      if (cmdError) throw cmdError
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      const chLabel = variables.channel === 'left' ? 'Left Zone' : variables.channel === 'right' ? 'Right Zone' : 'Both Zones'
      setNotification({ type: 'success', message: `${chLabel} schedule updated & synced to AutoBell!` })
      setTimeout(() => setNotification(null), 3500)
    },
    onError: (error) => {
      console.error('Error updating zone profile:', error)
      setNotification({ type: 'error', message: 'Failed to update schedule profile.' })
      setTimeout(() => setNotification(null), 3000)
    }
  })

  const toggleChannelModeMutation = useMutation({
    mutationFn: async ({ deviceId, currentMode }: { deviceId: string; currentMode?: string | null }) => {
      const newMode = currentMode === 'dual_channel' ? 'unified' : 'dual_channel'
      const { error } = await supabase
        .from('bell_devices')
        .update({ channel_mode: newMode })
        .eq('id', deviceId)
      if (error) throw error

      await supabase.from('command_queue').insert({
        device_id: deviceId,
        command: 'SYNC_SCHEDULES',
        payload: { source: 'toggle_channel_mode', channel_mode: newMode }
      })
      return newMode
    },
    onSuccess: (newMode) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setNotification({ 
        type: 'success', 
        message: newMode === 'dual_channel' 
          ? 'Switched to Dual Independent Zones (Left & Right)! You can now control schedules and volumes per zone.' 
          : 'Switched to Unified Stereo mode.' 
      })
      setTimeout(() => setNotification(null), 4000)
    },
    onError: (error) => {
      console.error('Error toggling channel mode:', error)
      setNotification({ type: 'error', message: 'Failed to change audio channel mode.' })
      setTimeout(() => setNotification(null), 3000)
    }
  })

  const handleRingZone = (device: DeviceRecord, channel: 'left' | 'right' | 'both') => {
    const actStatus = device.activation_status || 'pending_activation'
    const isExpired = device.subscription_end_date ? new Date(device.subscription_end_date).getTime() < Date.now() : false
    const isActivated = actStatus === 'active' && !isExpired

    if (!isActivated) {
      alert('This device is not yet activated. Please contact support or submit payment details to activate your 1-year free license.')
      return
    }

    const chLabel = channel === 'left'
      ? (device.channel_label_left || 'Left Zone (Output 1)')
      : channel === 'right'
      ? (device.channel_label_right || 'Right Zone (Output 2)')
      : 'Both Zones'

    const confirmed = window.confirm(`Test ring ${chLabel} on "${device.name || 'AutoBell'}" immediately for 5 seconds?`)
    if (!confirmed) return

    sendCommandMutation.mutate({
      deviceId: device.id,
      command: 'RING',
      payload: {
        duration: 5,
        channel
      }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-10 w-40 bg-muted rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-56 bg-muted rounded-xl" />
          <div className="h-56 bg-muted rounded-xl" />
          <div className="h-56 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bell Management</h2>
          <p className="text-xs text-muted-foreground">Manage school bell hardware, dual-channel speaker zones, and custom period schedules.</p>
        </div>
        <button 
          onClick={() => setIsRegisterModalOpen(true)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Register new bell device"
        >
          Register New Device
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' : 'bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20'}`}>
          {notification.message}
        </div>
      )}

      {(!devices || devices.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/50 text-foreground space-y-4">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <Bell className="h-10 w-10 stroke-1" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">No Bell Devices Registered</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md">Register your school's AutoBell controller hardware to start configuring schedules, volume, location tags, and remote buzzers.</p>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Register your first device"
          >
            Register Your First Device
          </button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {devices.map((device) => {
            const statusInfo = resolveDeviceStatus(device.status, device.last_heartbeat)
            const isDual = device.channel_mode === 'dual_channel' && device.board_type !== 'ESP32-C3 Mini'

            const actStatus = device.activation_status || 'pending_activation'
            const isExpired = device.subscription_end_date ? new Date(device.subscription_end_date).getTime() < Date.now() : false
            const isActivated = actStatus === 'active' && !isExpired
            const isPending = actStatus === 'pending_activation' || !device.activation_status
            const isSuspended = actStatus === 'suspended'
            const daysLeft = device.subscription_end_date ? Math.ceil((new Date(device.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

            return (
            <div key={device.id} className={`flex h-full flex-col justify-between rounded-xl border bg-card text-foreground p-5 shadow-sm transition-all hover:shadow-md space-y-4 ${
              isPending ? 'border-amber-500/40 bg-amber-500/[0.02]' : isExpired || isSuspended ? 'border-destructive/40 bg-destructive/[0.02]' : 'border-border'
            }`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-foreground truncate flex items-center gap-2" title={device.name || 'Unnamed Device'}>
                      <span>{device.name || 'Unnamed Device'}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold shrink-0">
                        {device.board_type === 'ESP32-C3 Mini' ? 'Compact' : 'Standard Dual-Zone'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground truncate" title={device.id}>
                      ID: {device.id}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      statusInfo.isOnline ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {statusInfo.isOnline ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    {statusInfo.label.toUpperCase()}
                  </span>
                </div>

                {/* Activation & Subscription Banner */}
                {isPending ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </span>
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Pending Activation (1st Year Free)</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                      Your AutoBell is linked! Once your purchase is confirmed by support, 12 months of free automated cloud ringing will be activated immediately.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={`https://wa.me/923000000000?text=${encodeURIComponent(`Hello AutoBell Support, please activate my device.\nDevice: ${device.name || 'AutoBell'}\nMAC: ${device.mac_address || 'N/A'}\nDevice ID: ${device.id}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                        WhatsApp for 1-Min Activation
                      </a>
                      <button
                        onClick={() => {
                          setDeviceForSlip(device)
                          setSlipPaymentRef(device.payment_reference || '')
                          setSlipNotes(device.activation_notes || '')
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-amber-500/40 bg-card px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-500/15 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Submit Payment Slip
                      </button>
                    </div>
                  </div>
                ) : isExpired ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 text-destructive">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-bold">1-Year Free Subscription Expired</span>
                    </div>
                    <p className="text-[11px] text-destructive/90 leading-relaxed">
                      Your cloud subscription expired on {device.subscription_end_date ? new Date(device.subscription_end_date).toLocaleDateString() : 'recently'}. Please renew your annual subscription to resume automatic schedules and bells.
                    </p>
                    <a
                      href={`https://wa.me/923000000000?text=${encodeURIComponent(`Hello AutoBell Support, I would like to renew my subscription for device: ${device.name || 'AutoBell'} (MAC: ${device.mac_address || 'N/A'}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                      Renew Subscription via WhatsApp
                    </a>
                  </div>
                ) : isSuspended ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Device Suspended. Contact AutoBell support for assistance.</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>1-Year Free License Active</span>
                    </div>
                    {daysLeft !== null && (
                      <span className="text-[11px] text-muted-foreground font-medium font-mono">
                        {daysLeft} days left
                      </span>
                    )}
                  </div>
                )}

                {/* Device Hardware Spec & Quick Toggle */}
                {device.board_type !== 'ESP32-C3 Mini' && (
                  <div className="flex items-center justify-between text-xs px-2 py-1 rounded-md bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <HardDrive className="h-3 w-3 text-emerald-500" />
                      <span>Audio Outputs: <b>Stereo Left & Right</b></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleChannelModeMutation.mutate({ deviceId: device.id, currentMode: device.channel_mode })}
                      className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded border border-primary/20 hover:bg-primary/10"
                      title={isDual ? "Switch to Unified Stereo Mode" : "Split into independent Left and Right speaker zones"}
                    >
                      {isDual ? <Radio className="h-3 w-3" /> : <Split className="h-3 w-3" />}
                      {isDual ? 'Make Unified L+R' : 'Split into Dual Zones'}
                    </button>
                  </div>
                )}

                {/* Primary Dual Zones Controller */}
                {device.board_type === 'ESP32-C3 Mini' ? (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2 select-none">
                    <Bell className="h-4 w-4 shrink-0 text-primary animate-pulse" />
                    <span>Relay Bell: Physical 5V switching output is enabled for mechanical gong.</span>
                  </div>
                ) : isDual ? (
                  <DualZoneController
                    device={device}
                    allProfiles={allProfiles}
                    profileBellCounts={profileBellCounts}
                    onVolumeCommit={(devId, vol, ch) => updateVolumeMutation.mutate({ deviceId: devId, volume: vol, channel: ch })}
                    onProfileCommit={(devId, ch, profId) => updateZoneProfileMutation.mutate({ deviceId: devId, channel: ch, profileId: profId })}
                    onRingZone={handleRingZone}
                    isActivated={isActivated}
                    isPendingRing={sendCommandMutation.isPending}
                  />
                ) : (
                  <UnifiedZoneController
                    device={device}
                    allProfiles={allProfiles}
                    profileBellCounts={profileBellCounts}
                    onVolumeCommit={(devId, vol, ch) => updateVolumeMutation.mutate({ deviceId: devId, volume: vol, channel: ch })}
                    onProfileCommit={(devId, ch, profId) => updateZoneProfileMutation.mutate({ deviceId: devId, channel: ch, profileId: profId })}
                    onRingZone={handleRingZone}
                    isActivated={isActivated}
                    isPendingRing={sendCommandMutation.isPending}
                  />
                )}

                {/* Hardware Info / Diagnostics Footer */}
                <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-3 rounded-lg border border-border/40">
                  <div className="truncate"><strong>MAC:</strong> {device.mac_address || 'N/A'}</div>
                  <div><strong>Last seen:</strong> {device.last_heartbeat ? new Date(device.last_heartbeat).toLocaleString() : 'Never'}</div>
                  <div>
                    <strong>Input power:</strong>{' '}
                    {typeof device.input_voltage_mv === 'number'
                      ? `${(device.input_voltage_mv / 1000).toFixed(2)} V (${device.input_voltage_mv >= 4500 ? 'Mains' : 'Battery'})`
                      : 'N/A'}
                  </div>
                  <div className="truncate">
                    <strong>Location:</strong>{' '}
                    {(() => {
                      const parts = [
                        device.location_area,
                        device.location_city,
                        device.location_country,
                        device.location_continent
                      ].filter(val => val && val.trim().toLowerCase() !== 'null' && val.trim().toLowerCase() !== 'undefined');
                      return parts.length > 0 ? parts.join(', ') : 'Unknown';
                    })()}
                  </div>
                </div>
              </div>

              {/* Master Actions Bar */}
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRingZone(device, 'both')}
                    className={`inline-flex items-center justify-center rounded-lg px-2.5 py-2 text-xs font-semibold shadow-xs transition-all focus:outline-none focus:ring-2 ${
                      isActivated 
                        ? 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 active:scale-[0.98]' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                    }`}
                    disabled={sendCommandMutation.isPending || !isActivated}
                    aria-label={`Ring both zones on ${device.name || 'device'} now`}
                    title={isActivated ? "Ring both Left and Right speaker zones simultaneously" : "Requires active product subscription"}
                  >
                    <BellRing className="mr-1.5 h-4 w-4" />
                    Ring Both Zones
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDevice(device)
                      setIsSettingsModalOpen(true)
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 py-2 text-xs font-medium hover:bg-primary/90 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label={`Open settings for ${device.name || 'device'}`}
                  >
                    <Settings className="mr-1.5 h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStickerDevice({
                        serialNumber: `AB-${(device.mac_address || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`,
                        macAddress: device.mac_address || '00:00:00:00:00:00',
                        modelName: device.board_type,
                        schoolName: null
                      })
                      setIsStickerModalOpen(true)
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground border border-border px-2 py-2 text-xs font-medium hover:bg-secondary/80 shadow-xs transition-all"
                    title="Print Controller Back Sticker"
                  >
                    <Printer className="mr-1 h-3.5 w-3.5 text-primary" />
                    Sticker
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => sendCommandMutation.mutate({ deviceId: device.id, command: 'CONFIG' })}
                    className="inline-flex items-center justify-center rounded-lg bg-muted px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={sendCommandMutation.isPending}
                    aria-label={`Sync configuration for ${device.name || 'device'}`}
                  >
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    Sync
                  </button>
                  <button
                    onClick={() => {
                      if (!isActivated) {
                        alert('Buzzer test requires an active product subscription.')
                        return
                      }
                      const confirmed = window.confirm('Run a buzzer test on this device? This will briefly ring the onboard piezo buzzer.')
                      if (!confirmed) return
                      sendCommandMutation.mutate({ deviceId: device.id, command: 'TEST_BUZZER' })
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-amber-500/15 px-2 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={sendCommandMutation.isPending || !isActivated}
                    aria-label={`Test buzzer on ${device.name || 'device'}`}
                  >
                    <Bell className="mr-1 h-3.5 w-3.5" />
                    Buzzer
                  </button>
                  <button
                    onClick={() => {
                      const confirmed = window.confirm('Reboot this device now? Current audio will stop and the bell controller will restart.')
                      if (!confirmed) return
                      sendCommandMutation.mutate({ deviceId: device.id, command: 'REBOOT' })
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive dark:text-red-400 hover:bg-destructive/20 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-destructive"
                    disabled={sendCommandMutation.isPending}
                    aria-label={`Reboot ${device.name || 'device'}`}
                  >
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    Reboot
                  </button>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <DeviceRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={async (data) => {
          await registerDeviceMutation.mutateAsync(data)
        }}
      />

      <DeviceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false)
          setSelectedDevice(null)
        }}
        device={selectedDevice}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['devices'] })
          setNotification({ type: 'success', message: 'Device settings updated successfully!' })
          setTimeout(() => setNotification(null), 3000)
        }}
      />

      {selectedStickerDevice && (
        <DeviceStickerModal
          isOpen={isStickerModalOpen}
          onClose={() => {
            setIsStickerModalOpen(false)
            setSelectedStickerDevice(null)
          }}
          device={selectedStickerDevice}
        />
      )}

      {/* Manual Payment Slip Submission Modal */}
      {deviceForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <FileText className="h-5 w-5 text-amber-500" />
                <span>Submit Activation Request</span>
              </div>
              <button onClick={() => setDeviceForSlip(null)} className="text-muted-foreground hover:text-foreground text-sm">
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you purchased this AutoBell through a distributor or direct transfer, enter your transaction ID or reference below. Our onboarding team activates 1-Year Free licenses within 15 minutes.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Device Name & MAC</label>
                <input
                  type="text"
                  disabled
                  value={`${deviceForSlip.name || 'AutoBell'} (${deviceForSlip.mac_address || 'N/A'})`}
                  className="w-full mt-1 rounded-lg border border-input bg-muted px-3 py-2 text-xs text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Payment / Invoice Reference</label>
                <input
                  type="text"
                  value={slipPaymentRef}
                  onChange={(e) => setSlipPaymentRef(e.target.value)}
                  placeholder="e.g. Bank Ref #, Receipt #, or EasyPaisa TID"
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Notes / Comments (Optional)</label>
                <textarea
                  rows={2}
                  value={slipNotes}
                  onChange={(e) => setSlipNotes(e.target.value)}
                  placeholder="e.g. Paid via Alfalah transfer today at 10 AM"
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setDeviceForSlip(null)}
                className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={!slipPaymentRef.trim() || submitSlipMutation.isPending}
                onClick={() => {
                  if (!slipPaymentRef.trim()) return
                  submitSlipMutation.mutate({
                    deviceId: deviceForSlip.id,
                    paymentRef: slipPaymentRef.trim(),
                    notes: slipNotes.trim()
                  })
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm"
              >
                {submitSlipMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
