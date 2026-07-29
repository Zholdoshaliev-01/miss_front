import axios from 'axios'
import { api } from '@/core/api/axios'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type {
  RoomOut,
  RoomDetailOut,
  RoomCreate,
  MemberCreate,
  MemberOut,
  MessageOut,
  MessageCreate,
  MessageEdit,
  AttachmentOut,
  ReadStateOut,
  ChatUserSummary,
} from './types'

const CHAT_BASE_URL = import.meta.env.VITE_CHAT_API_URL || 'https://chat.kassi.space'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.kassi.space'
let refreshPromise: Promise<string | null> | null = null

export const chatApi = axios.create({
  baseURL: CHAT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Chat service is separate from the main course API. A chat 401/503 should not
// sign the user out of the whole app, so this client only attaches the token.
chatApi.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

async function refreshChatAccessToken() {
  const refresh = useAuthStore.getState().refreshToken
  if (!refresh) return null

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string }>(`${API_BASE_URL}/token/refresh/`, { refresh })
      .then((res) => {
        const access = res.data.access
        useAuthStore.getState().setAccessToken(access)
        return access
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

chatApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    const access = await refreshChatAccessToken()
    if (!access) {
      return Promise.reject(error)
    }

    originalRequest.headers.Authorization = `Bearer ${access}`
    return chatApi(originalRequest)
  },
)

function normalizeAttachment(raw: any): AttachmentOut {
  const rawUrl = raw?.file_url ?? raw?.url ?? ''
  const fileName = raw?.file_name
    ?? (typeof rawUrl === 'string' ? rawUrl.split('/').pop() : '')
    ?? 'attachment'

  return {
    id: Number(raw?.id) || 0,
    file_type: raw?.file_type ?? raw?.type ?? 'file',
    file_url: rawUrl,
    file_name: fileName,
    mime_type: raw?.mime_type ?? raw?.mime ?? '',
    file_size: Number(raw?.file_size ?? raw?.size) || 0,
    duration_sec: raw?.duration_sec ?? null,
    created_at: raw?.created_at ?? new Date().toISOString(),
  }
}

function normalizeMessage(raw: any): MessageOut {
  const senderId = Number(raw?.sender_id ?? raw?.user_id) || 0

  return {
    id: Number(raw?.id) || 0,
    room_id: Number(raw?.room_id) || 0,
    sender_id: senderId,
    sender_name: raw?.sender_name ?? raw?.full_name ?? raw?.username ?? `User #${senderId}`,
    is_teacher: Boolean(raw?.is_teacher),
    text: raw?.text ?? '',
    is_deleted: Boolean(raw?.is_deleted),
    edited_at: raw?.edited_at ?? null,
    created_at: raw?.created_at ?? new Date().toISOString(),
    attachments: Array.isArray(raw?.attachments)
      ? raw.attachments.map(normalizeAttachment)
      : [],
  }
}

function normalizeMember(raw: any): MemberOut {
  const userId = Number(raw?.user_id) || 0

  return {
    id: Number(raw?.id) || userId,
    user_id: userId,
    username: raw?.username,
    email: raw?.email,
    role: raw?.role,
    avatar: raw?.avatar ?? raw?.avatar_url ?? null,
    full_name: raw?.full_name ?? raw?.username ?? `User #${userId}`,
    is_online: Boolean(raw?.is_online),
    joined_at: raw?.joined_at ?? new Date().toISOString(),
    last_seen: raw?.last_seen ?? null,
  }
}

function normalizeChatUser(raw: any): ChatUserSummary | null {
  const id = Number(raw?.id)
  if (!id) return null

  return {
    id,
    username: raw?.username ?? '',
    full_name: raw?.full_name ?? '',
    email: raw?.email ?? '',
    role: raw?.role,
    avatar: raw?.avatar ?? raw?.avatar_url ?? null,
  }
}

export async function getUsersBulk(userIds: number[]) {
  const uniqueIds = [...new Set(userIds.filter((id) => Number.isFinite(id) && id > 0))]
  if (uniqueIds.length === 0) return [] as ChatUserSummary[]

  try {
    const { data } = await api.post('/users/bulk/', { user_ids: uniqueIds })
    const rows = Array.isArray(data) ? data : data?.results ?? []
    return rows
      .map(normalizeChatUser)
      .filter(Boolean) as ChatUserSummary[]
  } catch {
    return [] as ChatUserSummary[]
  }
}

/* ─── Rooms ─── */

export async function getRooms() {
  const { data } = await chatApi.get('/rooms/')
  if (Array.isArray(data)) return data as RoomOut[]
  if (data && Array.isArray(data.results)) return data.results as RoomOut[]
  return [] as RoomOut[]
}

export async function createRoom(payload: RoomCreate) {
  const { data } = await chatApi.post<RoomOut>('/rooms/', payload)
  return data
}

export async function getRoomDetail(groupId: number) {
  const { data } = await chatApi.get<RoomDetailOut>(`/rooms/${groupId}`)
  return data
}

export async function deleteRoom(groupId: number) {
  await chatApi.delete(`/rooms/${groupId}`)
}

/* ─── Members ─── */

export async function addMember(groupId: number, payload: MemberCreate) {
  const { data } = await chatApi.post<MemberOut>(`/groups/${groupId}/members`, payload)
  return data
}

export async function getMembers(groupId: number) {
  const { data } = await chatApi.get(`/groups/${groupId}/members`)
  if (Array.isArray(data)) return data.map(normalizeMember)
  if (data && Array.isArray(data.results)) return data.results.map(normalizeMember)
  return [] as MemberOut[]
}

export async function removeMember(groupId: number, userId: number) {
  await chatApi.delete(`/groups/${groupId}/members/${userId}`)
}

/* ─── Messages ─── */

export async function getMessages(groupId: number, limit = 50, beforeId?: number) {
  const { data } = await chatApi.get(`/groups/${groupId}/messages`, {
    params: { limit, before_id: beforeId },
  })

  if (Array.isArray(data)) return data.map(normalizeMessage)
  if (data && Array.isArray(data.items)) return data.items.map(normalizeMessage)
  if (data && Array.isArray(data.results)) return data.results.map(normalizeMessage)
  if (data && Array.isArray(data.messages)) return data.messages.map(normalizeMessage)

  return [] as MessageOut[]
}

export async function sendMessage(groupId: number, payload: MessageCreate, attachment?: File) {
  if (attachment) {
    const formData = new FormData()
    formData.append('text', payload.text)
    formData.append('file', attachment)
    const { data } = await chatApi.post(`/groups/${groupId}/attachments`, formData)
    return normalizeMessage(data)
  }

  const { data } = await chatApi.post(`/groups/${groupId}/messages`, payload)
  return normalizeMessage(data)
}

export async function editMessage(messageId: number, payload: MessageEdit) {
  const { data } = await chatApi.patch(`/messages/${messageId}`, payload)
  return normalizeMessage(data)
}

export async function deleteMessage(messageId: number) {
  await chatApi.delete(`/messages/${messageId}`)
}

/* ─── Attachments ─── */

export async function uploadAttachment(groupId: number, file: File, text = '') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('text', text)
  const { data } = await chatApi.post(`/groups/${groupId}/attachments`, formData)
  return normalizeAttachment(data)
}

export async function getAttachments(groupId: number, messageId: number) {
  const { data } = await chatApi.get(`/groups/${groupId}/messages/${messageId}/attachments`)
  if (Array.isArray(data)) return data.map(normalizeAttachment)
  return [] as AttachmentOut[]
}

/* ─── Read State ─── */

export async function markAsRead(groupId: number, messageId: number) {
  await chatApi.post(`/chats/${groupId}/read`, null, {
    params: { message_id: messageId },
  })
}

export async function getReadState(groupId: number) {
  const { data } = await chatApi.get<ReadStateOut>(`/chats/${groupId}/read-state`)
  return data
}
