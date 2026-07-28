import { api } from '@/core/api/axios'
import type { Rating } from './types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function getRatings(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<Rating>>(`/groups/${groupId}/ratings/`, { params })
  return data
}

export async function createRating(payload: { group: number; student: number; rank: number; note?: string }) {
  const { data } = await api.post<Rating>('/ratings/', payload)
  return data
}

export async function updateRating(ratingId: number, payload: Partial<{ rank: number; note: string }>) {
  const { data } = await api.patch<Rating>(`/ratings/${ratingId}/`, payload)
  return data
}

export async function deleteRating(ratingId: number) {
  await api.delete(`/ratings/${ratingId}/`)
}
