import { api } from '@/core/api/axios'

export interface AppNotification {
  id: number
  title: string
  message: string
  type: 'info' | 'material' | 'homework' | 'test' | string
  is_read: boolean
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

function normalizeNotifications(data: PaginatedResponse<AppNotification> | AppNotification[]) {
  return Array.isArray(data) ? data : data.results ?? []
}

export async function getNotifications(params?: { unread?: boolean }) {
  const { data } = await api.get<PaginatedResponse<AppNotification> | AppNotification[]>('/notifications/', {
    params: params?.unread ? { unread: 'true' } : undefined,
  })
  return normalizeNotifications(data)
}

export async function markNotificationRead(id: number) {
  const { data } = await api.patch<AppNotification>(`/notifications/${id}/read/`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch<{ detail: string }>('/notifications/read-all/')
  return data
}
