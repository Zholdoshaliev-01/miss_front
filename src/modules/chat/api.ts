import axios from 'axios'
import { api } from '@/core/api/axios'
import { CHAT_API_BASE_URL, DJANGO_API_BASE_URL } from '@/core/config/api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type { AttachmentOut, AttachmentUploadResponse, ChatUserSummary, MemberOut, MessageCreate, MessageEdit, MessageOut, ReadStateOut, RoomOut } from './types'

let refreshPromise: Promise<string | null> | null = null
type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {}
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeChatDateTime(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return new Date().toISOString()
  const dateTime = value.trim()
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateTime) ? dateTime : `${dateTime}Z`
}

export const chatApi = axios.create({
  baseURL: CHAT_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Chat failures must not sign the user out of Django. This client refreshes the
// shared Django JWT, but leaves global sign-out decisions to the main client.
chatApi.interceptors.request.use((config) => {
  if (config.data instanceof FormData) delete config.headers['Content-Type']
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

async function refreshChatAccessToken() {
  const refresh = useAuthStore.getState().refreshToken
  if (!refresh) return null
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string }>(`${DJANGO_API_BASE_URL}/token/refresh/`, { refresh })
      .then((response) => {
        const access = response.data.access
        useAuthStore.getState().setAccessToken(access)
        return access
      })
      .catch(() => null)
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

chatApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) return Promise.reject(error)
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    if (originalRequest._retry) return Promise.reject(error)
    originalRequest._retry = true
    const access = await refreshChatAccessToken()
    if (!access) return Promise.reject(error)
    originalRequest.headers.Authorization = `Bearer ${access}`
    return chatApi(originalRequest)
  },
)

function normalizeAttachment(value: unknown): AttachmentOut {
  const raw = asRecord(value)
  const rawUrl = stringValue(raw.file_url ?? raw.url)
  const originalName = typeof raw.original_name === 'string' ? raw.original_name : undefined
  return {
    id: Number(raw.id) || 0,
    file_type: stringValue(raw.file_type ?? raw.type, 'file'),
    file_url: rawUrl,
    file_name: originalName || (typeof raw.url === 'string' ? raw.url.split('/').pop() : undefined) || rawUrl.split('/').pop() || 'File',
    original_name: originalName,
    url: typeof raw.url === 'string' ? raw.url : undefined,
    mime_type: stringValue(raw.mime_type ?? raw.mime),
    file_size: Number(raw.file_size ?? raw.size) || 0,
    duration_sec: raw.duration_sec == null ? null : Number(raw.duration_sec),
    created_at: normalizeChatDateTime(raw.created_at),
  }
}

export function normalizeMessage(value: unknown): MessageOut {
  const raw = asRecord(value)
  const senderId = Number(raw.sender_id ?? raw.user_id) || 0
  return {
    id: Number(raw.id) || 0,
    room_id: Number(raw.room_id) || 0,
    group_id: Number(raw.group_id) || undefined,
    sender_id: senderId,
    sender_name: stringValue(raw.sender_name ?? raw.full_name ?? raw.username, `User #${senderId}`),
    sender_avatar: typeof raw.sender_avatar === 'string' ? raw.sender_avatar : null,
    is_teacher: Boolean(raw.is_teacher),
    text: stringValue(raw.text),
    is_deleted: Boolean(raw.is_deleted),
    edited_at: typeof raw.edited_at === 'string' ? raw.edited_at : null,
    created_at: normalizeChatDateTime(raw.created_at),
    status: typeof raw.status === 'string' ? raw.status : undefined,
    attachments: Array.isArray(raw.attachments) ? raw.attachments.map(normalizeAttachment) : [],
  }
}

export function sortMessagesChronologically(messages: MessageOut[]): MessageOut[] {
  return [...messages].sort((left, right) => {
    const difference = new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    return difference || left.id - right.id
  })
}

export async function getWebSocketTicket(): Promise<string> {
  const accessToken = useAuthStore.getState().accessToken
  if (!accessToken) throw new Error('Authentication is required')
  const { data } = await chatApi.post<{ ticket?: string }>('/ws-ticket', undefined, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!data.ticket) throw new Error('WebSocket ticket was not returned')
  return data.ticket
}

function normalizeMember(value: unknown): MemberOut {
  const raw = asRecord(value)
  const userId = Number(raw.user_id) || 0
  return {
    id: Number(raw.id) || userId,
    user_id: userId,
    username: typeof raw.username === 'string' ? raw.username : undefined,
    email: typeof raw.email === 'string' ? raw.email : undefined,
    role: raw.role === 'teacher' || raw.role === 'student' ? raw.role : undefined,
    avatar: stringValue(raw.avatar ?? raw.avatar_url) || null,
    full_name: stringValue(raw.full_name ?? raw.username, `User #${userId}`),
    is_online: Boolean(raw.is_online),
    joined_at: stringValue(raw.joined_at, new Date().toISOString()),
    last_seen: typeof raw.last_seen === 'string' ? raw.last_seen : null,
  }
}

function normalizeChatUser(value: unknown): ChatUserSummary | null {
  const raw = asRecord(value)
  const id = Number(raw.id)
  if (!id) return null
  return {
    id,
    username: stringValue(raw.username),
    full_name: stringValue(raw.full_name),
    email: stringValue(raw.email),
    role: raw.role === 'teacher' || raw.role === 'student' ? raw.role : undefined,
    avatar: stringValue(raw.avatar ?? raw.avatar_url) || null,
  }
}

export async function getUsersBulk(userIds: number[]) {
  const uniqueIds = [...new Set(userIds.filter((id) => Number.isFinite(id) && id > 0))]
  if (uniqueIds.length === 0) return [] as ChatUserSummary[]
  try {
    const { data } = await api.post<unknown>('/users/bulk/', { user_ids: uniqueIds })
    const record = asRecord(data)
    const rows = Array.isArray(data) ? data : Array.isArray(record.results) ? record.results : []
    return rows.map(normalizeChatUser).filter((user): user is ChatUserSummary => user !== null)
  } catch {
    return [] as ChatUserSummary[]
  }
}

export async function getRooms() {
  const { data } = await chatApi.get<unknown>('/rooms/')
  const record = asRecord(data)
  if (Array.isArray(data)) return data as RoomOut[]
  if (Array.isArray(record.results)) return record.results as RoomOut[]
  return [] as RoomOut[]
}

export async function getMembers(groupId: number) {
  const { data } = await chatApi.get<unknown>(`/groups/${groupId}/members`)
  const record = asRecord(data)
  if (Array.isArray(data)) return data.map(normalizeMember)
  if (Array.isArray(record.results)) return record.results.map(normalizeMember)
  return [] as MemberOut[]
}

export async function getMessages(groupId: number, limit = 50, beforeId?: number) {
  const { data } = await chatApi.get<unknown>(`/groups/${groupId}/messages`, { params: { limit, before_id: beforeId } })
  const record = asRecord(data)
  const rows = Array.isArray(data) ? data
    : Array.isArray(record.items) ? record.items
      : Array.isArray(record.results) ? record.results
        : Array.isArray(record.messages) ? record.messages : []
  return sortMessagesChronologically(rows.map(normalizeMessage))
}

export async function sendMessage(groupId: number, payload: MessageCreate) {
  const { data } = await chatApi.post<unknown>(`/groups/${groupId}/messages`, payload)
  return normalizeMessage(data)
}

export async function editMessage(messageId: number, payload: MessageEdit) {
  const { data } = await chatApi.patch<unknown>(`/messages/${messageId}`, payload)
  return normalizeMessage(data)
}

export async function deleteMessage(messageId: number) {
  await chatApi.delete(`/messages/${messageId}`)
}

export async function uploadAttachment(groupId: number, file: File, text = ''): Promise<AttachmentUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('text', text)
  const { data } = await chatApi.post<{ message_id: number; attachment: unknown }>(`/groups/${groupId}/attachments`, formData)
  return { message_id: Number(data.message_id), attachment: normalizeAttachment(data.attachment) }
}

