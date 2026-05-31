import axios from 'axios'
import { applyAuthInterceptors } from '@/core/api/axios'
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
} from './types'

const CHAT_BASE_URL = import.meta.env.VITE_CHAT_API_URL

export const chatApi = axios.create({
  baseURL: CHAT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Apply shared auth interceptors (token attach + 401 refresh + FormData handling)
applyAuthInterceptors(chatApi)

/* ─── Rooms ─── */

export async function getRooms() {
  const { data } = await chatApi.get('/rooms/')
  // API may return array directly or paginated { results: [...] }
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
  const { data } = await chatApi.get<MemberOut[]>(`/groups/${groupId}/members`)
  return data
}

export async function removeMember(groupId: number, userId: number) {
  await chatApi.delete(`/groups/${groupId}/members/${userId}`)
}

/* ─── Messages ─── */

export async function getMessages(groupId: number, limit = 50, beforeId?: number) {
  const { data } = await chatApi.get(`/groups/${groupId}/messages`, {
    params: { limit, before_id: beforeId },
  })
  
  if (Array.isArray(data)) return data as MessageOut[]
  if (data && Array.isArray(data.items)) return data.items as MessageOut[]
  if (data && Array.isArray(data.results)) return data.results as MessageOut[]
  if (data && Array.isArray(data.messages)) return data.messages as MessageOut[]
  
  return [] as MessageOut[]
}

export async function sendMessage(groupId: number, payload: MessageCreate, attachment?: File) {
  if (attachment) {
    const formData = new FormData()
    formData.append('text', payload.text)
    formData.append('attachments', attachment)
    const { data } = await chatApi.post<MessageOut>(`/groups/${groupId}/messages`, formData)
    return data
  }
  
  const { data } = await chatApi.post<MessageOut>(`/groups/${groupId}/messages`, payload)
  return data
}

export async function editMessage(messageId: number, payload: MessageEdit) {
  const { data } = await chatApi.patch<MessageOut>(`/messages/${messageId}`, payload)
  return data
}

export async function deleteMessage(messageId: number) {
  await chatApi.delete(`/messages/${messageId}`)
}

/* ─── Attachments ─── */

export async function uploadAttachment(groupId: number, file: File, text = '') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('text', text)
  const { data } = await chatApi.post<AttachmentOut>(`/groups/${groupId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getAttachments(groupId: number, messageId: number) {
  const { data } = await chatApi.get<AttachmentOut[]>(`/groups/${groupId}/messages/${messageId}/attachments`)
  return data
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
