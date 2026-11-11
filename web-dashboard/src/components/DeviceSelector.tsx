import { useMemo } from 'react'
import { CheckSquare, Square, Wifi, WifiOff, Volume2, Layers, Check } from 'lucide-react'

export type DeviceOption = {
  id: string
  name: string
  mac_address: string | null
  status: string | null
  last_heartbeat: string | null
  location_area?: string | null
  location_city?: string | null
  profile_id?: string | null
  profile_name?: string | null
  stream_volume?: number | null
  channel_mode?: 'unified' | 'dual_channel' | 'dual' | null
  channel_label_left?: string | null
  channel_label_right?: string | null
  volume_left?: number | null
  volume_right?: number | null
}

export type ZoneOption = {
  key: string
  deviceId: string
  channel: 'left' | 'right' | 'all'
  label: string
  icon: string
  color: 'blue' | 'purple' | 'emerald'
  volume?: number | null
}

const ONLINE_TIMEOUT_MS = 15 * 60 * 1000

export function isDeviceOnline(status: string | null, last_heartbeat: string | null): boolean {
  if (last_heartbeat) {
    const last = new Date(last_heartbeat).getTime()
    if (!Number.isNaN(last)) {
      return Date.now() - last <= ONLINE_TIMEOUT_MS
    }
  }
  return status === 'online'
}

export function getDeviceZones(device: DeviceOption): ZoneOption[] {
  const isDual = device.channel_mode === 'dual_channel' || device.channel_mode === 'dual'
  if (isDual) {
    return [
      {
        key: `${device.id}:left`,
        deviceId: device.id,
        channel: 'left',
        label: device.channel_label_left || 'Left Zone (Output 1)',
        icon: 'L',
        color: 'blue',
        volume: device.volume_left
      },
      {
        key: `${device.id}:right`,
        deviceId: device.id,
        channel: 'right',
        label: device.channel_label_right || 'Right Zone (Output 2)',
        icon: 'R',
        color: 'purple',
        volume: device.volume_right
      }
    ]
  }
  return [
    {
      key: `${device.id}:all`,
      deviceId: device.id,
      channel: 'all',
      label: 'Main Zone (Stereo / All Speakers)',
      icon: 'S',
      color: 'emerald',
      volume: device.stream_volume
    }
  ]
}

type DeviceSelectorProps = {
  devices: DeviceOption[]
  selectedZoneKeys: string[]
  onZoneKeysChange: (keys: string[]) => void
  // Optional legacy props for backwards compatibility
  selectedDeviceIds?: string[]
  onChange?: (selectedIds: string[]) => void
  isLoading?: boolean
}

