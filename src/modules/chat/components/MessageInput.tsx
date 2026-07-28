import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Send, Paperclip, Loader2, X, Image, FileIcon, Mic, Square } from 'lucide-react'

interface Props {
  onSend: (text: string, file?: File) => void
  isPending: boolean
  onTyping?: () => void
}

const MAX_ROWS = 5
const LINE_HEIGHT = 22

/** Check if a file is an image */
function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

/** Format file size */
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MessageInput({ onSend, isPending, onTyping }: Props) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Create object URL for image preview
  const imagePreviewUrl = useMemo(() => {
    if (file && isImageFile(file)) {
      return URL.createObjectURL(file)
    }
    return null
  }, [file])

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxHeight = LINE_HEIGHT * MAX_ROWS
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    resizeTextarea()
  }, [text, resizeTextarea])

  const emitTyping = useCallback(() => {
    if (!onTyping) return
    onTyping()
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {}, 2000)
  }, [onTyping])

  function handleSend() {
    const trimmed = text.trim()
    // Allow sending with just a file (no text required)
    if (!trimmed && !file) return
    onSend(trimmed, file ?? undefined)
    setText('')
    setFile(null)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    })
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    emitTyping()
  }

  function handleFileClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      textareaRef.current?.focus()
    }
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  function removeFile() {
    setFile(null)
    textareaRef.current?.focus()
  }

  /* ─── Audio Recording ─── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' })
        setFile(audioFile)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied', err)
      // Provide user feedback if necessary
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const canSend = (text.trim().length > 0 || !!file) && !isPending

  return (
    <div style={{ borderTop: '1px solid var(--border-color)', background: 'var(--color-bg-alt)' }}>
      {/* ─── File preview bar ─── */}
      {file && (
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          {/* Thumbnail or file icon */}
          {imagePreviewUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ border: '1px solid var(--glass-border)' }}>
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}
            >
              <FileIcon className="h-6 w-6" style={{ color: 'var(--color-accent-light)' }} />
            </div>
          )}

          {/* File info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {file.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-faint)' }}>
              {isImageFile(file) ? (
                <><Image className="h-3 w-3" /> Photo</>
              ) : (
                <><FileIcon className="h-3 w-3" /> File</>
              )}
              <span>·</span>
              <span>{formatSize(file.size)}</span>
            </p>
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={removeFile}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-faint)' }}
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Input row ─── */}
      <div className="flex items-end gap-3 px-4 py-3">
        {/* Attach file */}
        <button
          type="button"
          onClick={handleFileClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-[var(--color-surface-hover)]"
          style={{ color: file ? 'var(--color-accent-light)' : 'var(--color-text-muted)' }}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
          className="sr-only"
          onChange={handleFileChange}
        />

        {/* Textarea or Recording State */}
        {isRecording ? (
          <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
            <div className="h-2 w-2 animate-pulse rounded-full bg-status-expelled" />
            <span className="text-sm font-medium text-status-expelled">Recording… {formatTime(recordingTime)}</span>
            <div className="flex-1" />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={file ? 'Add a caption…' : 'Type a message…'}
            rows={1}
            className="input-field !rounded-xl !py-2.5 resize-none"
            style={{ lineHeight: `${LINE_HEIGHT}px`, maxHeight: `${LINE_HEIGHT * MAX_ROWS}px` }}
            disabled={isPending}
          />
        )}

        {/* Mic / Stop Recording */}
        <button
          type="button"
          onClick={toggleRecording}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-[var(--color-surface-hover)]"
          style={{ color: isRecording ? 'var(--color-status-expelled, #ef4444)' : 'var(--color-text-muted)' }}
          title={isRecording ? "Stop recording" : "Record voice message"}
        >
          {isRecording ? <Square className="h-4 w-4" fill="currentColor" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="btn-primary !rounded-xl !p-2.5 shrink-0 disabled:opacity-40"
          title="Send"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
