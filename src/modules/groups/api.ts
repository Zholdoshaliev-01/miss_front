import { api } from '@/core/api/axios'
import { getAllPages, type PaginatedResponse } from '@/core/api/pagination'
import type { Group } from './types'

/* ─── Groups CRUD (GroupViewSet) ─── */

export async function getGroups(params?: Record<string, string>) {
  return getAllPages<Group>(api, '/groups/', params)
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
  const { data } = await api.get<PaginatedResponse<Student> | Student[]>(`/groups/${groupId}/students/`, { params })
  return data
}

export async function getAllGroupStudents(groupId: number) {
  const data = await getAllPages<Student>(api, `/groups/${groupId}/students/`)
  return data.results
}

export async function getPendingStudents(groupId: number) {
  return getAllPages<Student>(api, `/groups/${groupId}/requests/`)
}

export async function approveStudent(studentId: number) {
  const { data } = await api.patch(`/students/${studentId}/approve/`)
  return data
}

export async function rejectStudent(studentId: number) {
  const { data } = await api.patch(`/students/${studentId}/reject/`)
  return data
}

export async function expelStudent(studentMembershipId: number) {
  const { data } = await api.patch(`/students/${studentMembershipId}/expel/`)
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
  return getAllPages<LeaderboardEntry>(api, `/groups/${groupId}/leaderboard/`)
}

export async function getGlobalLeaderboard() {
  return getAllPages<LeaderboardEntry>(api, '/leaderboard/')
}
