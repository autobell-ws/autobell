import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase, supabaseUrl } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Building, MapPin, Check, Image as ImageIcon, Volume2, Play, Square, Music, Plus, Loader2, X, Trash2, AlertTriangle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { DeleteSchoolModal } from '@/components/DeleteSchoolModal'
import { themes } from '@/lib/themes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { useRef } from 'react'

const settingsSchema = z.object({
  name: z.string().min(2, 'School name is required'),
  campusName: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  themeColor: z.string(),
  themeMode: z.enum(['dark', 'light', 'grey']),
  quietHoursEnabled: z.boolean(),
  quietHoursDisableFrom: z.string(),
  quietHoursEnableAt: z.string(),
  preAnnouncementEnabled: z.boolean(),
  defaultPreAnnouncementId: z.string().nullable().optional(),
  preAnnouncementDelaySeconds: z.number().min(2).max(5),
  preAnnouncementVolume: z.number().min(1).max(5),
  defaultTtsGender: z.enum(['female', 'male']),
  defaultTtsLanguage: z.enum(['en', 'ur', 'ar']),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SchoolSettings() {
  const { schoolId, role } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [playingPreId, setPlayingPreId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const preAudioRef = useRef<HTMLAudioElement | null>(null)
  const canEdit = role === 'admin'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      campusName: '',
      address: '',
      themeColor: 'slate',
      themeMode: 'dark',
      quietHoursEnabled: false,
      quietHoursDisableFrom: '21:00',
      quietHoursEnableAt: '07:00',
      preAnnouncementEnabled: true,
      defaultPreAnnouncementId: null,
      preAnnouncementDelaySeconds: 3,
      preAnnouncementVolume: 3,
      defaultTtsGender: 'female',
      defaultTtsLanguage: 'en',
    }
  })

  const quietHoursEnabled = watch('quietHoursEnabled')
  const preAnnouncementEnabled = watch('preAnnouncementEnabled')
  const defaultPreAnnouncementId = watch('defaultPreAnnouncementId')
  const preAnnouncementDelaySeconds = watch('preAnnouncementDelaySeconds')
  const preAnnouncementVolume = watch('preAnnouncementVolume')
  const themeColor = watch('themeColor')
  const themeMode = watch('themeMode')

  // Fetch School Data
  const { data: school, isLoading } = useQuery({
    queryKey: ['school_settings', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, campus_name, address, logo_url, theme_color, theme_mode, quiet_hours_enabled, quiet_hours_disable_from, quiet_hours_enable_at, pre_announcement_enabled, default_pre_announcement_id, pre_announcement_delay_seconds, pre_announcement_volume, default_tts_gender, default_tts_language')
        .eq('id', schoolId)
        .single()
      
      if (error) throw error
      return data
    }
  })

  // Fetch available pre-announcement sounds
  const { data: preAnnouncementSounds = [] } = useQuery({
    queryKey: ['pre_announcement_sounds_active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_announcement_sounds')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    }
  })

  const [showUploadChimeModal, setShowUploadChimeModal] = useState(false)
  const [newChimeTitle, setNewChimeTitle] = useState('')
  const [newChimeFile, setNewChimeFile] = useState<File | null>(null)
  const [isUploadingChime, setIsUploadingChime] = useState(false)

  const togglePrePlay = (soundUrl: string, soundId: string) => {
    if (playingPreId === soundId) {
      preAudioRef.current?.pause()
      setPlayingPreId(null)
    } else {
      if (preAudioRef.current) {
        preAudioRef.current.pause()
      }
      const fullUrl = soundUrl.startsWith('/storage/') 
        ? `${supabaseUrl}${soundUrl}` 
        : soundUrl

      const audio = new Audio(fullUrl)
      audio.onended = () => setPlayingPreId(null)
      audio.play().catch(e => {
        console.error('Audio play error:', e)
        setPlayingPreId(null)
      })
      preAudioRef.current = audio
      setPlayingPreId(soundId)
    }
  }

  const handleUploadChimeInSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChimeFile) {
      toast.error('Please select an MP3 chime file')
      return
    }
    if (!newChimeTitle.trim()) {
      toast.error('Please enter a chime title')
      return
    }

    try {
      setIsUploadingChime(true)
      const fileExt = newChimeFile.name.split('.').pop() || 'mp3'
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `library/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('pre-announcements')
        .upload(filePath, newChimeFile, { contentType: newChimeFile.type || 'audio/mpeg', upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('pre-announcements')
        .getPublicUrl(filePath)

      const fileUrl = publicUrlData.publicUrl

      let durationMs = 3000
      try {
        const audioObj = new Audio(URL.createObjectURL(newChimeFile))
        await new Promise((resolve) => {
          audioObj.onloadedmetadata = () => {
            durationMs = Math.round(audioObj.duration * 1000)
            resolve(true)
          }
          audioObj.onerror = () => resolve(false)
        })
      } catch {
        // ignore
      }

      const { data: createdChime, error: rpcError } = await supabase.rpc('manage_pre_announcement_sound', {
        p_action: 'ADD',
        p_title: newChimeTitle.trim(),
        p_file_url: fileUrl,
        p_file_path: filePath,
        p_duration_ms: durationMs
      })

      if (rpcError) throw rpcError

      const createdId = createdChime?.id || (createdChime as any)?.[0]?.id
      queryClient.invalidateQueries({ queryKey: ['pre_announcement_sounds_active'] })
      queryClient.invalidateQueries({ queryKey: ['pre_announcement_sounds_all'] })

      if (createdId) {
        setValue('defaultPreAnnouncementId', createdId, { shouldDirty: true })
      }

      toast.success('Chime uploaded and selected as default!')
      setShowUploadChimeModal(false)
      setNewChimeTitle('')
      setNewChimeFile(null)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Failed to upload chime')
    } finally {
      setIsUploadingChime(false)
    }
  }

  useEffect(() => {
    if (school) {
      reset({
        name: school.name || '',
        campusName: school.campus_name || '',
        address: school.address || '',
        themeColor: school.theme_color || 'slate',
        themeMode: (school.theme_mode as 'dark' | 'light' | 'grey') || 'dark',
        quietHoursEnabled: !!school.quiet_hours_enabled,
        quietHoursDisableFrom: (school.quiet_hours_disable_from || '21:00').slice(0, 5),
        quietHoursEnableAt: (school.quiet_hours_enable_at || '07:00').slice(0, 5),
        preAnnouncementEnabled: school.pre_announcement_enabled ?? true,
        defaultPreAnnouncementId: school.default_pre_announcement_id || null,
        preAnnouncementDelaySeconds: school.pre_announcement_delay_seconds || 3,
        preAnnouncementVolume: school.pre_announcement_volume || 3,
        defaultTtsGender: (school.default_tts_gender as 'female' | 'male') || 'female',
        defaultTtsLanguage: (school.default_tts_language as 'en' | 'ur' | 'ar') || 'en',
      })
      setLogoUrl(school.logo_url)
    }
  }, [school, reset])

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      if (!schoolId || !canEdit) return

      const updates = {
        name: data.name,
        campus_name: data.campusName,
        address: data.address,
        theme_color: data.themeColor,
        theme_mode: data.themeMode,
        quiet_hours_enabled: data.quietHoursEnabled,
        quiet_hours_disable_from: data.quietHoursDisableFrom || null,
        quiet_hours_enable_at: data.quietHoursEnableAt || null,
        pre_announcement_enabled: data.preAnnouncementEnabled,
        default_pre_announcement_id: data.defaultPreAnnouncementId || null,
        pre_announcement_delay_seconds: data.preAnnouncementDelaySeconds,
        pre_announcement_volume: data.preAnnouncementVolume,
        default_tts_gender: data.defaultTtsGender,
        default_tts_language: data.defaultTtsLanguage,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', schoolId)

      if (error) throw error

      try {
        await supabase.functions.invoke('precombine-schedule', { body: { school_id: schoolId } })
      } catch (err) {
        console.warn('Precombine trigger error:', err)
      }

      const { data: devices } = await supabase.from('bell_devices').select('id').eq('school_id', schoolId)
      if (devices && devices.length > 0) {
        const commands = devices.map(d => ({
          device_id: d.id,
          command: 'SYNC_SCHEDULES',
          payload: { source: 'school_settings_save' }
        }))
        await supabase.from('command_queue').insert(commands)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_settings', schoolId] })
      queryClient.invalidateQueries({ queryKey: ['school_name', schoolId] })
      queryClient.invalidateQueries({ queryKey: ['school_theme', schoolId] })
      if (canEdit) {
        toast.success('School settings updated successfully!')
      }
      reset({}, { keepValues: true }) // Reset isDirty
    },
    onError: (error) => {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings.')
    }
  })

  const onSubmit = (data: SettingsFormValues) => {
    updateMutation.mutate(data)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !canEdit) return
    const file = acceptedFiles[0]
    
    const toastId = toast.loading('Uploading logo...')
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${schoolId}/logo.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('school-branding')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('school-branding')
        .getPublicUrl(fileName)

      const newUrl = `${data.publicUrl}?t=${new Date().getTime()}`
      setLogoUrl(newUrl)
      
      // Update logo_url in db
      await supabase.from('schools').update({ logo_url: newUrl }).eq('id', schoolId)

      toast.success('Logo updated successfully!', { id: toastId })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Failed to upload logo.', { id: toastId })
    } finally {
      setUploading(false)
    }
  }, [schoolId, canEdit])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
    maxFiles: 1,
    disabled: !canEdit || uploading
  })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-foreground">School Branding</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your school's identity. This information will be displayed on the Web Dashboard and Mobile App.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="px-4 py-5 bg-card space-y-6 sm:p-6">
              
              {/* Logo Upload - React Dropzone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">School Logo</label>
                <div 
                  {...getRootProps()} 
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-50/10' : 'border-input hover:border-blue-400 bg-background'}`}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-1 text-center flex flex-col items-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="mx-auto h-24 w-24 rounded-full object-contain bg-muted border mb-4" />
                    ) : (
                      <div className="mx-auto h-12 w-12 text-muted-foreground mb-2"><ImageIcon className="h-12 w-12" /></div>
                    )}
                    <div className="flex text-sm text-muted-foreground">
                      <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        {uploading ? 'Uploading...' : 'Upload a file'}
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
                  </div>
                </div>
              </div>

              {/* School Name */}
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">School Name</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      <Building className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      {...register('name')}
                      className={`focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-input bg-background text-foreground p-2 border ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Lincoln High School"
                      disabled={!canEdit}
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="campusName" className="block text-sm font-medium text-foreground">Campus Name</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      <Building className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      {...register('campusName')}
                      className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-input bg-background text-foreground p-2 border"
                      placeholder="Main Campus"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-foreground">Address</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                   <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      <MapPin className="h-4 w-4" />
                    </span>
                  <input
                    {...register('address')}
                    className={`focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-input bg-background text-foreground p-2 border ${errors.address ? 'border-red-500' : ''}`}
                    placeholder="123 Main St, Springfield"
                    disabled={!canEdit}
                  />
                </div>
                {errors.address ? (
                  <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">This will be displayed as the branch or location name.</p>
                )}
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground">Theme Mode</label>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-md">
                  {['dark', 'light', 'grey'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setValue('themeMode', mode as any, { shouldDirty: true })}
                      disabled={!canEdit}
                      className={`rounded-lg border px-4 py-3 text-left text-sm font-medium shadow-sm disabled:opacity-50 capitalize ${
                        themeMode === mode
                          ? 'border-blue-600 bg-blue-50/10 text-blue-500'
                          : 'border-input bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-foreground mt-6">Theme Color</label>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                  {themes.map((theme) => (
                    <div
                      key={theme.name}
                      onClick={() => {
                        if (canEdit) setValue('themeColor', theme.name, { shouldDirty: true })
                      }}
                      className={`
                        relative flex cursor-pointer items-center justify-center rounded-lg border p-4 shadow-sm hover:border-ring focus:outline-none transition-all
                        ${themeColor === theme.name ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/10' : 'bg-background border-input'}
                        ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`h-8 w-8 rounded-full ${theme.activeColor} shadow-sm border border-black/10`} />
                        <span className="text-xs font-medium text-foreground">{theme.label}</span>
                      </div>
                      {themeColor === theme.name && (
                        <div className="absolute top-1 right-1">
                          <Check className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground">Quiet Hours</h4>
                <p className="mt-1 text-sm text-muted-foreground mb-4">
                  During quiet hours no sound will be played (bell MP3, broadcasts, TTS, voice notes, and tests).
                </p>

                <div className="space-y-4 max-w-md">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('quietHoursEnabled')}
                      className="h-4 w-4 rounded border-input text-blue-600 focus:ring-blue-500 bg-background"
                      disabled={!canEdit}
                    />
                    Enable quiet hours
                  </label>

                  {quietHoursEnabled && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground">Disable from</label>
                        <input
                          type="time"
                          {...register('quietHoursDisableFrom')}
                          className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          disabled={!canEdit}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">Enable at</label>
                        <input
                          type="time"
                          {...register('quietHoursEnableAt')}
                          className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-Announcement Audio & Delay */}
              <div className="pt-6 border-t border-border space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-blue-500" />
                    Pre-Announcement Audio & Delay Configuration
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Automatically plays a chime jingle before scheduled bells, TTS, and broadcasts. (In <i>Profile Editor</i>, set <b>Audio 1</b> directly to your period bell MP3 to avoid duplicate chimes).
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('preAnnouncementEnabled')}
                      className="h-4 w-4 rounded border-input text-blue-600 focus:ring-blue-500 bg-background"
                      disabled={!canEdit}
                    />
                    Enable Pre-Announcement Chimes
                  </label>

                  {preAnnouncementEnabled && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                      {/* Default Sound Selector Grid */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                          <label className="block text-sm font-medium text-foreground">Default Pre-Announcement Sound</label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setShowUploadChimeModal(true)}
                              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Upload Custom Chime
                            </button>
                            <Link
                              to="/dashboard/audio"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                            >
                              Audio Manager →
                            </Link>
                          </div>
                        </div>

                        {preAnnouncementSounds.length === 0 ? (
                          <div className="p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
                            No pre-announcement sounds uploaded yet. Click "Upload Custom Chime" above to add your school's signature chime.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {preAnnouncementSounds.map((snd) => {
                              const isSelected = defaultPreAnnouncementId === snd.id
                              const isPlaying = playingPreId === snd.id
                              return (
                                <div
                                  key={snd.id}
                                  onClick={() => {
                                    if (canEdit) setValue('defaultPreAnnouncementId', snd.id, { shouldDirty: true })
                                  }}
                                  className={`relative flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500' 
                                      : 'bg-background border-input hover:border-muted-foreground/40'
                                  } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Music className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                      <span className="text-sm font-semibold text-foreground line-clamp-1">{snd.title}</span>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                                  </div>

                                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                                    <span>{snd.duration_ms ? `${Math.round(snd.duration_ms/1000)}s` : 'Chime'}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        togglePrePlay(snd.file_url, snd.id)
                                      }}
                                      className="inline-flex items-center gap-1 text-blue-500 hover:underline font-medium"
                                    >
                                      {isPlaying ? (
                                        <>
                                          <Square className="h-3 w-3 fill-current" />
                                          Stop
                                        </>
                                      ) : (
                                        <>
                                          <Play className="h-3 w-3 fill-current" />
                                          Preview
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Delay Duration Selector (2 to 5 seconds) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Delay Duration (Between Chime & Audio Payload)
                          </label>
                          <select
                            value={preAnnouncementDelaySeconds}
                            onChange={(e) => {
                              if (canEdit) setValue('preAnnouncementDelaySeconds', parseInt(e.target.value), { shouldDirty: true })
                            }}
                            disabled={!canEdit}
                            className="w-full rounded-md border border-input bg-background text-foreground text-sm p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value={2}>2 Seconds</option>
                            <option value={3}>3 Seconds (Default)</option>
                            <option value={4}>4 Seconds</option>
                            <option value={5}>5 Seconds</option>
                          </select>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Pause interval before the primary bell or broadcast begins playing.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Pre-Announcement Volume Level (1 - 5)
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((level) => {
                              const isSelected = preAnnouncementVolume === level
                              return (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => {
                                    if (canEdit) setValue('preAnnouncementVolume', level, { shouldDirty: true })
                                  }}
                                  disabled={!canEdit}
                                  className={`flex-1 py-1.5 px-2 rounded-md border text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                      : 'bg-background border-input text-foreground hover:bg-muted/50'
                                  } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  L{level}
                                </button>
                              )
                            })}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {preAnnouncementVolume === 1 && 'Level 1: Quietest chime volume'}
                            {preAnnouncementVolume === 2 && 'Level 2: Soft chime volume'}
                            {preAnnouncementVolume === 3 && 'Level 3: Normal default chime volume'}
                            {preAnnouncementVolume === 4 && 'Level 4: Loud chime volume'}
                            {preAnnouncementVolume === 5 && 'Level 5: Maximum chime volume'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Default TTS Voice Configuration */}
              <div className="pt-6 border-t border-border space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-blue-500" />
                    Default TTS Voice Configuration
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Configure the default voice gender used for scheduled announcements (TTS).
                  </p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Default Voice Gender</label>
                    <div className="flex items-center gap-6">
                      <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="radio"
                          value="female"
                          {...register('defaultTtsGender')}
                          disabled={!canEdit}
                          className="h-4 w-4 border-input text-blue-600 focus:ring-blue-500 bg-background"
                        />
                        Female Voice (Google Translate)
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="radio"
                          value="male"
                          {...register('defaultTtsGender')}
                          disabled={!canEdit}
                          className="h-4 w-4 border-input text-blue-600 focus:ring-blue-500 bg-background"
                        />
                        Male Voice (StreamElements - Brian)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Default TTS Language</label>
                    <select
                      {...register('defaultTtsLanguage')}
                      disabled={!canEdit}
                      className="w-full rounded-md border border-input bg-background text-foreground text-sm p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="ur">Urdu (اردو)</option>
                      <option value="ar">Arabic (العربية)</option>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This language will be used for all scheduled announcements unless overridden per time slot.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Preferences Section */}
              <div className="pt-6 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                      Notification Preferences & Webhook Channels
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Customize how you receive real-time updates and audio event alerts.
                    </p>
                  </div>
                  <span className="text-xs bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full font-medium border border-sky-500/20">
                    Super Admin Controlled
                  </span>
                </div>

                <NotificationPreferencesCard schoolId={schoolId} />
              </div>

            </div>
            <div className="px-4 py-3 bg-muted text-right sm:px-6 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isDirty ? 'You have unsaved changes.' : ''}
              </span>
              <button
                type="submit"
                disabled={!canEdit || updateMutation.isPending || uploading || !isDirty}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete School (Super Admin / School Admin) */}
      {(role === 'super_admin' || role === 'admin') && school && (
        <div className="mt-8 pt-6 border-t border-destructive/20">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Irreversible actions for this school campus and all associated configurations.
                </p>
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-destructive">Delete School Campus</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permanently delete <strong className="text-foreground">{school.name}</strong>, including all scheduled bells, timetable profiles, audio bell files, and broadcast rules. To prevent accidental data loss, this action requires passing a 2-prompt safety verification.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-destructive hover:bg-destructive/90 transition-all shadow-sm shadow-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete School ({school.name})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadChimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Upload Custom Chime</h3>
                  <p className="text-xs text-muted-foreground">Add to library and auto-select as default chime</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadChimeModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Chime Title / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Campus Chime"
                  value={newChimeTitle}
                  onChange={(e) => setNewChimeTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  MP3 Audio File *
                </label>
                <input
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/wav,.mp3,.wav"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setNewChimeFile(f)
                      if (!newChimeTitle) {
                        setNewChimeTitle(f.name.replace(/\.[^/.]+$/, ''))
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUploadChimeModal(false)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadChimeInSettings}
                  disabled={isUploadingChime || !newChimeFile || !newChimeTitle.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isUploadingChime && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isUploadingChime ? 'Uploading...' : 'Upload & Select'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete School Multi-Prompt Confirmation Modal */}
      <DeleteSchoolModal
        isOpen={showDeleteModal}
        school={school ? { id: school.id, name: school.name, campus_name: school.campus_name } : null}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={(deletedName) => {
          toast.success(`School "${deletedName}" was successfully deleted.`)
          navigate(role === 'super_admin' ? '/super-admin/schools' : '/dashboard')
        }}
      />
    </form>
  )
}

function NotificationPreferencesCard({ schoolId }: { schoolId: string | null }) {
  const { user } = useAuth()
  const [pref, setPref] = useState({
    toast_enabled: true,
    sound_enabled: true,
    bell_dropdown_enabled: true,
    email_summary_enabled: false,
    notify_tts: true,
    notify_voice_note: true,
    notify_stream: true,
    notify_ring: true,
    notify_volume: true,
    school_webhook_url: ''
  })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetchPref = async () => {
      try {
        const { data } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (data) {
          setPref({
            toast_enabled: data.toast_enabled ?? true,
            sound_enabled: data.sound_enabled ?? true,
            bell_dropdown_enabled: data.bell_dropdown_enabled ?? true,
            email_summary_enabled: data.email_summary_enabled ?? false,
            notify_tts: data.notify_tts ?? true,
            notify_voice_note: data.notify_voice_note ?? true,
            notify_stream: data.notify_stream ?? true,
            notify_ring: data.notify_ring ?? true,
            notify_volume: data.notify_volume ?? true,
            school_webhook_url: data.school_webhook_url || ''
          })
        }
      } catch (err) {
        console.error('Failed to load user preferences:', err)
      } finally {
        setLoaded(true)
      }
    }
    fetchPref()
  }, [user])

  const handleSavePref = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert(
          {
            user_id: user.id,
            school_id: schoolId,
            ...pref,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error
      toast.success('Notification preferences updated successfully!')
    } catch (err: any) {
      toast.error('Failed to save notification preferences: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <div className="text-xs text-muted-foreground py-2">Loading preferences...</div>

  return (
    <div className="space-y-4 rounded-lg bg-background p-4 border border-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <label className="flex items-center gap-2 p-2.5 rounded bg-muted/40 border border-border/40 cursor-pointer">
          <input
            type="checkbox"
            checked={pref.toast_enabled}
            onChange={(e) => setPref({ ...pref, toast_enabled: e.target.checked })}
            className="rounded border-input text-blue-600 focus:ring-blue-500 accent-blue-600"
          />
          <div>
            <p className="font-semibold text-foreground">In-App Floating Toasts</p>
            <p className="text-[11px] text-muted-foreground">Display instant popups for command events</p>
          </div>
        </label>

        <label className="flex items-center gap-2 p-2.5 rounded bg-muted/40 border border-border/40 cursor-pointer">
          <input
            type="checkbox"
            checked={pref.sound_enabled}
            onChange={(e) => setPref({ ...pref, sound_enabled: e.target.checked })}
            className="rounded border-input text-blue-600 focus:ring-blue-500 accent-blue-600"
          />
          <div>
            <p className="font-semibold text-foreground">Notification Sound Chime</p>
            <p className="text-[11px] text-muted-foreground">Play gentle audio tone on arrival</p>
          </div>
        </label>

        <label className="flex items-center gap-2 p-2.5 rounded bg-muted/40 border border-border/40 cursor-pointer">
          <input
            type="checkbox"
            checked={pref.notify_tts}
            onChange={(e) => setPref({ ...pref, notify_tts: e.target.checked })}
            className="rounded border-input text-blue-600 focus:ring-blue-500 accent-blue-600"
          />
          <div>
            <p className="font-semibold text-foreground">TTS Announcement Alerts</p>
            <p className="text-[11px] text-muted-foreground">Queued & Executed status notifications</p>
          </div>
        </label>

        <label className="flex items-center gap-2 p-2.5 rounded bg-muted/40 border border-border/40 cursor-pointer">
          <input
            type="checkbox"
            checked={pref.notify_voice_note}
            onChange={(e) => setPref({ ...pref, notify_voice_note: e.target.checked })}
            className="rounded border-input text-blue-600 focus:ring-blue-500 accent-blue-600"
          />
          <div>
            <p className="font-semibold text-foreground">Voice Note Broadcast Alerts</p>
            <p className="text-[11px] text-muted-foreground">Audio recording execution feedback</p>
          </div>
        </label>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-medium text-foreground mb-1">School Channel Webhook URL (Slack / Teams)</label>
        <input
          type="url"
          placeholder="https://hooks.slack.com/services/..."
          value={pref.school_webhook_url}
          onChange={(e) => setPref({ ...pref, school_webhook_url: e.target.value })}
          className="w-full rounded-md border border-input bg-background text-foreground text-xs p-2 font-mono"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Receive automated campus audio events directly in your school staff chat channel.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <span className="text-[11px] text-amber-500 font-medium">
          🛡️ Emergency Stop & Device Offline alerts are enforced by Super Admin.
        </span>
        <button
          type="button"
          onClick={handleSavePref}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
