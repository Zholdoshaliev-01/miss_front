import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, memo } from 'react'
import { MessageSquare, Users, Hash, Search, Loader2 } from 'lucide-react'
import { getRooms, getMessages, getUsersBulk } from '../api'
import type { RoomOut, MessageOut } from '../types'
import { cn } from '@/shared/utils/cn'
import { useAuthStore } from '@/modules/auth/store/authStore'

interface Props {
  activeRoomId: number | null
  onSelectRoom: (room: RoomOut) => void
}

/* ─── Format time like Telegram ─── */
function formatSidebarTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays === 0 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays <= 1) return 'Yesterday'
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' })
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })
}

function isTeacherRole(role?: string) {
  return role === 'teacher' || role === 'admin'
}

function isGenericUserName(name?: string) {
  return !name || /^User #\d+$/i.test(name.trim())
}

/* ─── Single room row — receives data as props, no per-item fetching ─── */
const SidebarRoomItem = memo(function SidebarRoomItem({
  room,
  isActive,
  onSelect,
  lastMsg,
}: {
  room: RoomOut
  isActive: boolean
  onSelect: () => void
  lastMsg: MessageOut | null
}) {
  const previewText = lastMsg
    ? lastMsg.is_deleted
      ? 'Message deleted'
      : lastMsg.text || '🎤 Voice message'
    : 'No messages yet'

  const senderName = lastMsg?.sender_name && lastMsg.sender_name !== 'undefined'
    ? lastMsg.sender_name
    : 'Someone'

  const senderPrefix = lastMsg && !lastMsg.is_deleted
    ? `${senderName}: `
    : ''

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
        isActive
          ? 'bg-[var(--color-accent)]/10 shadow-sm'
          : 'hover:bg-[var(--color-surface-hover)]',
      )}
      style={{
        borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
      }}
    >
      {room.image_url ? (
        <img
          src={room.image_url}
          alt={room.title || 'Chat'}
          className="h-10 w-10 shrink-0 rounded-xl object-cover"
          style={{ boxShadow: isActive ? '0 4px 12px var(--color-accent-glow)' : 'none' }}
        />
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))',
            boxShadow: isActive ? '0 4px 12px var(--color-accent-glow)' : 'none',
          }}
        >
          <Users className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className="truncate text-sm font-medium"
            style={{
              color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
            }}
          >
            {room.title || 'Untitled'}
          </p>
          {lastMsg && (
            <span
              className="shrink-0 text-[10px] font-medium"
              style={{ color: isActive ? 'var(--color-accent-light)' : 'var(--color-text-faint)' }}
            >
              {formatSidebarTime(lastMsg.created_at)}
            </span>
          )}
        </div>
        <p
          className="truncate text-xs mt-0.5"
          style={{ color: 'var(--color-text-faint)' }}
        >
          {lastMsg ? (
            <>
              <span style={{ color: 'var(--color-text-muted)' }}>{senderPrefix}</span>
              {lastMsg.is_deleted ? (
                <span className="italic">{previewText}</span>
              ) : (
                previewText
              )}
            </>
          ) : (
            <span className="italic">{previewText}</span>
          )}
        </p>
      </div>
    </button>
  )
})

/* ─── Sidebar ─── */

export default function ChatSidebar({ activeRoomId, onSelectRoom }: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const accessToken = useAuthStore((s) => s.accessToken)

  const { data: rooms = [], isLoading, isError, error } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: getRooms,
    enabled: Boolean(accessToken),
    retry: 1,
  })
  const errorDetail = (error as any)?.response?.data?.detail || (error as any)?.message || 'Check chat backend.'

  /*
   * Batch-fetch last message for all rooms once, instead of N separate
   * useQuery hooks inside each SidebarRoomItem. This eliminates the N+1
   * query waterfall that was making the sidebar slow.
   */
  const [lastMessages, setLastMessages] = useState<Record<number, MessageOut | null>>({})

  useEffect(() => {
    if (rooms.length === 0) return
    let cancelled = false

    async function fetchPreviews() {
      const results: Record<number, MessageOut | null> = {}
      await Promise.allSettled(
        rooms.map(async (room) => {
          try {
            // Use cache if available (e.g. from opening a chat)
            const cached = queryClient.getQueryData<MessageOut[]>(['chat-messages', room.group_id])
            if (cached && cached.length > 0) {
              results[room.group_id] = cached[cached.length - 1]
              return
            }
            const msgs = await getMessages(room.group_id, 1)
            results[room.group_id] = msgs.length > 0 ? msgs[msgs.length - 1] : null
          } catch {
            results[room.group_id] = null
          }
        }),
      )

      const userIds = [
        ...new Set(
          Object.values(results)
            .map((message) => message?.sender_id ?? 0)
            .filter((id) => id > 0),
        ),
      ]
      const users = await getUsersBulk(userIds)
      const userById = new Map(users.map((user) => [user.id, user]))
      const namedResults = Object.fromEntries(
        Object.entries(results).map(([groupId, message]) => {
          if (!message) return [groupId, message]

          const sender = userById.get(message.sender_id)
          return [
            groupId,
            {
              ...message,
              sender_name: sender?.username
                || sender?.full_name
                || (!isGenericUserName(message.sender_name) ? message.sender_name : `User #${message.sender_id}`),
              is_teacher: message.is_teacher || isTeacherRole(sender?.role),
            },
          ]
        }),
      ) as Record<number, MessageOut | null>

      if (!cancelled) setLastMessages(namedResults)
    }

    fetchPreviews()
    const interval = setInterval(fetchPreviews, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [rooms, queryClient])

  const filtered = rooms.filter((r) =>
    (r.title ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex h-full flex-col border-r" style={{ borderColor: 'var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" style={{ color: 'var(--color-accent-light)' }} />
          <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>Chats</h2>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
          <input
            type="text"
            placeholder="Search chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field input-with-icon !py-2 !text-sm"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-accent)' }} />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <Hash className="mb-2 h-8 w-8" style={{ color: 'var(--color-text-faint)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Chat is not connected
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
              {errorDetail}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Hash className="h-8 w-8 mb-2" style={{ color: 'var(--color-text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {search ? 'No rooms match your search' : 'No chat rooms yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((room) => (
              <SidebarRoomItem
                key={room.id}
                room={room}
                isActive={activeRoomId === room.id}
                onSelect={() => onSelectRoom(room)}
                lastMsg={lastMessages[room.group_id] ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
