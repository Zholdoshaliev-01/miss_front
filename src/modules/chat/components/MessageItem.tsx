import { useState, memo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Check, CheckCheck, X, Clock, FileIcon, Download } from 'lucide-react'
import { toast } from 'sonner'
import { editMessage, deleteMessage } from '../api'
import type { MessageOut } from '../types'
import CustomAudioPlayer from './CustomAudioPlayer'
import { buildMediaUrl } from '@/shared/utils/buildMediaUrl'
import { CHAT_API_BASE_URL, resolveServiceUrl } from '@/core/config/api'

/** Attachment data for rendering files/images in messages */
export interface MessageAttachment {
  file_url: string
  file_name: string
  original_name?: string
  url?: string
  mime_type: string
  file_size: number
  /** Local blob URL for optimistic preview (before upload completes) */
  localPreviewUrl?: string
}

interface Props {
  message: MessageOut
  isOwn: boolean
  roomId: number
  isFirstInGroup: boolean
  isLastInGroup: boolean
  showTimestamp: boolean
  isOptimistic?: boolean
  isRead?: boolean
  /** Optional attachment to render */
  attachment?: MessageAttachment | null
}

function isImage(mimeOrUrl: string) {
  if (mimeOrUrl.startsWith('image/')) return true
  // Fallback: check URL extension
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(mimeOrUrl)
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getAvatarUrl(path?: string | null) {
  return path ? buildMediaUrl(path) : ''
}

function MessageItemInner({
  message,
  isOwn,
  roomId,
  isFirstInGroup,
  isLastInGroup,
  showTimestamp,
  isOptimistic,
  isRead,
  attachment,
}: Props) {
  const queryClient = useQueryClient()
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)

  const editMut = useMutation({
    mutationFn: () => editMessage(message.id, { text: editText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
      setIsEditing(false)
      toast.success('Message edited')
    },
    onError: () => toast.error('Failed to edit message'),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteMessage(message.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
      toast.success('Message deleted')
    },
    onError: () => toast.error('Failed to delete message'),
  })

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const getBubbleRadius = () => {
    if (isOwn) {
      if (isFirstInGroup && isLastInGroup) return '16px'
      if (isFirstInGroup) return '16px 16px 4px 16px'
      if (isLastInGroup) return '16px 4px 16px 16px'
      return '16px 4px 4px 16px'
    } else {
      if (isFirstInGroup && isLastInGroup) return '16px'
      if (isFirstInGroup) return '16px 16px 16px 4px'
      if (isLastInGroup) return '4px 16px 16px 16px'
      return '4px 16px 16px 4px'
    }
  }

  const marginBottom = isLastInGroup ? '12px' : '2px'
  const backendAttachment = message.attachments?.[0]
  const currentAttachment = attachment || backendAttachment
  const attachmentName = currentAttachment?.original_name
    || currentAttachment?.url?.split('/').pop()
    || currentAttachment?.file_url?.split('/').pop()
    || currentAttachment?.file_name
    || 'Файл'

  const hasAttachment = !!currentAttachment
  const mimeType = currentAttachment?.mime_type || ''
  const isAudio = mimeType.startsWith('audio/')
  const attachmentIsImage = hasAttachment && !isAudio && isImage(mimeType || currentAttachment?.file_url || '')

  // Resolve the attachment URL: backend may return `file_url` or `url`,
  // and it may be relative (e.g. "/media/chat/voice.webm")
  const rawUrl = currentAttachment?.localPreviewUrl
    || currentAttachment?.file_url
    || currentAttachment?.url
    || ''
  const attachmentUrl = resolveServiceUrl(CHAT_API_BASE_URL, rawUrl)

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`} style={{ marginBottom }}>
        <div
          className="max-w-[70%] rounded-2xl px-4 py-2 italic"
          style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}
        >
          Message deleted
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} ${isOwn ? 'msg-animate-right' : 'msg-animate-left'}`}
      style={{ marginBottom }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex max-w-[70%] items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isOwn && (
          <div style={{ width: 32, flexShrink: 0 }}>
            {isFirstInGroup ? (
              message.sender_avatar ? (
                <img
                  src={getAvatarUrl(message.sender_avatar)}
                  alt={message.sender_name || 'User'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    background: message.is_teacher
                      ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))'
                      : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  }}
                >
                  {message.sender_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )
            ) : null}
          </div>
        )}

        {/* Bubble */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: getBubbleRadius(),
            background: isOwn
              ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))'
              : 'var(--color-surface)',
            color: isOwn ? 'white' : 'var(--color-text)',
            border: isOwn ? 'none' : '1px solid var(--glass-border)',
            boxShadow: isOwn ? '0 4px 12px var(--color-accent-glow)' : 'none',
            opacity: isOptimistic ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {/* Sender name */}
          {!isOwn && isFirstInGroup && (
            <div className="px-4 pt-2.5 pb-0">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-accent-light)' }}>
                {message.sender_name}
                {message.is_teacher && (
                  <span
                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]"
                    style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent-light)' }}
                  >
                    Teacher
                  </span>
                )}
              </p>
            </div>
          )}

          {/* ─── Attachment rendering ─── */}
          {hasAttachment && attachmentIsImage && (
            <div className={`${!isOwn && isFirstInGroup ? 'pt-1.5' : ''}`}>
              <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={attachmentUrl || undefined}
                  alt={attachmentName}
                  className="block w-full"
                  style={{
                    maxHeight: 300,
                    objectFit: 'cover',
                    borderRadius: isFirstInGroup && !isOwn ? '0' : undefined,
                  }}
                  loading="lazy"
                />
              </a>
            </div>
          )}

          {hasAttachment && isAudio && (
            <div className="mx-2 mt-1 mb-1">
              <CustomAudioPlayer src={attachmentUrl} isOwn={isOwn} />
            </div>
          )}

          {hasAttachment && !attachmentIsImage && !isAudio && (
            <div className="mx-3 mt-2.5 mb-1">
              <a
                href={attachmentUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl p-2.5 transition hover:opacity-80"
                style={{
                  background: isOwn ? 'rgba(255,255,255,0.12)' : 'var(--input-bg)',
                  border: isOwn ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--glass-border)',
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: isOwn ? 'rgba(255,255,255,0.15)' : 'var(--color-accent)/10',
                  }}
                >
                  <FileIcon className="h-5 w-5" style={{ color: isOwn ? 'white' : 'var(--color-accent-light)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{attachmentName}</p>
                  <p className="text-[11px] opacity-60">{formatFileSize(currentAttachment.file_size)}</p>
                </div>
                <Download className="h-4 w-4 shrink-0 opacity-50" />
              </a>
            </div>
          )}

          {/* Text content */}
          <div className="px-4 py-2.5" style={{ paddingTop: hasAttachment ? '0.375rem' : undefined, paddingBottom: undefined }}>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="input-field !py-1 !text-sm"
                  style={{
                    background: isOwn ? 'rgba(255,255,255,0.15)' : undefined,
                    color: isOwn ? 'white' : undefined,
                  }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && editMut.mutate()}
                />
                <button type="button" onClick={() => editMut.mutate()} className="text-green-400 hover:text-green-300">
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditText(message.text) }}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* Hide text if it's just the filename or 'voice.webm' for audio messages */
              message.text
                && !(hasAttachment && message.text === attachmentName)
                && !(isAudio && message.text === 'voice.webm')
              ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
              ) : null
            )}

            {/* Timestamp + status */}
            {(showTimestamp || isLastInGroup) && (
              <div className="mt-1 flex items-center justify-end gap-1.5">
                {message.edited_at && (
                  <span className="text-[10px] opacity-50">edited</span>
                )}
                <span className="text-[10px] opacity-50">{time}</span>
                {isOwn && isOptimistic && <Clock className="h-3 w-3 opacity-40" />}
                {isOwn && !isOptimistic && (isRead
                  ? <CheckCheck className="h-3 w-3 opacity-70" />
                  : <Check className="h-3 w-3 opacity-50" />)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isOwn && showActions && !isEditing && !isOptimistic && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => { setIsEditing(true); setEditText(message.text) }}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-hover)]"
              style={{ color: 'var(--color-text-muted)' }}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => deleteMut.mutate()}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-red-500/10"
              style={{ color: 'var(--color-danger)' }}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const MessageItem = memo(MessageItemInner, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.sender_name === next.message.sender_name &&
    prev.message.sender_avatar === next.message.sender_avatar &&
    prev.message.is_teacher === next.message.is_teacher &&
    prev.message.is_deleted === next.message.is_deleted &&
    prev.message.edited_at === next.message.edited_at &&
    prev.isOwn === next.isOwn &&
    prev.isFirstInGroup === next.isFirstInGroup &&
    prev.isLastInGroup === next.isLastInGroup &&
    prev.showTimestamp === next.showTimestamp &&
    prev.isOptimistic === next.isOptimistic &&
    prev.isRead === next.isRead &&
    prev.attachment?.file_url === next.attachment?.file_url &&
    prev.attachment?.localPreviewUrl === next.attachment?.localPreviewUrl
  )
})

export default MessageItem
