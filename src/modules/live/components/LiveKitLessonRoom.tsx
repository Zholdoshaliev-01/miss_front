import { useEffect, useMemo, useState } from 'react'
import {
  DisconnectButton,
  LiveKitRoom,
  ParticipantTile,
  PreJoin,
  RoomAudioRenderer,
  TrackToggle,
  useConnectionState,
  useParticipants,
  useRoomContext,
  useSpeakingParticipants,
  useTracks,
} from '@livekit/components-react'
import type { LocalUserChoices, TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { ConnectionState, Track } from 'livekit-client'
import { Camera, CameraOff, Loader2, Mic, MicOff, PhoneOff, RefreshCw, Users, X } from 'lucide-react'
import type { LiveKitCredentials, LiveLesson } from '../api'
import '@livekit/components-styles'
import './LiveKitLessonRoom.css'

interface LiveKitLessonRoomProps {
  credentials: LiveKitCredentials
  lesson: LiveLesson
  groupName: string
  displayName: string
  isTeacher: boolean
  reconnectAttempt: number
  onEndLesson: () => Promise<void>
  onLeave: () => void
  onReconnect: () => Promise<void>
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

function LessonTimer({ startedAt }: { startedAt?: string }) {
  const parsedStart = startedAt ? new Date(startedAt).getTime() : 0
  const validStart = Number.isNaN(parsedStart) ? 0 : parsedStart
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds(validStart ? Math.max(0, Math.floor((Date.now() - validStart) / 1000)) : 0)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [validStart])

  return <span className="font-mono text-sm text-white/55">{formatDuration(seconds)}</span>
}

function ConnectionBadge() {
  const state = useConnectionState()
  const config = {
    [ConnectionState.Connected]: ['Подключено', 'bg-emerald-400'],
    [ConnectionState.Connecting]: ['Подключение', 'bg-amber-400'],
    [ConnectionState.Reconnecting]: ['Переподключение', 'bg-amber-400'],
    [ConnectionState.Disconnected]: ['Отключено', 'bg-rose-400'],
    [ConnectionState.SignalReconnecting]: ['Восстановление связи', 'bg-amber-400'],
  }[state] ?? ['Подключение', 'bg-amber-400']

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1 text-xs text-white/55">
      <span className={`h-2 w-2 rounded-full ${config[1]} ${state !== ConnectionState.Connected ? 'animate-pulse' : ''}`} />
      {config[0]}
    </span>
  )
}

