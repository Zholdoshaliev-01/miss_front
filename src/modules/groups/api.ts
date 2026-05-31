import { api } from '@/core/api/axios'
import type { Group } from './types'

/* ─── Paginated response wrapper ─── */
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/* ─── Groups CRUD (GroupViewSet) ─── */

export async function getGroups(params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<Group>>('/groups/', { params })
  return data
}

export async function getGroupDetail(groupId: number) {
  const { data } = await api.get<Group>(`/groups/${groupId}/`)
  return data
}

export async function createGroup(payload: { group_name: string; group_image?: File | null; level: string }) {
  const formData = new FormData()
  formData.append('group_name', payload.group_name)
  formData.append('level', payload.level)
  if (payload.group_image) {
    formData.append('group_image', payload.group_image)
  }
  const { data } = await api.post<Group>('/groups/', formData)
  return data
}

export async function updateGroup(groupId: number, payload: Partial<{ group_name: string; group_image: File | null; level: string }>) {
  const formData = new FormData()
  if (payload.group_name !== undefined) formData.append('group_name', payload.group_name)
  if (payload.level !== undefined) formData.append('level', payload.level)
  if (payload.group_image) formData.append('group_image', payload.group_image)
  const { data } = await api.patch<Group>(`/groups/${groupId}/`, formData)
  return data
}

export async function deleteGroup(groupId: number) {
  await api.delete(`/groups/${groupId}/`)
}

/* ─── Group nested resources ─── */

import type { Student } from '@/modules/students/types'

export async function getGroupStudents(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<Student>>(`/groups/${groupId}/students/`, { params })
  return data
}

export async function getPendingStudents(groupId: number) {
  const { data } = await api.get<PaginatedResponse<Student>>(`/groups/${groupId}/requests/`)
  return data
}

export async function approveStudent(studentId: number) {
  const { data } = await api.patch(`/students/${studentId}/approve/`)
  return data
}

export async function rejectStudent(studentId: number) {
  const { data } = await api.patch(`/students/${studentId}/reject/`)
  return data
}

/* ─── Leaderboard ─── */

export interface LeaderboardEntry {
  student_id: number
  full_name: string
  email: string
  group_id?: number
  group_name?: string
  tests_total_score: number
  homeworks_done: number
  rating_points: number
}

export async function getGroupLeaderboard(groupId: number) {
  const { data } = await api.get<PaginatedResponse<LeaderboardEntry>>(`/groups/${groupId}/leaderboard/`)
  return data
}

export async function getGlobalLeaderboard() {
  const { data } = await api.get<PaginatedResponse<LeaderboardEntry>>('/leaderboard/')
  return data
}
