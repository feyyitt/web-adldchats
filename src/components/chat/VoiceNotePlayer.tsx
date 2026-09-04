import { useState, useRef, useEffect } from 'react'

interface VoiceNotePlayerProps {
  audioUrl?: string
  duration?: number
  isSelf: boolean
}

const WAVEFORM_HEIGHTS = [
  10, 16, 8, 22, 14, 26, 12, 20, 16, 28, 18, 10, 
  22, 14, 8, 20, 24, 16, 12, 22, 18, 14, 8, 12
]

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function VoiceNotePlayer({ audioUrl, duration = 8, isSelf }: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration)
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1)

  useEffect(() => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(Math.round(audio.duration))
      }
    }

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.onerror = () => {
      setIsPlaying(false)
    }

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [audioUrl])

  // Toggle Play / Pause
  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!audioRef.current && !audioUrl) {
      // If mock voice note without real audio, simulate progress
      if (isPlaying) {
        setIsPlaying(false)
      } else {
        setIsPlaying(true)
      }
      return
    }

    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.playbackRate = playbackRate
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch((err) => {
        console.warn('Audio playback failed:', err)
        setIsPlaying(false)
      })
    }
  }

  // Handle seeking by clicking on waveform
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    const newTime = percent * totalDuration

    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
      }
    }
  }

  // Cycle playback rate (1x -> 1.5x -> 2x)
  const handleCycleRate = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
    setPlaybackRate(nextRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[210px] max-w-[280px] sm:min-w-[240px] select-none">
      {/* Play / Pause Circular Button */}
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-md ${
          isSelf
            ? 'bg-zinc-950/80 text-emerald-400 hover:bg-zinc-950 hover:text-emerald-300'
            : 'bg-emerald-600 text-white hover:bg-emerald-500'
        }`}
        title={isPlaying ? 'Jeda Suara' : 'Putar Pesan Suara'}
      >
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      {/* Waveform & Scrubber Area */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        {/* Interactive Waveform Bars */}
        <div
          onClick={handleSeek}
          className="h-8 flex items-center gap-[2.5px] cursor-pointer group py-1 relative"
          title="Geser / Ketuk untuk Memilih Posisi Suara"
        >
          {WAVEFORM_HEIGHTS.map((height, idx) => {
            const barPercent = (idx / WAVEFORM_HEIGHTS.length) * 100
            const isPassed = barPercent <= progressPercent

            return (
              <div
                key={idx}
                style={{ height: `${height}px` }}
                className={`w-[3px] rounded-full transition-all duration-100 ${
                  isPassed
                    ? isSelf
                      ? 'bg-zinc-950 font-bold'
                      : 'bg-emerald-400 font-bold shadow-sm shadow-emerald-400/50'
                    : isSelf
                    ? 'bg-zinc-950/35 group-hover:bg-zinc-950/50'
                    : 'bg-white/25 group-hover:bg-white/40'
                }`}
              />
            )
          })}
        </div>

        {/* Time & Speed Controls */}
        <div className="flex items-center justify-between text-[10px] font-mono leading-none">
          <span className={isSelf ? 'text-zinc-950/80 font-semibold' : 'text-zinc-400'}>
            {isPlaying ? formatAudioTime(currentTime) : formatAudioTime(totalDuration)}
          </span>

          {/* Speed Pill (1x / 1.5x / 2x) */}
          <button
            type="button"
            onClick={handleCycleRate}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-sans transition-all active:scale-95 ${
              isSelf
                ? 'bg-zinc-950/20 hover:bg-zinc-950/30 text-zinc-950'
                : 'bg-white/10 hover:bg-white/20 text-emerald-300'
            }`}
            title="Ubah Kecepatan Putar"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  )
}
