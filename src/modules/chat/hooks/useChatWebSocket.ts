import { useCallback, useEffect, useRef, useState } from 'react'
import { getWebSocketTicket, normalizeMessage } from '../api'
import type { MessageOut } from '../types'
import { CHAT_API_BASE_URL } from '@/core/config/api'

const RECONNECT_DELAYS = [1_000, 2_000, 4_000, 8_000, 10_000]

interface Options {
  enabled: boolean
  groupId: number | null
  onMessage: (message: MessageOut, eventGroupId?: number) => void
  onMessageStatus: (messageId: number, status: string) => void
  onMessageEdited: (messageId: number, changes: { text?: string; edited_at?: string | null }, eventGroupId?: number) => void
  onMessageDeleted: (messageId: number, eventGroupId?: number) => void
  onReadReceipt: (groupId: number, readerId: number, lastReadMessageId: number) => void
  onError: (detail: string) => void
}

export function useChatWebSocket({
  enabled,
  groupId,
  onMessage,
  onMessageStatus,
  onMessageEdited,
  onMessageDeleted,
  onReadReceipt,
  onError,
}: Options) {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const generationRef = useRef(0)
  const groupIdRef = useRef(groupId)
  const handlersRef = useRef({ onMessage, onMessageStatus, onMessageEdited, onMessageDeleted, onReadReceipt, onError })
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    groupIdRef.current = groupId
    handlersRef.current = { onMessage, onMessageStatus, onMessageEdited, onMessageDeleted, onReadReceipt, onError }
  }, [groupId, onError, onMessage, onMessageDeleted, onMessageEdited, onMessageStatus, onReadReceipt])

  const sendJson = useCallback((payload: object) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(payload))
    return true
  }, [])

  useEffect(() => {
    if (!enabled) return

    let stopped = false
    const generation = ++generationRef.current

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const scheduleReconnect = () => {
      if (stopped || generation !== generationRef.current || reconnectTimerRef.current) return
      const index = Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)
      reconnectAttemptRef.current += 1
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null
        void connect()
      }, RECONNECT_DELAYS[index])
    }

    const connect = async () => {
      if (stopped || generation !== generationRef.current) return

      try {
        const ticket = await getWebSocketTicket()
        if (stopped || generation !== generationRef.current) return

        const wsBase = CHAT_API_BASE_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
        const socket = new WebSocket(`${wsBase}/ws/messages?ticket=${encodeURIComponent(ticket)}`)
        socketRef.current = socket

        socket.onmessage = (messageEvent) => {
          let data: {
            event?: string
            message?: unknown
            group_id?: unknown
            message_id?: unknown
            status?: unknown
            reader_id?: unknown
            last_read_message_id?: unknown
            text?: unknown
            edited_at?: unknown
            detail?: unknown
          }
          try {
            data = JSON.parse(messageEvent.data) as typeof data
          } catch {
            handlersRef.current.onError('Invalid response from chat server')
            return
          }

          if (data.event === 'connected') {
            reconnectAttemptRef.current = 0
            setIsConnected(true)
            const activeGroupId = groupIdRef.current
            if (activeGroupId != null) {
              socket.send(JSON.stringify({ action: 'set_active_chat', group_id: Number(activeGroupId) }))
            }
          } else if (data.event === 'message' && data.message) {
            handlersRef.current.onMessage(normalizeMessage(data.message), Number(data.group_id) || undefined)
          } else if (data.event === 'message_status') {
            handlersRef.current.onMessageStatus(Number(data.message_id), String(data.status ?? 'sent'))
          } else if (data.event === 'message_edited') {
            const rawMessage = data.message && typeof data.message === 'object'
              ? data.message as Record<string, unknown>
              : data as Record<string, unknown>
            const messageId = Number(rawMessage.id ?? data.message_id)
            if (messageId) {
              handlersRef.current.onMessageEdited(messageId, {
                text: typeof rawMessage.text === 'string' ? rawMessage.text : undefined,
                edited_at: typeof rawMessage.edited_at === 'string'
                  ? rawMessage.edited_at
                  : rawMessage.edited_at === null ? null : undefined,
              }, Number(data.group_id ?? rawMessage.group_id) || groupIdRef.current || undefined)
            }
          } else if (data.event === 'message_deleted') {
            const rawMessage = data.message && typeof data.message === 'object'
              ? data.message as Record<string, unknown>
              : {}
            const messageId = Number(rawMessage.id ?? data.message_id)
            if (messageId) {
              handlersRef.current.onMessageDeleted(
                messageId,
                Number(data.group_id ?? rawMessage.group_id) || groupIdRef.current || undefined,
              )
            }
          } else if (data.event === 'read_receipt') {
            handlersRef.current.onReadReceipt(
              Number(data.group_id),
              Number(data.reader_id),
              Number(data.last_read_message_id),
            )
          } else if (data.event === 'error') {
            handlersRef.current.onError(String(data.detail || 'Chat error'))
          }
        }

        socket.onclose = () => {
          if (socketRef.current === socket) socketRef.current = null
          setIsConnected(false)
          scheduleReconnect()
        }
        socket.onerror = () => {
          // Closing funnels retries through the single onclose path.
          socket.close()
        }
      } catch {
        setIsConnected(false)
        scheduleReconnect()
      }
    }

    void connect()

    return () => {
      stopped = true
      generationRef.current += 1
      clearReconnectTimer()
      reconnectAttemptRef.current = 0
      setIsConnected(false)
      const socket = socketRef.current
      socketRef.current = null
      if (socket) {
        socket.onopen = null
        socket.onmessage = null
        socket.onerror = null
        socket.onclose = null
        socket.close()
      }
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || groupId == null) return
    sendJson({ action: 'set_active_chat', group_id: Number(groupId) })
  }, [enabled, groupId, sendJson])

  const sendMessage = useCallback((activeGroupId: number, text: string) => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > 5_000) return false
    return sendJson({ action: 'send_message', group_id: Number(activeGroupId), text: trimmed })
  }, [sendJson])

  const sendRead = useCallback((activeGroupId: number, messageId: number) => (
    sendJson({ action: 'read', group_id: Number(activeGroupId), message_id: Number(messageId) })
  ), [sendJson])

  return { isConnected, sendMessage, sendRead }
}