export function DeviceSelector({
  devices,
  selectedZoneKeys,
  onZoneKeysChange,
  isLoading
}: DeviceSelectorProps) {
  // All possible zones across all devices
  const allZones = useMemo(() => {
    return devices.flatMap(getDeviceZones)
  }, [devices])

  const totalZonesCount = allZones.length
  const selectedZonesCount = allZones.filter(z => selectedZoneKeys.includes(z.key)).length
  const allSelected = totalZonesCount > 0 && selectedZonesCount === totalZonesCount

  // Online devices
  const onlineDevices = useMemo(() => {
    return devices.filter(d => isDeviceOnline(d.status, d.last_heartbeat))
  }, [devices])

  // Count devices with at least one zone selected
  const targetedDevicesCount = useMemo(() => {
    const activeDeviceIds = new Set(
      allZones.filter(z => selectedZoneKeys.includes(z.key)).map(z => z.deviceId)
    )
    return activeDeviceIds.size
  }, [allZones, selectedZoneKeys])

  // Select all zones across all devices
  const selectAll = () => {
    onZoneKeysChange(allZones.map(z => z.key))
  }

  // Clear all selections
  const clearAll = () => {
    onZoneKeysChange([])
  }

  // Toggle select all vs clear
  const toggleSelectAll = () => {
    if (allSelected) {
      clearAll()
    } else {
      selectAll()
    }
  }

  // Select all zones of online devices only
  const selectOnlineOnly = () => {
    const onlineKeys = onlineDevices.flatMap(d => getDeviceZones(d).map(z => z.key))
    onZoneKeysChange(onlineKeys)
  }

  // Select all Left zones across dual-channel devices
  const selectLeftOnly = () => {
    const leftKeys = allZones.filter(z => z.channel === 'left').map(z => z.key)
    onZoneKeysChange(leftKeys)
  }

  // Select all Right zones across dual-channel devices
  const selectRightOnly = () => {
    const rightKeys = allZones.filter(z => z.channel === 'right').map(z => z.key)
    onZoneKeysChange(rightKeys)
  }

  // Toggle a single zone
  const toggleZone = (zoneKey: string) => {
    if (selectedZoneKeys.includes(zoneKey)) {
      onZoneKeysChange(selectedZoneKeys.filter(k => k !== zoneKey))
    } else {
      onZoneKeysChange([...selectedZoneKeys, zoneKey])
    }
  }

  // Toggle all zones for a specific device
  const toggleDeviceAllZones = (device: DeviceOption) => {
    const deviceZoneKeys = getDeviceZones(device).map(z => z.key)
    const isAllDeviceZonesSelected = deviceZoneKeys.every(k => selectedZoneKeys.includes(k))

    if (isAllDeviceZonesSelected) {
      // Deselect all zones of this device
      onZoneKeysChange(selectedZoneKeys.filter(k => !deviceZoneKeys.includes(k)))
    } else {
      // Select all zones of this device
      const missingKeys = deviceZoneKeys.filter(k => !selectedZoneKeys.includes(k))
      onZoneKeysChange([...selectedZoneKeys, ...missingKeys])
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-28 bg-muted rounded-xl" />
          <div className="h-28 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
        No bell devices found registered to your school.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
      {/* Selector Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors focus:outline-none"
          >
            {allSelected ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : selectedZonesCount > 0 ? (
              <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-primary bg-primary/20 text-primary font-bold text-xs">
                -
              </div>
            ) : (
              <Square className="h-5 w-5 text-muted-foreground" />
            )}
            <span>Target Bells & Speaker Zones</span>
          </button>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {selectedZonesCount} of {totalZonesCount} zones active
          </span>
        </div>

        {/* Action Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
          >
            All Zones ({totalZonesCount})
          </button>
          <button
            type="button"
            onClick={selectOnlineOnly}
            className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 font-medium"
          >
            <Wifi className="h-3 w-3" />
            Online Only ({onlineDevices.length})
          </button>
          <button
            type="button"
            onClick={selectLeftOnly}
            className="rounded-md bg-blue-500/10 px-2.5 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1 font-medium"
          >
            <span className="font-bold">L</span> Left Zones Only
          </button>
          <button
            type="button"
            onClick={selectRightOnly}
            className="rounded-md bg-purple-500/10 px-2.5 py-1 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1 font-medium"
          >
            <span className="font-bold">R</span> Right Zones Only
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Bells List: Each Bell Shown Above, Its Zones Shown Beneath */}
      <div className="grid gap-4 grid-cols-1">
        {devices.map(device => {
          const zones = getDeviceZones(device)
          const deviceZoneKeys = zones.map(z => z.key)
          const selectedDeviceZoneKeys = deviceZoneKeys.filter(k => selectedZoneKeys.includes(k))
          const isAllDeviceZonesSelected = zones.length > 0 && selectedDeviceZoneKeys.length === zones.length
          const isAnyDeviceZoneSelected = selectedDeviceZoneKeys.length > 0
          const online = isDeviceOnline(device.status, device.last_heartbeat)
          const isDual = device.channel_mode === 'dual_channel' || device.channel_mode === 'dual'

          return (
            <div
              key={device.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isAnyDeviceZoneSelected
                  ? 'border-primary/50 bg-card shadow-sm'
                  : 'border-border/60 bg-card/60 opacity-90'
              }`}
            >
              {/* Bell Row (Above) */}
              <div
                onClick={() => toggleDeviceAllZones(device)}
                className="flex cursor-pointer items-center justify-between p-3.5 bg-card hover:bg-accent/30 transition-colors border-b border-border/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-primary shrink-0">
                    {isAllDeviceZonesSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : isAnyDeviceZoneSelected ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-primary bg-primary/20 text-primary font-bold text-xs">
                        -
                      </div>
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground text-sm truncate">
                        {device.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          online
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {online ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                        {online ? 'Online' : 'Offline'}
                      </span>
                      {isDual ? (
                        <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          Dual Zones (PCM5102a)
                        </span>
                      ) : (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Unified Stereo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
                      {device.location_area && <span>📍 {device.location_area}</span>}
                      {device.mac_address && <span className="font-mono text-[11px]">({device.mac_address})</span>}
                    </div>
                  </div>
                </div>

                {/* Bell Status & Zone Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  {isAnyDeviceZoneSelected ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                      {isAllDeviceZonesSelected
                        ? 'All Zones Active'
                        : `${selectedDeviceZoneKeys.length} of ${zones.length} Zone Selected`}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 italic">
                      Click to Select All Zones
                    </span>
                  )}
                </div>
              </div>

              {/* Zones Container (Beneath the Bell) */}
              <div className="p-3 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-1">
                  <span className="flex items-center gap-1 uppercase tracking-wider font-bold">
                    <Layers className="h-3 w-3 text-primary" />
                    Speaker Zones for {device.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Click any zone to target or mute independently
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {zones.map(zone => {
                    const isZoneSelected = selectedZoneKeys.includes(zone.key)
                    const isLeft = zone.channel === 'left'
                    const isRight = zone.channel === 'right'

                    return (
                      <div
                        key={zone.key}
                        onClick={e => {
                          e.stopPropagation()
                          toggleZone(zone.key)
                        }}
                        className={`flex cursor-pointer items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                          isZoneSelected
                            ? isLeft
                              ? 'border-blue-500/60 bg-blue-500/10 text-blue-900 dark:text-blue-100 shadow-xs'
                              : isRight
                              ? 'border-purple-500/60 bg-purple-500/10 text-purple-900 dark:text-purple-100 shadow-xs'
                              : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 shadow-xs'
                            : 'border-border/60 bg-background/50 hover:bg-muted/40 text-muted-foreground opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="shrink-0 text-primary">
                            {isZoneSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white shadow-xs ${
                              isLeft
                                ? 'bg-blue-600'
                                : isRight
                                ? 'bg-purple-600'
                                : 'bg-emerald-600'
                            }`}
                          >
                            {zone.icon}
                          </span>

                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground block truncate">
                              {zone.label}
                            </span>
                            {zone.volume !== undefined && zone.volume !== null && (
                              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                                <Volume2 className="h-2.5 w-2.5" /> Vol: {zone.volume}/21
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wider uppercase shrink-0 ${
                            isZoneSelected
                              ? isLeft
                                ? 'bg-blue-600 text-white'
                                : isRight
                                ? 'bg-purple-600 text-white'
                                : 'bg-emerald-600 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isZoneSelected ? 'BROADCAST' : 'MUTED'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Target Status Banner */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-3.5 py-2.5 flex items-center justify-between text-xs">
        <span className="text-foreground font-medium flex items-center gap-1.5">
          <Check className="h-4 w-4 text-primary" />
          <span>
            Broadcast will play across{' '}
            <strong className="text-primary font-bold">{selectedZonesCount} speaker zone{selectedZonesCount !== 1 ? 's' : ''}</strong>{' '}
            on <strong className="text-foreground font-bold">{targetedDevicesCount} bell{targetedDevicesCount !== 1 ? 's' : ''}</strong>.
          </span>
        </span>
        {selectedZonesCount === 0 && (
          <span className="text-destructive font-semibold text-[11px]">
            ⚠️ No zones selected! Select at least one zone to broadcast.
          </span>
        )}
      </div>
    </div>
  )
}
