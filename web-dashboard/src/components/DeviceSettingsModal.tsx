import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Save, Volume2, Calendar, BellRing, Play, Pause, Cpu, Upload, Sliders, Split, Radio, Info, MapPin, Sparkles, Navigation } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { resolveDeviceLocation } from '@/lib/locationResolver'

type BellProfileOption = {
  id: string
  name: string
  is_active: boolean
}

type PreAnnouncementSoundOption = {
  id: string
  title: string
  file_url: string
}

type DeviceRecord = {
  id: string
  name: string
  volume?: number | null
  profile_id?: string | null
  pre_announcement_enabled?: boolean | null
  pre_announcement_id?: string | null
  pre_announcement_delay_seconds?: number | null
  pre_announcement_volume?: number | null
  board_type?: string | null
  channel_mode?: 'unified' | 'dual_channel' | null
  volume_left?: number | null
  volume_right?: number | null
  profile_id_left?: string | null
  profile_id_right?: string | null
  channel_label_left?: string | null
  channel_label_right?: string | null
  location_area?: string | null
  location_city?: string | null
  location_province?: string | null
  location_country?: string | null
  location_continent?: string | null
}

type DeviceSettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  device: DeviceRecord | null
  onUpdate: () => void
}

export function DeviceSettingsModal({ isOpen, onClose, device, onUpdate }: DeviceSettingsModalProps) {
  const { schoolId } = useAuth()
  const [volume, setVolume] = useState<number>(21)

  // Dual-Channel State
  const [channelMode, setChannelMode] = useState<'unified' | 'dual_channel'>('unified')
  const [channelLabelLeft, setChannelLabelLeft] = useState<string>('Left Channel')
  const [channelLabelRight, setChannelLabelRight] = useState<string>('Right Channel')
  const [volumeLeft, setVolumeLeft] = useState<number>(21)
  const [volumeRight, setVolumeRight] = useState<number>(21)
  const [profileIdLeft, setProfileIdLeft] = useState<string>('INHERIT')
  const [profileIdRight, setProfileIdRight] = useState<string>('INHERIT')
  
  // Profile Assignment State (Unified)
  const [profileId, setProfileId] = useState<string>('INHERIT')
  const [profiles, setProfiles] = useState<BellProfileOption[]>([])

  // Geographic Location State
  const [locationArea, setLocationArea] = useState<string>('')
  const [locationCity, setLocationCity] = useState<string>('')
  const [locationProvince, setLocationProvince] = useState<string>('')
  const [locationCountry, setLocationCountry] = useState<string>('')
  const [locationContinent, setLocationContinent] = useState<string>('')
  const [schoolData, setSchoolData] = useState<{ name?: string; address?: string; campus_name?: string; city?: string } | null>(null)

  // Pre-Announcement Override State
  const [useCustomPa, setUseCustomPa] = useState<boolean>(false)
  const [paEnabled, setPaEnabled] = useState<boolean>(true)
  const [paSoundId, setPaSoundId] = useState<string>('')
  const [paDelay, setPaDelay] = useState<number>(3)
  const [paSounds, setPaSounds] = useState<PreAnnouncementSoundOption[]>([])
  const [schoolDefaultSoundTitle, setSchoolDefaultSoundTitle] = useState<string>('')

  // Audio playback preview state
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // OTA Firmware Update State
  const [otaUrl, setOtaUrl] = useState<string>('')
  const [isOtaUploading, setIsOtaUploading] = useState<boolean>(false)
  const [isOtaSending, setIsOtaSending] = useState<boolean>(false)

  const handleOtaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.bin')) {
      setError('Please select a valid .bin firmware file')
      return
    }
    setIsOtaUploading(true)
    setError(null)
    try {
      const fileName = `firmware_${Date.now()}.bin`
      const { error: uploadErr } = await supabase.storage
        .from('firmware')
        .upload(fileName, file, { contentType: 'application/octet-stream', upsert: true })

      if (uploadErr) {
        // Fallback to voice-notes bucket (which has open insert policy and no UUID prefix check)
        const { error: fallbackErr } = await supabase.storage
          .from('voice-notes')
          .upload(fileName, file, { contentType: 'application/octet-stream', upsert: true })
        if (fallbackErr) throw uploadErr
        const { data } = supabase.storage.from('voice-notes').getPublicUrl(fileName)
        setOtaUrl(data.publicUrl)
      } else {
        const { data } = supabase.storage.from('firmware').getPublicUrl(fileName)
        setOtaUrl(data.publicUrl)
      }
      setSuccess('Firmware uploaded successfully! Click "Send OTA Update" to flash.')
    } catch (err: any) {
      setError(err.message || 'Failed to upload firmware file')
    } finally {
      setIsOtaUploading(false)
    }
  }

  const handleSendOta = async () => {
    if (!device || !otaUrl.trim()) return
    setIsOtaSending(true)
    setError(null)
    setSuccess(null)
    try {
      const { error: cmdErr } = await supabase
        .from('command_queue')
        .insert({
          device_id: device.id,
          command: 'UPDATE_FIRMWARE',
          payload: { url: otaUrl.trim() },
          status: 'pending'
        })
      if (cmdErr) throw cmdErr
      setSuccess('OTA Update command queued! Device will update and reboot shortly.')
    } catch (err: any) {
      setError(err.message || 'Failed to queue OTA update command')
    } finally {
      setIsOtaSending(false)
    }
  }

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
    }
  }, [])

  // Fetch available profiles and pre-announcement sounds
  useEffect(() => {
    if (!isOpen || !schoolId) return

    const fetchData = async () => {
      // 1. Fetch School Profiles
      const { data: profileData } = await supabase
        .from('bell_profiles')
        .select('id, name, is_active, board_type')
        .eq('school_id', schoolId)
        .order('name')
      
      const filteredProfiles = (profileData || []).filter(p => {
        const devType = device?.board_type || 'ESP32-S3 N16R8'
        const profType = p.board_type || 'ESP32-S3 N16R8'
        return profType === devType
      })
      setProfiles(filteredProfiles as BellProfileOption[])

      // 2. Fetch Pre-Announcement Sounds (correct column: title)
      const { data: soundData } = await supabase
        .from('pre_announcement_sounds')
        .select('id, title, file_url')
        .eq('is_active', true)
        .order('created_at')
      setPaSounds(soundData || [])

      // 3. Fetch School's default pre-announcement sound & location details
      const { data: schoolRes } = await supabase
        .from('schools')
        .select('name, address, campus_name, city, default_pre_announcement_id')
        .eq('id', schoolId)
        .single()

      if (schoolRes) {
        setSchoolData(schoolRes)
        if (schoolRes.default_pre_announcement_id && soundData) {
          const def = soundData.find(s => s.id === schoolRes.default_pre_announcement_id)
          if (def) setSchoolDefaultSoundTitle(def.title)
        }
      }
    }

    fetchData()
  }, [isOpen, schoolId])

  useEffect(() => {
    if (device) {
      setVolume(device.volume ?? 21)
      setProfileId(device.profile_id || 'INHERIT')

      setChannelMode((device.channel_mode as 'unified' | 'dual_channel') || 'unified')
      setChannelLabelLeft(device.channel_label_left || 'Left Channel')
      setChannelLabelRight(device.channel_label_right || 'Right Channel')
      setVolumeLeft(device.volume_left ?? device.volume ?? 21)
      setVolumeRight(device.volume_right ?? device.volume ?? 21)
      setProfileIdLeft(device.profile_id_left || device.profile_id || 'INHERIT')
      setProfileIdRight(device.profile_id_right || device.profile_id || 'INHERIT')

      // Initialize location fields (prioritizing device, fallback to resolved hierarchy)
      const resolved = resolveDeviceLocation(device, schoolData)
      setLocationArea(device.location_area || resolved.area)
      setLocationCity(device.location_city || resolved.city)
      setLocationProvince(device.location_province || resolved.province)
      setLocationCountry(device.location_country || resolved.country)
      setLocationContinent(device.location_continent || resolved.continent)

      const hasCustomPa = 
        device.pre_announcement_enabled !== null || 
        device.pre_announcement_id !== null || 
        device.pre_announcement_delay_seconds !== null

      setUseCustomPa(!!hasCustomPa)
      setPaEnabled(device.pre_announcement_enabled ?? true)
      setPaSoundId(device.pre_announcement_id || '')
      setPaDelay(device.pre_announcement_delay_seconds ?? 3)
    }
  }, [device, schoolData])

  const handleAutoDetectLocation = () => {
    if (!device) return
    const resolved = resolveDeviceLocation(device, schoolData)
    setLocationArea(resolved.area)
    setLocationCity(resolved.city)
    setLocationProvince(resolved.province)
    setLocationCountry(resolved.country)
    setLocationContinent(resolved.continent)
    setSuccess(`Auto-resolved location: ${resolved.formatted}`)
    setTimeout(() => setSuccess(null), 4000)
  }

  if (!isOpen || !device) return null

  const handlePreviewSound = () => {
    if (isPlayingPreview) {
      previewAudioRef.current?.pause()
      setIsPlayingPreview(false)
      return
    }

    let urlToPlay = ''
    if (paSoundId) {
      const selected = paSounds.find(s => s.id === paSoundId)
      urlToPlay = selected?.file_url || ''
    } else if (paSounds.length > 0) {
      urlToPlay = paSounds[0].file_url
    }

    if (!urlToPlay) return

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
    }

    const audio = new Audio(urlToPlay)
    audio.onended = () => setIsPlayingPreview(false)
    audio.onerror = () => setIsPlayingPreview(false)
    audio.play().catch(() => setIsPlayingPreview(false))
    previewAudioRef.current = audio
    setIsPlayingPreview(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      setIsPlayingPreview(false)
    }

    try {
      if (!schoolId) throw new Error('No school ID found')

      const isMini = device.board_type === 'ESP32-C3 Mini'
      const targetProfileId = profileId === 'INHERIT' ? null : profileId
      const targetProfileLeft = profileIdLeft === 'INHERIT' ? null : profileIdLeft
      const targetProfileRight = profileIdRight === 'INHERIT' ? null : profileIdRight

      // Build updates object
      const effectiveVol = channelMode === 'dual_channel' ? volumeLeft : volume
      const updates = {
        volume: isMini ? null : effectiveVol,
        volume_left: isMini ? null : (channelMode === 'dual_channel' ? volumeLeft : volume),
        volume_right: isMini ? null : (channelMode === 'dual_channel' ? volumeRight : volume),
        channel_mode: isMini ? 'unified' : channelMode,
        profile_id: isMini ? targetProfileId : (channelMode === 'dual_channel' ? targetProfileLeft : targetProfileId),
        profile_id_left: isMini ? null : (channelMode === 'dual_channel' ? targetProfileLeft : targetProfileId),
        profile_id_right: isMini ? null : (channelMode === 'dual_channel' ? targetProfileRight : targetProfileId),
        channel_label_left: channelLabelLeft.trim() || 'Left Channel',
        channel_label_right: channelLabelRight.trim() || 'Right Channel',
        pre_announcement_enabled: isMini ? null : (useCustomPa ? paEnabled : null),
        pre_announcement_id: isMini ? null : (useCustomPa && paSoundId ? paSoundId : null),
        pre_announcement_delay_seconds: isMini ? null : (useCustomPa ? paDelay : null),
        location_area: locationArea.trim() || null,
        location_city: locationCity.trim() || null,
        location_province: locationProvince.trim() || null,
        location_country: locationCountry.trim() || null,
        location_continent: locationContinent.trim() || null,
      }

      // 1. Update bell_devices table
      const { error: dbError } = await supabase
        .from('bell_devices')
        .update(updates)
        .eq('id', device.id)

      if (dbError) throw dbError

      // 2. Send Command Queue entry to trigger config re-sync on device
      const commands = [
        ...(isMini ? [] : [{
          device_id: device.id,
          command: 'SET_VOLUME',
          payload: { 
            volume: updates.volume,
            channel: channelMode === 'dual_channel' ? 'both' : 'unified',
            volume_left: updates.volume_left,
            volume_right: updates.volume_right
          }
        }]),
        {
          device_id: device.id,
          command: 'SYNC_SCHEDULES',
          payload: { 
            source: 'device_settings_modal',
            channel_mode: channelMode,
            profile_id_left: updates.profile_id_left,
            profile_id_right: updates.profile_id_right
          }
        }
      ]

      const { error: cmdError } = await supabase.from('command_queue').insert(commands)
      if (cmdError) throw cmdError

      onUpdate()
      onClose()
    } catch (err) {
      console.error('Error saving device settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-card text-foreground p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Device Settings: {device.name}</h3>
            <p className="text-xs text-muted-foreground">Configure schedule profile, volume, and pre-announcement chimes.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Schedule & Volume Configuration */}
          {device.board_type === 'ESP32-C3 Mini' ? (
            /* Single Relay Schedule Profile for C3 Mini */
            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
              <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                Schedule Profile Assignment (Relay Bell)
              </h4>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Active Profile for this Relay Bell
                </label>
                <select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
                >
                  <option value="INHERIT">✨ Inherit School Active Profile (Default)</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      📋 {p.name} {p.is_active ? '(School Active)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Compact Mini controls a 5V relay output according to the chosen schedule profile.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Dual-Channel Audio Architecture for Standard AutoBell */}
              <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <Sliders className="h-4 w-4 text-primary" />
                    Audio Channels & Schedule Output (Left & Right)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AutoBell hardware provides dual stereo audio outputs to drive two separate physical speaker zones.
                  </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center rounded-lg bg-muted p-1 border border-border/60 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setChannelMode('unified')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      channelMode === 'unified'
                        ? 'bg-card text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Radio className="h-3.5 w-3.5" />
                    Unified Stereo
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelMode('dual_channel')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      channelMode === 'dual_channel'
                        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Split className="h-3.5 w-3.5" />
                    Dual Independent Zones
                  </button>
                </div>
              </div>

              {channelMode === 'unified' ? (
                /* Unified Stereo Mode */
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground border border-border/40 flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <b>Unified Stereo Mode:</b> Both Left and Right speaker outputs play the same schedule profile at the same master volume. Switch to <b>Dual Independent Zones</b> above if you want different bell schedules or volumes in different wings/floors.
                    </div>
                  </div>

                  {/* Unified Profile */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Schedule Profile (Both Left & Right Speakers)
                    </label>
                    <select
                      value={profileId}
                      onChange={(e) => setProfileId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
                    >
                      <option value="INHERIT">✨ Inherit School Active Profile (Default)</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>
                          📋 {p.name} {p.is_active ? '(School Active)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unified Volume */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-foreground flex justify-between">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-primary" />
                        Master Volume (Both Channels)
                      </span>
                      <span className="font-mono text-primary font-bold">
                        {volume} / 21 ({volume === 0 ? 'Muted' : volume <= 7 ? 'Low' : volume <= 15 ? 'Medium' : volume <= 20 ? 'High' : 'Maximum'})
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="21"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="h-2 w-full cursor-pointer rounded-lg appearance-none bg-primary/20 accent-primary"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>Mute (0)</span>
                      <span>Max (21)</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Independent Dual-Channel Mode */
                <div className="space-y-4">
                  <div className="rounded-lg bg-primary/10 p-3 text-xs text-primary border border-primary/20 flex items-start gap-2">
                    <Split className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <b>Independent Dual Channels Active:</b> Left and Right outputs will trigger bells at their own configured times and profiles. Connect Zone 1 (e.g. Primary Wing) to Left Output, and Zone 2 (e.g. Secondary Wing / Library) to Right Output!
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Channel 1: Left Output */}
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/[0.04] p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">L</span>
                          Left Channel (Output 1)
                        </span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Zone 1
                        </span>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                          Zone / Area Name
                        </label>
                        <input
                          type="text"
                          value={channelLabelLeft}
                          onChange={(e) => setChannelLabelLeft(e.target.value)}
                          placeholder="e.g. Primary Wing, Floor 1"
                          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                          Left Schedule Profile
                        </label>
                        <select
                          value={profileIdLeft}
                          onChange={(e) => setProfileIdLeft(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="INHERIT">✨ Inherit School Default</option>
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>
                              📋 {p.name} {p.is_active ? '(Active)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium text-muted-foreground">Left Volume</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {volumeLeft} / 21
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="21"
                          value={volumeLeft}
                          onChange={(e) => setVolumeLeft(parseInt(e.target.value))}
                          className="h-2 w-full cursor-pointer rounded-lg appearance-none bg-blue-500/20 accent-blue-600"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                          <span>0 (Mute)</span>
                          <span>{volumeLeft <= 7 ? 'Low' : volumeLeft <= 15 ? 'Medium' : 'Loud'}</span>
                          <span>21 (Max)</span>
                        </div>
                      </div>
                    </div>

                    {/* Channel 2: Right Output */}
                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.04] p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-black text-white">R</span>
                          Right Channel (Output 2)
                        </span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          Zone 2
                        </span>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                          Zone / Area Name
                        </label>
                        <input
                          type="text"
                          value={channelLabelRight}
                          onChange={(e) => setChannelLabelRight(e.target.value)}
                          placeholder="e.g. Secondary Wing, Floor 2"
                          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                          Right Schedule Profile
                        </label>
                        <select
                          value={profileIdRight}
                          onChange={(e) => setProfileIdRight(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-purple-500 focus:outline-none"
                        >
                          <option value="INHERIT">✨ Inherit School Default</option>
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>
                              📋 {p.name} {p.is_active ? '(Active)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium text-muted-foreground">Right Volume</span>
                          <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                            {volumeRight} / 21
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="21"
                          value={volumeRight}
                          onChange={(e) => setVolumeRight(parseInt(e.target.value))}
                          className="h-2 w-full cursor-pointer rounded-lg appearance-none bg-purple-500/20 accent-purple-600"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                          <span>0 (Mute)</span>
                          <span>{volumeRight <= 7 ? 'Low' : volumeRight <= 15 ? 'Medium' : 'Loud'}</span>
                          <span>21 (Max)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pre-Announcement Override Section */}
              <div className="space-y-4 rounded-lg border border-border/80 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
                    <BellRing className="h-4 w-4 text-primary" />
                    Pre-Announcement Chime
                  </h4>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomPa}
                      onChange={(e) => setUseCustomPa(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Custom Chime Override
                  </label>
                </div>

                {!useCustomPa ? (
                  <p className="text-xs text-muted-foreground italic">
                    Using global chime settings configured in <b>School Settings</b>.
                  </p>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Play Chime Before Bells & TTS</span>
                      <input
                        type="checkbox"
                        checked={paEnabled}
                        onChange={(e) => setPaEnabled(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                      />
                    </div>

                    {paEnabled && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Selected Chime Jingle
                          </label>
                          <div className="flex gap-2 items-center">
                            <select
                              value={paSoundId}
                              onChange={(e) => setPaSoundId(e.target.value)}
                              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
                            >
                              <option value="">
                                {schoolDefaultSoundTitle 
                                  ? `-- School Default (${schoolDefaultSoundTitle}) --` 
                                  : '-- School Default Sound --'}
                              </option>
                              {paSounds.map(s => (
                                <option key={s.id} value={s.id}>
                                  🎵 {s.title}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={handlePreviewSound}
                              className="p-2 rounded-md border border-input bg-background hover:bg-muted text-primary transition-colors focus:outline-none"
                              title="Preview chime sound"
                            >
                              {isPlayingPreview ? (
                                <Pause className="h-4 w-4 text-destructive" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Pre-Announcement Delay: {paDelay} second(s)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={paDelay}
                            onChange={(e) => setPaDelay(parseInt(e.target.value) || 3)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Device Geographic Location Hierarchy */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Geographic Location Hierarchy
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full place hierarchy: Area, City, Province, Country, Continent.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all self-start sm:self-auto shrink-0 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Auto-Detect from School
              </button>
            </div>

            {/* Location Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">Area / Neighborhood</label>
                <input
                  type="text"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="e.g. Saddar"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-muted-foreground font-medium mb-1">City</label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="e.g. Karachi"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-muted-foreground font-medium mb-1">Province / State</label>
                <input
                  type="text"
                  value={locationProvince}
                  onChange={(e) => setLocationProvince(e.target.value)}
                  placeholder="e.g. Sindh"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-muted-foreground font-medium mb-1">Country</label>
                <input
                  type="text"
                  value={locationCountry}
                  onChange={(e) => setLocationCountry(e.target.value)}
                  placeholder="e.g. Pakistan"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-muted-foreground font-medium mb-1">Continent</label>
                <input
                  type="text"
                  value={locationContinent}
                  onChange={(e) => setLocationContinent(e.target.value)}
                  placeholder="e.g. Asia"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Location Summary Preview */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <Navigation className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Resolved Place:</span>
              <span className="truncate font-medium">
                {[locationArea, locationCity, locationProvince, locationCountry, locationContinent]
                  .filter(Boolean)
                  .join(', ') || 'Not configured'}
              </span>
            </div>
          </div>

          {/* OTA Firmware Update Panel */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Cpu className="h-4 w-4" />
              <span className="text-sm font-semibold">OTA Firmware Update</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a <code>firmware.bin</code> file or paste a public URL to flash this device wirelessly over the air.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                accept=".bin"
                onChange={handleOtaFileUpload}
                className="hidden"
                id="device-modal-ota-input"
              />
              <label
                htmlFor="device-modal-ota-input"
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-accent shrink-0"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {isOtaUploading ? 'Uploading...' : 'Choose .bin File'}
              </label>
              <input
                type="text"
                placeholder="https://.../firmware.bin"
                value={otaUrl}
                onChange={(e) => setOtaUrl(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendOta}
                disabled={!otaUrl.trim() || isOtaSending || isOtaUploading}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0"
              >
                {isOtaSending ? 'Queuing...' : 'Send OTA Update'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Device Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
