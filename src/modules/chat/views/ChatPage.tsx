import { useState, useMemo, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquarePlus,
  Loader2,
  MessagesSquare,
  ChevronDown,
  Info,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import ChatSidebar from '../components/ChatSidebar'
import MessageItem from '../components/MessageItem'
import type { MessageAttachment } from '../components/MessageItem'
import MessageInput from '../components/MessageInput'
import { getMessages, sendMessage, getMembers, getUsersBulk } from '../api'
import type { RoomOut, MessageOut, ChatUserSummary, MemberOut } from '../types'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useChatScroll } from '../hooks/useChatScroll'
import { buildMediaUrl } from '@/shared/utils/buildMediaUrl'

/* ─── Helpers ─── */

let optimisticIdCounter = -1

function isSameDay(a: string, b: string) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)

  if (isSameDay(dateStr, now.toISOString())) return 'Today'
  if (isSameDay(dateStr, yesterday.toISOString())) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function computeGrouping(messages: MessageOut[]) {
  return messages.map((msg, i) => {
    const prev = i > 0 ? messages[i - 1] : null
    const next = i < messages.length - 1 ? messages[i + 1] : null

    const sameSenderAsPrev = prev &&
      prev.sender_id === msg.sender_id &&
      !prev.is_deleted &&
      !msg.is_deleted &&
      Math.abs(new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 60_000

    const sameSenderAsNext = next &&
      next.sender_id === msg.sender_id &&
      !next.is_deleted &&
      !msg.is_deleted &&
      Math.abs(new Date(next.created_at).getTime() - new Date(msg.created_at).getTime()) < 60_000

    const isFirstInGroup = !sameSenderAsPrev
    const isLastInGroup = !sameSenderAsNext

    const showDateSeparator = !prev || !isSameDay(prev.created_at, msg.created_at)

    return {
      msg,
      isFirstInGroup,
      isLastInGroup,
      showTimestamp: isLastInGroup,
      showDateSeparator,
    }
  })
}

function isTeacherRole(role?: string) {
  return role === 'teacher' || role === 'admin'
}

function isGenericUserName(name?: string) {
  return !name || /^User #\d+$/i.test(name.trim())
}

function getAvatarUrl(path?: string | null) {
  return path ? buildMediaUrl(path) : ''
}

/* ─── Component ─── */

export default function ChatPage() {
  const user = useAuthStore((s) => s.user)
  const authUserId = Number((user as any)?.id) || 0
  const isTeacher = isTeacherRole(user?.role)
  const queryClient = useQueryClient()
  const [activeRoom, setActiveRoom] = useState<RoomOut | null>(null)

  // Optimistic messages + their attachments
  const [optimisticMessages, setOptimisticMessages] = useState<MessageOut[]>([])
  const [attachmentMap, setAttachmentMap] = useState<Record<number, MessageAttachment>>({})

  // Right sidebar details state
  const [showDetails, setShowDetails] = useState(false)

  // Pagination
  const oldestMsgIdRef = useRef<number | null>(null)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)

  /* ─── Queries ─── */

  const { data: serverMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', activeRoom?.group_id],
    queryFn: () => getMessages(activeRoom!.group_id),
    enabled: !!activeRoom,
    staleTime: 5_000,
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['chat-members', activeRoom?.group_id],
    queryFn: () => getMembers(activeRoom!.group_id),
    enabled: !!activeRoom,
  })

  const chatUserIds = useMemo(() => {
    const ids = [
      ...serverMessages.map((m) => m.sender_id),
      ...optimisticMessages.map((m) => m.sender_id),
      ...members.map((m) => m.user_id),
      authUserId,
    ]
    return [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))].sort((a, b) => a - b)
  }, [serverMessages, optimisticMessages, members, authUserId])

  const { data: chatUsers = [] } = useQuery({
    queryKey: ['chat-users', chatUserIds.join(',')],
    queryFn: () => getUsersBulk(chatUserIds),
    enabled: chatUserIds.length > 0,
    staleTime: 60_000,
  })

  const currentChatUser = useMemo(() => {
    if (authUserId) return chatUsers.find((chatUser) => chatUser.id === authUserId) ?? null
    return chatUsers.find((chatUser) =>
      (user?.username && chatUser.username === user.username) ||
      (user?.email && chatUser.email === user.email),
    ) ?? null
  }, [authUserId, chatUsers, user])

  const currentUserId = currentChatUser?.id ?? authUserId

  const userById = useMemo(() => {
    const map = new Map<number, ChatUserSummary>()
    chatUsers.forEach((chatUser) => map.set(chatUser.id, chatUser))
    if (currentUserId) {
      const existing = map.get(currentUserId)
      map.set(currentUserId, {
        id: currentUserId,
        username: existing?.username || user?.username || '',
        full_name: existing?.full_name || (user as any)?.full_name || '',
        email: existing?.email || user?.email || '',
        role: existing?.role || user?.role as ChatUserSummary['role'],
        avatar: existing?.avatar || (user as any)?.avatar || null,
      })
    }
    return map
  }, [chatUsers, currentUserId, user])

  const getDisplayName = useCallback((id: number, fallback?: string) => {
    const chatUser = userById.get(id)
    return chatUser?.username || chatUser?.full_name || (!isGenericUserName(fallback) ? fallback : '') || `User #${id}`
  }, [userById])

  const namedServerMessages = useMemo(() => (
    serverMessages.map((message) => {
      const chatUser = userById.get(message.sender_id)
      return {
        ...message,
        sender_name: getDisplayName(message.sender_id, message.sender_name),
        sender_avatar: chatUser?.avatar ?? message.sender_avatar ?? null,
        is_teacher: message.is_teacher || isTeacherRole(chatUser?.role),
      }
    })
  ), [serverMessages, userById, getDisplayName])

  const namedMembers = useMemo<MemberOut[]>(() => (
    members.map((member) => {
      const chatUser = userById.get(member.user_id)
      const name = getDisplayName(member.user_id, member.full_name)
      return {
        ...member,
        username: chatUser?.username ?? member.username,
        full_name: name,
        email: chatUser?.email ?? member.email,
        role: chatUser?.role ?? member.role,
        avatar: chatUser?.avatar ?? member.avatar ?? null,
      }
    })
  ), [members, userById, getDisplayName])

  const allMessages = useMemo(() => {
    const serverIds = new Set(namedServerMessages.map((m) => m.id))
    const pendingOptimistic = optimisticMessages.filter((om) => !serverIds.has(om.id) && om.id < 0)
    return [...namedServerMessages, ...pendingOptimistic]
  }, [namedServerMessages, optimisticMessages])

  const groupedMessages = useMemo(() => computeGrouping(allMessages), [allMessages])

  /* ─── Scroll ─── */

  const loadOlderMessages = useCallback(async () => {
    if (!activeRoom || !hasMoreOlder || isLoadingOlder) return
    const oldest = allMessages[0]
    if (!oldest || oldest.id < 0) return

    setIsLoadingOlder(true)
    try {
      const older = await getMessages(activeRoom.group_id, 50, oldest.id)
      if (older.length === 0) {
        setHasMoreOlder(false)
      } else {
        queryClient.setQueryData<MessageOut[]>(
          ['chat-messages', activeRoom.group_id],
          (prev = []) => [...older, ...prev],
        )
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingOlder(false)
    }
  }, [activeRoom, hasMoreOlder, isLoadingOlder, allMessages, queryClient])

  const {
    containerRef,
    handleScroll,
    forceScrollToBottom,
    showScrollButton,
  } = useChatScroll({
    onLoadMore: loadOlderMessages,
    messageCount: allMessages.length,
  })

  /* ─── Send message (with optional file) ─── */

  const sendMsgMut = useMutation({
    mutationFn: ({ text, file }: { text: string; file?: File; optimisticId: number }) =>
      sendMessage(activeRoom!.group_id, { text }, file),
    onSuccess: (_, { file, optimisticId }) => {
      setOptimisticMessages((prev) => prev.filter((message) => message.id !== optimisticId))
      if (file) {
        setAttachmentMap((prev) => {
          const updated = { ...prev }
          for (const [idStr, att] of Object.entries(updated)) {
            if (att.localPreviewUrl && att.file_name === file.name) {
              URL.revokeObjectURL(att.localPreviewUrl)
              delete updated[Number(idStr)]
              break
            }
          }
          return updated
        })
      }
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeRoom?.group_id] })
    },
    onError: () => {
      toast.error('Failed to send message')
    },
  })

  const handleSend = useCallback(
    (text: string, file?: File) => {
      if (!activeRoom) return

      const msgId = --optimisticIdCounter

      // Create optimistic message
      const optimistic: MessageOut = {
        id: msgId,
        room_id: activeRoom.id,
        sender_id: currentUserId,
        sender_name: currentChatUser?.username || user?.username || 'You',
        sender_avatar: currentChatUser?.avatar ?? (user as any)?.avatar ?? null,
        is_teacher: isTeacher,
        text,
        is_deleted: false,
        edited_at: null,
        created_at: new Date().toISOString(),
      }

      if (file) {
        const isPreviewable = file.type.startsWith('image/') || file.type.startsWith('audio/')
        const localPreviewUrl = isPreviewable ? URL.createObjectURL(file) : undefined

        const att: MessageAttachment = {
          file_url: '',
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          localPreviewUrl,
        }

        setAttachmentMap((prev) => ({ ...prev, [msgId]: att }))
      }

      setOptimisticMessages((prev) => [...prev, optimistic])
      forceScrollToBottom()

      sendMsgMut.mutate({ text, file, optimisticId: msgId })
    },
    [activeRoom, currentUserId, currentChatUser, user, isTeacher, forceScrollToBottom, sendMsgMut],
  )

  /* ─── Room change ─── */

  const handleSelectRoom = useCallback(
    (room: RoomOut) => {
      Object.values(attachmentMap).forEach((att) => {
        if (att.localPreviewUrl) URL.revokeObjectURL(att.localPreviewUrl)
      })
      setActiveRoom(room)
      setOptimisticMessages([])
      setAttachmentMap({})
      setHasMoreOlder(true)
      oldestMsgIdRef.current = null
    },
    [attachmentMap],
  )

  /* ─── Render ─── */

  return (
    <div className="glass-card overflow-hidden flex h-[calc(100dvh-2rem)] md:h-[calc(100dvh-3rem)] w-full">
      <div className="flex h-full w-full">
        {/* Sidebar */}
        <div className="hidden w-80 shrink-0 md:block" style={{ background: 'var(--color-bg-alt)' }}>
          <ChatSidebar activeRoomId={activeRoom?.id ?? null} onSelectRoom={handleSelectRoom} />
        </div>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col">
          {activeRoom ? (
            <>
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--color-bg-alt)',
                }}
              >
                <div className="flex items-center gap-3">
                  {activeRoom.image_url ? (
                    <img
                      src={activeRoom.image_url}
                      alt={activeRoom.title || 'Chat'}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl font-heading text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))' }}
                    >
                      {activeRoom.title?.[0]?.toUpperCase() ?? '#'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                      {activeRoom.title || 'Untitled'}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      {namedMembers.length} members
                      {namedMembers.filter((m) => m.is_online).length > 0
                        ? ` · ${namedMembers.filter((m) => m.is_online).length} online`
                        : ''}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDetails(!showDetails)
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-hover)]"
                  style={{ color: 'var(--color-text-muted)' }}
                  title="Chat Details"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>

              {/* Messages area */}
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-6 py-4 relative"
                style={{ background: 'var(--color-bg)' }}
              >
                {messagesLoading && allMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: 'var(--input-bg)' }}
                    >
                      <MessageSquarePlus className="h-8 w-8" style={{ color: 'var(--color-text-faint)' }} />
                    </div>
                    <p className="font-heading text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      No messages yet
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  <>
                    {isLoadingOlder && (
                      <div className="flex justify-center py-3">
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-accent)' }} />
                      </div>
                    )}

                    {!hasMoreOlder && allMessages.length > 0 && (
                      <div className="flex justify-center py-3">
                        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                          Beginning of conversation
                        </span>
                      </div>
                    )}

                    {groupedMessages.map(({ msg, isFirstInGroup, isLastInGroup, showTimestamp, showDateSeparator }) => (
                      <div key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center py-3">
                            <div
                              className="rounded-full px-4 py-1 text-xs font-medium"
                              style={{
                                background: 'var(--input-bg)',
                                color: 'var(--color-text-muted)',
                                border: '1px solid var(--glass-border)',
                              }}
                            >
                              {formatDateSeparator(msg.created_at)}
                            </div>
                          </div>
                        )}
                          <MessageItem
                          message={msg}
                          isOwn={Boolean(currentUserId) && msg.sender_id === currentUserId}
                          roomId={activeRoom.group_id}
                          isFirstInGroup={isFirstInGroup}
                          isLastInGroup={isLastInGroup}
                          showTimestamp={showTimestamp}
                          isOptimistic={msg.id < 0}
                          attachment={attachmentMap[msg.id] ?? null}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => forceScrollToBottom()}
                    className="scroll-btn-animate absolute -top-14 right-6 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition hover:scale-105"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--color-text-muted)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    }}
                    title="Scroll to bottom"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Input */}
              <MessageInput
                onSend={handleSend}
                isPending={false}
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center px-6" style={{ background: 'var(--color-bg)' }}>
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
                style={{ background: 'var(--input-bg)' }}
              >
                <MessagesSquare className="h-10 w-10" style={{ color: 'var(--color-text-faint)' }} />
              </div>
              <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Welcome to Chat
              </h3>
              <p className="mt-2 max-w-sm text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Select a chat room from the sidebar to start messaging, or create a new one.
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar (Chat Details) */}
        {activeRoom && showDetails && (
          <div 
            className="w-72 shrink-0 border-l flex flex-col transition-all duration-300 z-10 relative" 
            style={{ borderColor: 'var(--border-color)', background: 'var(--color-bg-alt)' }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="font-heading text-sm font-bold" style={{ color: 'var(--color-text)' }}>Chat Details</h3>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-hover)]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* Room info */}
              <div className="flex flex-col items-center p-6 text-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
                {activeRoom.image_url ? (
                  <img
                    src={activeRoom.image_url}
                    alt={activeRoom.title || 'Chat'}
                    className="mb-3 h-16 w-16 rounded-2xl object-cover shadow-lg"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl font-heading text-2xl font-bold text-white shadow-lg mb-3"
                    style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))' }}
                  >
                    {activeRoom.title?.[0]?.toUpperCase() ?? '#'}
                  </div>
                )}
                <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  {activeRoom.title || 'Untitled'}
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                  {namedMembers.length} members
                </p>
              </div>

              {/* Members List */}
              <div className="p-4">
                <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-faint)' }}>
                  Members
                </div>
                <div className="space-y-2">
                  {namedMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-[var(--color-surface-hover)]">
                        <div className="relative">
                        {m.avatar ? (
                          <img
                            src={getAvatarUrl(m.avatar)}
                            alt={m.full_name || 'Member'}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-xs font-bold text-indigo-400">
                            {m.full_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        {m.is_online && (
                          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-alt)] bg-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {m.full_name || 'Unknown User'}
                        </div>
                        <div className="text-xs truncate" style={{ color: m.is_online ? 'var(--color-accent-light)' : 'var(--color-text-faint)' }}>
                          {isTeacherRole(m.role) ? 'Teacher' : m.is_online ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {namedMembers.length === 0 && (
                    <div className="text-sm text-center py-4" style={{ color: 'var(--color-text-faint)' }}>
                      No members found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
