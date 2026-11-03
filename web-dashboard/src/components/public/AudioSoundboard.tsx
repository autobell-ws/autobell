import { useState, useRef, useEffect } from 'react'
import { Volume2, Play, Square, Bell, Sparkles, AlertOctagon, Radio } from 'lucide-react'

interface ChimeTrack {
  id: string
  title: string
  subtitle: string
  category: string
  duration: string
  icon: typeof Bell
  color: string
  soundUrl?: string
  synthType?: 'westminster' | 'marimba' | 'preannouncement' | 'siren'
}

const TRACKS: ChimeTrack[] = [
  {
    id: 'westminster',
    title: 'Classic Westminster Chime',
    subtitle: 'Timeless British four-note bell progression for period changes',
    category: 'Period Transition',
    duration: '0:06',
    icon: Bell,
    color: 'from-blue-500 to-indigo-600',
    soundUrl: '/sounds/chime1.mp3',
    synthType: 'westminster',
  },
  {
    id: 'marimba',
    title: 'Soft Acoustic Marimba',
    subtitle: 'Gentle, modern acoustic chime for preschool & primary classes',
    category: 'Gentle Chime',
    duration: '0:05',
    icon: Sparkles,
    color: 'from-teal-500 to-cyan-600',
    soundUrl: '/sounds/chime2.mp3',
    synthType: 'marimba',
  },
  {
    id: 'preannouncement',
    title: 'Pre-Chime + Voice Notice',
    subtitle: 'Alert tone with 3-second auto-pause before live announcement',
    category: 'PA Broadcast',
    duration: '0:08',
    icon: Radio,
    color: 'from-amber-500 to-orange-600',
    soundUrl: '/sounds/pre_announcement.mp3',
    synthType: 'preannouncement',
  },
  {
    id: 'emergency',
    title: 'Emergency Evacuation Siren',
    subtitle: 'High-pitch oscillating siren for lockdown & fire safety drill',
    category: 'Campus Safety',
    duration: '0:07',
    icon: AlertOctagon,
    color: 'from-rose-500 to-red-600',
    soundUrl: '/sounds/bell_start.mp3',
    synthType: 'siren',
  },
]

export function AudioSoundboard() {
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const activeOscillatorsRef = useRef<OscillatorNode[]>([])

  useEffect(() => {
    return () => {
      stopAllAudio()
    }
  }, [])

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    // Stop any synth oscillators
    activeOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        // ignore
      }
    })
    activeOscillatorsRef.current = []
    setIsPlaying(false)
    setActiveTrack(null)
  }

  // Web Audio API Synthesizer Fallback for crystal clear tones
  const playSynthesizerFallback = (type: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime)
      masterGain.connect(ctx.destination)

      const now = ctx.currentTime

      if (type === 'westminster') {
        // Notes: G#4, F#4, E4, B3
        const notes = [415.3, 369.99, 329.63, 246.94]
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + idx * 0.8)

          gain.gain.setValueAtTime(0, now + idx * 0.8)
          gain.gain.linearRampToValueAtTime(0.8, now + idx * 0.8 + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.8 + 1.2)

          osc.connect(gain)
          gain.connect(masterGain)

          osc.start(now + idx * 0.8)
          osc.stop(now + idx * 0.8 + 1.3)
          activeOscillatorsRef.current.push(osc)
        })

        setTimeout(() => {
          setIsPlaying(false)
          setActiveTrack(null)
        }, 4500)
      } else if (type === 'siren') {
        // Oscillating emergency siren
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        gain.gain.setValueAtTime(0.3 * volume, now)

        // Frequency sweep
        for (let i = 0; i < 6; i++) {
          osc.frequency.setValueAtTime(500, now + i * 0.8)
          osc.frequency.linearRampToValueAtTime(1100, now + i * 0.8 + 0.4)
          osc.frequency.linearRampToValueAtTime(500, now + i * 0.8 + 0.8)
        }

        osc.connect(gain)
        gain.connect(masterGain)
        osc.start(now)
        osc.stop(now + 4.8)
        activeOscillatorsRef.current.push(osc)

        setTimeout(() => {
          setIsPlaying(false)
          setActiveTrack(null)
        }, 5000)
      } else {
        // Marimba / Preannouncement chord
        const chord = [523.25, 659.25, 783.99, 1046.5]
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, now + idx * 0.15)

          gain.gain.setValueAtTime(0, now + idx * 0.15)
          gain.gain.linearRampToValueAtTime(0.6, now + idx * 0.15 + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 1.0)

          osc.connect(gain)
          gain.connect(masterGain)

          osc.start(now + idx * 0.15)
          osc.stop(now + idx * 0.15 + 1.1)
          activeOscillatorsRef.current.push(osc)
        })

        setTimeout(() => {
          setIsPlaying(false)
          setActiveTrack(null)
        }, 2500)
      }
    } catch (err) {
      console.warn('Audio synthesizer error:', err)
      setIsPlaying(false)
      setActiveTrack(null)
    }
  }

  const handlePlay = (track: ChimeTrack) => {
    if (activeTrack === track.id && isPlaying) {
      stopAllAudio()
      return
    }

    stopAllAudio()
    setActiveTrack(track.id)
    setIsPlaying(true)

    // Attempt HTML5 audio element first if file exists
    if (track.soundUrl) {
      const audio = new Audio(track.soundUrl)
      audio.volume = volume
      audioRef.current = audio

      audio.play().catch((err) => {
        console.warn('HTML5 Audio playback failed, using fallback synthesizer:', err)
        playSynthesizerFallback(track.synthType || 'marimba')
      })

      audio.onended = () => {
        setIsPlaying(false)
        setActiveTrack(null)
      }

      audio.onerror = () => {
        console.log('Falling back to synth chime tone')
        playSynthesizerFallback(track.synthType || 'marimba')
      }
    } else {
      playSynthesizerFallback(track.synthType || 'marimba')
    }
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Interactive Virtual PA & Soundboard</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
            Audition AutoBell High-Fidelity Chimes
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Crystal-clear pre-recorded bells, studio announcements, and emergency siren patterns.
          </p>
        </div>

        {/* Master Volume Slider */}
        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
          <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              setVolume(val)
              if (audioRef.current) audioRef.current.volume = val
            }}
            className="w-24 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            aria-label="Sound volume"
          />
          <span className="text-xs font-mono text-slate-300 w-8">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Sound Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 relative z-10">
        {TRACKS.map((track) => {
          const isCurrent = activeTrack === track.id
          const Icon = track.icon
          return (
            <div
              key={track.id}
              className={`group p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                isCurrent
                  ? 'bg-gradient-to-r from-slate-800 to-slate-800/90 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-800/50 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => handlePlay(track)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${track.color} text-white shadow-md shrink-0`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/50">
                      {track.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{track.duration}</span>
                  </div>
                  <h4 className="font-semibold text-white text-base mt-1 group-hover:text-cyan-300 transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{track.subtitle}</p>
                </div>
              </div>

              {/* Play / Stop Button */}
              <button
                type="button"
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                  isCurrent
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:scale-105'
                }`}
                aria-label={isCurrent ? 'Stop chime' : 'Play chime'}
              >
                {isCurrent ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
            </div>
          )
        })}
      </div>

      {/* Visualizer Animation Bar */}
      {isPlaying && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-xs text-cyan-300 font-medium">Broadcasting preview audio to virtual campus speaker...</span>
          </div>

          <div className="flex items-end gap-1 h-5">
            {[40, 75, 20, 90, 60, 100, 45, 80, 30, 95, 50, 85].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-cyan-400 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