export async function getAttachments(groupId: number, messageId: number) {
  const { data } = await chatApi.get<unknown>(`/groups/${groupId}/messages/${messageId}/attachments`)
  const record = asRecord(data)
  if (Array.isArray(data)) return data.map(normalizeAttachment)
  if (Array.isArray(record.results)) return record.results.map(normalizeAttachment)
  return [] as AttachmentOut[]
}

export async function markAsRead(groupId: number, messageId: number) {
  await chatApi.post(`/chats/${groupId}/read`, null, { params: { message_id: messageId } })
}

export async function getReadState(groupId: number) {
  const { data } = await chatApi.get<unknown>(`/chats/${groupId}/read-state`)
  const record = asRecord(data)
  const rows = Array.isArray(data) ? data
    : Array.isArray(record.results) ? record.results
      : Array.isArray(record.read_states) ? record.read_states
        : Object.keys(record).length > 0 ? [record] : []
  return rows.map((value): ReadStateOut => {
    const state = asRecord(value)
    return {
      id: Number(state.id) || 0,
      room_id: Number(state.room_id) || 0,
      user_id: Number(state.user_id ?? state.reader_id) || 0,
      last_read_message_id: state.last_read_message_id == null ? null : Number(state.last_read_message_id),
      updated_at: stringValue(state.updated_at),
    }
  })
}