function ParticipantPanel({ onClose }: { onClose: () => void }) {
  const participants = useParticipants()

  return (
    <aside className="livekit-participants-panel">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Участники</h3>
          <p className="mt-0.5 text-xs text-white/35">Сейчас в уроке: {participants.length}</p>
        </div>
        <button type="button" className="livekit-icon-button lg:hidden" onClick={onClose} aria-label="Закрыть список участников">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto p-3">
        {participants.map((participant) => (
          <div key={participant.sid} className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/50 to-cyan-400/30 font-heading text-sm font-bold text-white">
              {(participant.name || participant.identity).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/80">
                {participant.name || participant.identity}{participant.isLocal ? ' (вы)' : ''}
              </p>
              <p className="text-xs text-white/35">{participant.isSpeaking ? 'Говорит' : 'В уроке'}</p>
            </div>
            <div className="flex items-center gap-1.5 text-white/45">
              {participant.isMicrophoneEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5 text-rose-300" />}
              {participant.isCameraEnabled ? <Camera className="h-3.5 w-3.5" /> : <CameraOff className="h-3.5 w-3.5 text-rose-300" />}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function RoomContent({ lesson, groupName, displayName, isTeacher, isEnding, onEnd, onLeave, onDeviceError }: {
  lesson: LiveLesson
  groupName: string
  displayName: string
  isTeacher: boolean
  isEnding: boolean
  onEnd: () => void
  onLeave: () => void
  onDeviceError: (error: Error) => void
}) {
  const room = useRoomContext()
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }])
  const screenTracks = useTracks([Track.Source.ScreenShare])
  const activeSpeakers = useSpeakingParticipants()
  const participants = useParticipants()
  const [showParticipants, setShowParticipants] = useState(false)

  useEffect(() => {
    if (displayName.trim()) void room.localParticipant.setName(displayName.trim())
  }, [displayName, room])

  const mainTrack = useMemo<TrackReferenceOrPlaceholder | undefined>(() => {
    const screen = screenTracks[0]
    if (screen) return screen
    const activeSpeaker = activeSpeakers[0]
    return cameraTracks.find((track) => track.participant.sid === activeSpeaker?.sid)
      ?? cameraTracks.find((track) => !track.participant.isLocal)
      ?? cameraTracks[0]
  }, [activeSpeakers, cameraTracks, screenTracks])

  return (
    <div className="livekit-classroom">
      <header className="livekit-room-header">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate font-heading text-base font-semibold text-white sm:text-lg">{groupName}</h1>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> LIVE
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3"><ConnectionBadge /><LessonTimer startedAt={lesson.started_at} /></div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-white/35 sm:flex"><Users className="h-4 w-4" /> {participants.length} в уроке</div>
      </header>

      <div className={`livekit-content ${showParticipants ? 'show-participants' : ''}`}>
        <main className="min-w-0">
          <div className="livekit-stage">
            {mainTrack ? (
              <ParticipantTile trackRef={mainTrack} className="livekit-main-tile" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-white/35">
                <Loader2 className="h-8 w-8 animate-spin text-accent" /><p className="mt-3 text-sm">Ожидаем участников…</p>
              </div>
            )}
          </div>
          <div className="livekit-filmstrip" aria-label="Участники урока">
            {cameraTracks.map((track) => (
              <ParticipantTile
                key={`${track.participant.sid}-${track.source}`}
                trackRef={track}
                className={`livekit-filmstrip-tile ${track.participant.sid === mainTrack?.participant.sid ? 'is-active' : ''}`}
              />
            ))}
          </div>
        </main>
        {showParticipants && <ParticipantPanel onClose={() => setShowParticipants(false)} />}
      </div>

      <footer className="livekit-controls">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <TrackToggle source={Track.Source.Microphone} className="livekit-control-button" onDeviceError={onDeviceError}><span className="hidden sm:inline">Микрофон</span></TrackToggle>
          <TrackToggle source={Track.Source.Camera} className="livekit-control-button" onDeviceError={onDeviceError}><span className="hidden sm:inline">Камера</span></TrackToggle>
          <TrackToggle source={Track.Source.ScreenShare} className="livekit-control-button" onDeviceError={onDeviceError}><span className="hidden sm:inline">Экран</span></TrackToggle>
          <button type="button" className={`livekit-control-button ${showParticipants ? 'is-active' : ''}`} onClick={() => setShowParticipants((value) => !value)}>
            <Users className="h-4 w-4" /><span className="hidden sm:inline">Участники</span>
          </button>
          {isTeacher ? (
            <button type="button" className="livekit-end-button" onClick={onEnd} disabled={isEnding}>
              {isEnding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}<span className="hidden sm:inline">Завершить урок</span>
            </button>
          ) : (
            <DisconnectButton className="livekit-end-button" stopTracks onClick={onLeave}>
              <PhoneOff className="h-4 w-4" /><span className="hidden sm:inline">Покинуть</span>
            </DisconnectButton>
          )}
        </div>
      </footer>
      <RoomAudioRenderer />
    </div>
  )
}

export function LiveKitLessonRoom({ credentials, lesson, groupName, displayName, isTeacher, reconnectAttempt, onEndLesson, onLeave, onReconnect }: LiveKitLessonRoomProps) {
  const [choices, setChoices] = useState<LocalUserChoices | null>(null)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isEnding, setIsEnding] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => setConnectionError(null), [reconnectAttempt, credentials.token])

  if (!choices) {
    return (
      <div className="livekit-prejoin glass-card" data-lk-theme="default">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-light"><Camera className="h-6 w-6" /></div>
            <h2 className="mt-4 font-heading text-2xl font-bold text-white">Готовы присоединиться?</h2>
            <p className="mt-2 text-sm text-white/45">Проверьте камеру и микрофон перед входом в урок.</p>
          </div>
          <PreJoin
            defaults={{ username: displayName, audioEnabled: false, videoEnabled: false }}
            persistUserChoices={false}
            joinLabel="Присоединиться к уроку"
            micLabel="Микрофон"
            camLabel="Камера"
            userLabel="Ваше имя"
            onSubmit={(values) => { setDeviceError(null); setChoices(values) }}
            onError={(error) => setDeviceError(error.message || 'Не удалось получить доступ к устройству.')}
          />
          {deviceError && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.08] p-4 text-sm text-amber-100">
              <p>Нет доступа к камере или микрофону. Проверьте разрешения браузера или войдите без устройств.</p>
              <p className="mt-1 text-xs text-amber-100/55">{deviceError}</p>
            </div>
          )}
          <button type="button" className="btn-secondary mx-auto mt-4 flex text-sm" onClick={() => setChoices({ username: displayName, audioEnabled: false, videoEnabled: false, audioDeviceId: 'default', videoDeviceId: 'default' })}>
            Войти без камеры и микрофона
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="livekit-room-frame" data-lk-theme="default">
      <LiveKitRoom
        key={`${lesson.id}-${reconnectAttempt}`}
        token={credentials.token}
        serverUrl={credentials.url}
        connect
        audio={choices.audioEnabled ? { deviceId: choices.audioDeviceId } : false}
        video={choices.videoEnabled ? { deviceId: choices.videoDeviceId } : false}
        connectOptions={{ autoSubscribe: true }}
        onError={(error) => setConnectionError(error.message || 'Не удалось подключиться к видеоуроку.')}
        onMediaDeviceFailure={(_, kind) => setDeviceError(`Нет доступа к устройству: ${kind === 'audioinput' ? 'микрофон' : 'камера'}.`)}
        onDisconnected={() => { if (!isEnding) onLeave() }}
      >
        <RoomContent
          lesson={lesson}
          groupName={groupName}
          displayName={choices.username || displayName}
          isTeacher={isTeacher}
          isEnding={isEnding}
          onLeave={onLeave}
          onDeviceError={(error) => setDeviceError(error.message || 'Не удалось включить устройство.')}
          onEnd={async () => {
            setIsEnding(true)
            try { await onEndLesson() } finally { setIsEnding(false) }
          }}
        />
        {(connectionError || deviceError) && (
          <div className="livekit-error-toast" role="alert">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{connectionError ? 'Ошибка подключения' : 'Устройство недоступно'}</p>
              <p className="mt-1 text-xs text-white/55">{connectionError || deviceError}</p>
            </div>
            {connectionError ? (
              <button type="button" className="btn-secondary shrink-0 !px-3 !py-2 text-xs" disabled={isReconnecting} onClick={async () => {
                setIsReconnecting(true)
                try { await onReconnect(); setConnectionError(null) } finally { setIsReconnecting(false) }
              }}>
                {isReconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Повторить
              </button>
            ) : (
              <button type="button" className="livekit-icon-button" onClick={() => setDeviceError(null)} aria-label="Закрыть"><X className="h-4 w-4" /></button>
            )}
          </div>
        )}
      </LiveKitRoom>
    </div>
  )
}
