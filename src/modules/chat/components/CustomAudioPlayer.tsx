import { useState, useRef, useMemo } from 'react'
import { Play, Pause } from 'lucide-react'

interface Props {
  src: string
  isOwn: boolean
}

export default function CustomAudioPlayer({ src, isOwn }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0 to 1
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Generate a fake waveform (30 bars)
  const bars = useMemo(() => {
    // Deterministic random so it doesn't change on re-renders, but looks varied
    const pattern = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.5, 1.0, 0.6, 0.4, 0.7, 0.5, 0.8, 0.6, 0.4, 0.9, 0.5, 0.3, 0.6, 0.8, 0.5, 0.7, 0.4, 0.6, 0.9, 0.5, 0.3, 0.6, 0.4]
    return pattern
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const current = audioRef.current.currentTime
    const total = audioRef.current.duration || 1
    setProgress(current / total)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setProgress(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs === Infinity) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="flex items-center gap-3 w-full min-w-[200px] max-w-[280px]">
      {src && (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}
      
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
        style={{
          background: isOwn ? 'white' : 'var(--color-accent)',
          color: isOwn ? 'var(--color-accent)' : 'white'
        }}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform and Time */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        {/* Waveform */}
        <div className="flex items-center gap-[2px] h-6 w-full cursor-pointer" onClick={(e) => {
          if (!audioRef.current) return
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const newProgress = x / rect.width
          audioRef.current.currentTime = newProgress * (audioRef.current.duration || 1)
          setProgress(newProgress)
        }}>
          {bars.map((height, i) => {
            const barProgress = i / bars.length
            const isPlayed = barProgress <= progress
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-75"
                style={{
                  height: `${height * 100}%`,
                  minHeight: '2px',
                  background: isOwn
                    ? (isPlayed ? 'white' : 'rgba(255, 255, 255, 0.4)')
                    : (isPlayed ? 'var(--color-accent)' : 'var(--color-accent-light)'),
                  opacity: !isOwn && !isPlayed ? 0.3 : 1
                }}
              />
            )
          })}
        </div>
        
        {/* Time / Duration */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: isOwn ? 'rgba(255,255,255,0.9)' : 'var(--color-text-faint)' }}>
          <span>{formatTime(isPlaying ? audioRef.current?.currentTime || 0 : duration)}</span>
          <div className="h-1 w-1 rounded-full bg-current opacity-50" />
        </div>
      </div>
    </div>
  )
}
