import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquarePlus,
  Loader2,
  MessagesSquare,
  ChevronLeft,
  ChevronDown,
  Info,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import ChatSidebar from '../components/ChatSidebar'
import MessageItem from '../components/MessageItem'
import type { MessageAttachment } from '../components/MessageItem'
import MessageInput from '../components/MessageInput'
import {
  getMessages,
  uploadAttachment,
  getMembers,
  getReadState,
  getUsersBulk,
  markAsRead,
  sortMessagesChronologically,
} from '../api'
import type { RoomOut, MessageOut, ChatUserSummary, MemberOut } from '../types'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useChatScroll } from '../hooks/useChatScroll'
import { buildMediaUrl } from '@/shared/utils/buildMediaUrl'
import { useChatWebSocket } from '../hooks/useChatWebSocket'

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
  const accessToken = useAuthStore((s) => s.accessToken)
  const authUserId = Number(user?.id) || 0
  const isTeacher = isTeacherRole(user?.role)
  const queryClient = useQueryClient()
  const [activeRoom, setActiveRoom] = useState<RoomOut | null>(null)

  // Optimistic messages + their attachments
  const [optimisticMessages, setOptimisticMessages] = useState<MessageOut[]>([])
  const [attachmentMap, setAttachmentMap] = useState<Record<number, MessageAttachment>>({})
  const [readReceipts, setReadReceipts] = useState<Record<number, Record<number, number>>>({})

  // Right sidebar details state
  const [showDetails, setShowDetails] = useState(false)

  // Pagination
  const oldestMsgIdRef = useRef<number | null>(null)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)

  /* ─── Queries ─── */

  const { data: serverMessages = [], isLoading: messagesLoading, isSuccess: historyLoaded } = useQuery<MessageOut[]>({
    queryKey: ['chat-messages', activeRoom?.group_id],
    queryFn: () => getMessages(activeRoom!.group_id),
    enabled: !!activeRoom,
    staleTime: 0,
  })

  const { data: members = [] } = useQuery<MemberOut[]>({
    queryKey: ['chat-members', activeRoom?.group_id],
    queryFn: () => getMembers(activeRoom!.group_id),
    enabled: !!activeRoom,
  })

  const { data: initialReadState = [] } = useQuery({
    queryKey: ['chat-read-state', activeRoom?.group_id],
    queryFn: () => getReadState(activeRoom!.group_id),
    enabled: !!activeRoom,
    staleTime: 0,
  })

  useEffect(() => {
    if (!activeRoom || initialReadState.length === 0) return
    setReadReceipts((previous) => ({
      ...previous,
      [activeRoom.group_id]: initialReadState.reduce<Record<number, number>>((state, entry) => {
        if (entry.user_id > 0 && entry.last_read_message_id != null) {
          state[entry.user_id] = entry.last_read_message_id
        }
        return state
      }, { ...previous[activeRoom.group_id] }),
    }))
  }, [activeRoom, initialReadState])

  const chatUserIds = useMemo(() => {
    const ids = [
      ...serverMessages.map((m) => m.sender_id),
      ...optimisticMessages.map((m) => m.sender_id),
      ...members.map((m) => m.user_id),
      authUserId,
    ]
    return [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))].sort((a, b) => a - b)
  }, [serverMessages, optimisticMessages, members, authUserId])

  const { data: chatUsers = [] } = useQuery<ChatUserSummary[]>({
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

  const handleSocketMessage = useCallback((message: MessageOut, eventGroupId?: number) => {
    const selectedRoom = activeRoom
    const messageGroupId = eventGroupId || message.group_id
      || (selectedRoom && (message.room_id === selectedRoom.id || message.room_id === selectedRoom.group_id)
        ? selectedRoom.group_id
        : undefined)
    if (!messageGroupId) return

    queryClient.setQueryData<MessageOut[]>(['chat-messages', messageGroupId], (previous = []) => {
      if (previous.some((existing) => existing.id === message.id)) return previous
      return sortMessagesChronologically([...previous, message])
    })

    if (messageGroupId === selectedRoom?.group_id && message.sender_id === currentUserId) {
      setOptimisticMessages((previous) => {
        const matchingIndex = previous.findIndex((item) => (
          item.id === message.id || (item.id < 0 && item.text === message.text)
        ))
        return matchingIndex < 0 ? previous : previous.filter((_, index) => index !== matchingIndex)
      })
    }
  }, [activeRoom, currentUserId, queryClient])

  const handleMessageStatus = useCallback((messageId: number, status: string) => {
    if (!activeRoom) return
    queryClient.setQueryData<MessageOut[]>(['chat-messages', activeRoom.group_id], (previous = []) => (
      previous.map((message) => message.id === messageId ? { ...message, status } : message)
    ))
    setOptimisticMessages((previous) => {
      const exactMatch = previous.some((message) => message.id === messageId)
      let pendingUpdated = false
      return previous.map((message) => {
        if (message.id === messageId) return { ...message, status }
        if (!exactMatch && !pendingUpdated && message.id < 0) {
          pendingUpdated = true
          return { ...message, id: messageId, status }
        }
        return message
      })
    })
  }, [activeRoom, queryClient])

  const handleMessageEdited = useCallback((
    messageId: number,
    changes: { text?: string; edited_at?: string | null },
    eventGroupId?: number,
  ) => {
    const groupId = eventGroupId ?? activeRoom?.group_id
    if (!groupId) return
    queryClient.setQueryData<MessageOut[]>(['chat-messages', groupId], (previous = []) => (
      previous.map((message) => {
        if (message.id !== messageId) return message
        return {
          ...message,
          text: changes.text ?? message.text,
          edited_at: changes.edited_at === undefined ? message.edited_at : changes.edited_at,
        }
      })
    ))
  }, [activeRoom, queryClient])

  const handleMessageDeleted = useCallback((messageId: number, eventGroupId?: number) => {
    const groupId = eventGroupId ?? activeRoom?.group_id
    if (!groupId) return
    queryClient.setQueryData<MessageOut[]>(['chat-messages', groupId], (previous = []) => (
      previous.map((message) => message.id === messageId
        ? { ...message, text: '', is_deleted: true, attachments: [] }
        : message)
    ))
  }, [activeRoom, queryClient])

  const handleReadReceipt = useCallback((groupId: number, readerId: number, lastReadMessageId: number) => {
    setReadReceipts((previous) => ({
      ...previous,
      [groupId]: {
        ...previous[groupId],
        [readerId]: Math.max(previous[groupId]?.[readerId] ?? 0, lastReadMessageId),
      },
    }))
  }, [])

  const { isConnected, sendMessage: sendSocketMessage, sendRead } = useChatWebSocket({
    enabled: Boolean(activeRoom && historyLoaded && accessToken),
    groupId: activeRoom?.group_id ?? null,
    onMessage: handleSocketMessage,
    onMessageStatus: handleMessageStatus,
    onMessageEdited: handleMessageEdited,
    onMessageDeleted: handleMessageDeleted,
    onReadReceipt: handleReadReceipt,
    onError: (detail) => toast.error(detail),
  })

  const userById = useMemo(() => {
    const map = new Map<number, ChatUserSummary>()
    chatUsers.forEach((chatUser) => map.set(chatUser.id, chatUser))
    if (currentUserId) {
      const existing = map.get(currentUserId)
      map.set(currentUserId, {
        id: currentUserId,
        username: existing?.username || user?.username || '',
        full_name: existing?.full_name || user?.full_name || '',
        email: existing?.email || user?.email || '',
        role: existing?.role || user?.role as ChatUserSummary['role'],
        avatar: existing?.avatar || user?.avatar || null,
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
    const pendingOptimistic = optimisticMessages.filter((om) => !serverIds.has(om.id))
    return sortMessagesChronologically([...namedServerMessages, ...pendingOptimistic])
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
          (prev = []) => {
            const byId = new Map(prev.map((message) => [message.id, message]))
            older.forEach((message) => byId.set(message.id, message))
            return sortMessagesChronologically([...byId.values()])
          },
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

  const sendAttachmentMut = useMutation({
    mutationFn: ({ text, file, groupId }: { text: string; file: File; groupId: number; optimisticId: number }) =>
      uploadAttachment(groupId, file, text),
    onSuccess: async (_, { file, groupId, optimisticId }) => {
      await queryClient.refetchQueries({ queryKey: ['chat-messages', groupId], exact: true })
      setOptimisticMessages((prev) => prev.filter((message) => message.id !== optimisticId))
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
    },
    onError: (_, { optimisticId }) => {
      setOptimisticMessages((previous) => previous.filter((message) => message.id !== optimisticId))
      setAttachmentMap((previous) => {
        const attachment = previous[optimisticId]
        if (attachment?.localPreviewUrl) URL.revokeObjectURL(attachment.localPreviewUrl)
        const updated = { ...previous }
        delete updated[optimisticId]
        return updated
      })
      toast.error('Failed to send message')
    },
  })

  const handleSend = useCallback(
    (text: string, file?: File) => {
      if (!activeRoom) return

      const trimmed = text.trim()
      if (trimmed.length > 5_000) {
        toast.error('Message must be 5000 characters or fewer')
        return
      }
      if (!file && !trimmed) return
      if (!file && !sendSocketMessage(activeRoom.group_id, trimmed)) {
        toast.error('Chat is reconnecting. Please try again.')
        return
      }

      const msgId = --optimisticIdCounter

      // Create optimistic message
      const optimistic: MessageOut = {
        id: msgId,
        room_id: activeRoom.id,
        sender_id: currentUserId,
        sender_name: currentChatUser?.username || user?.username || 'You',
        sender_avatar: currentChatUser?.avatar ?? user?.avatar ?? null,
        is_teacher: isTeacher,
        text: trimmed,
        is_deleted: false,
        edited_at: null,
        created_at: new Date().toISOString(),
        status: 'pending',
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

      if (file) sendAttachmentMut.mutate({
        text: trimmed,
        file,
        groupId: activeRoom.group_id,
        optimisticId: msgId,
      })
    },
    [activeRoom, currentUserId, currentChatUser, user, isTeacher, forceScrollToBottom, sendSocketMessage, sendAttachmentMut],
  )

  const lastReadSentRef = useRef<Record<number, number>>({})
  useEffect(() => {
    if (!activeRoom) return
    const latestMessage = [...serverMessages].reverse().find((message) => message.id > 0)
    if (!latestMessage || (lastReadSentRef.current[activeRoom.group_id] ?? 0) >= latestMessage.id) return

    const groupId = activeRoom.group_id
    lastReadSentRef.current[groupId] = latestMessage.id
    if (sendRead(activeRoom.group_id, latestMessage.id)) {
      return
    }

    void markAsRead(groupId, latestMessage.id).catch(() => {
      if (lastReadSentRef.current[groupId] === latestMessage.id) delete lastReadSentRef.current[groupId]
    })
  }, [activeRoom, isConnected, sendRead, serverMessages])

  /* ─── Room change ─── */

  const handleSelectRoom = useCallback(
    (room: RoomOut) => {
      Object.values(attachmentMap).forEach((att) => {
        if (att.localPreviewUrl) URL.revokeObjectURL(att.localPreviewUrl)
      })
      setActiveRoom(room)
      setShowDetails(false)
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
          <ChatSidebar
            activeRoomId={activeRoom?.id ?? null}
            latestActiveMessage={namedServerMessages.at(-1) ?? null}
            onSelectRoom={handleSelectRoom}
          />
        </div>

        {!activeRoom && (
          <div className="w-full md:hidden" style={{ background: 'var(--color-bg-alt)' }}>
            <ChatSidebar
              activeRoomId={null}
              latestActiveMessage={null}
              onSelectRoom={handleSelectRoom}
            />
          </div>
        )}

        {/* Main chat area */}
        <div className={`${activeRoom ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
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
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setActiveRoom(null)
                      setShowDetails(false)
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-hover)] md:hidden"
                    style={{ color: 'var(--color-text-muted)' }}
                    aria-label="Back to chat rooms"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
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
                          isRead={Boolean(
                            currentUserId
                            && Object.entries(readReceipts[activeRoom.group_id] ?? {}).some(
                              ([readerId, lastReadId]) => Number(readerId) !== currentUserId && lastReadId >= msg.id,
                            )
                          )}
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
                isPending={sendAttachmentMut.isPending}
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
            className="hidden w-72 shrink-0 flex-col border-l transition-all duration-300 z-10 relative md:flex"
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
