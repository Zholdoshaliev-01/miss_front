import { api } from '@/core/api/axios'

/* ─── Join group ─── */

import type { Group } from '@/modules/groups/types'

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function getStudentGroups(params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<Group>>('/student/groups/', { params })
  return data
}

export async function joinGroup(inviteCode: string) {
  const { data } = await api.post<{ detail: string; status: string }>(`/join/${inviteCode}/`)
  return data
}

/* ─── Student materials ─── */

import type { Material } from '@/modules/materials/types'

export async function getStudentMaterials(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<Material>>(`/groups/${groupId}/materials/`, { params })
  return data
}

/* ─── Student homeworks ─── */

export interface StudentHomework {
  id: number
  title: string
  description: string
  file: string
  due_date: string
  created_at: string
  is_submitted: boolean
}

export async function getStudentHomeworks(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<StudentHomework>>(`/student/groups/${groupId}/homeworks/`, { params })
  return data
}

/* ─── Submit homework answer ─── */

export async function submitHomeworkAnswer(homeworkId: number, payload: { file?: File | null; comment?: string }) {
  const formData = new FormData()
  if (payload.file) formData.append('file', payload.file)
  if (payload.comment) formData.append('comment', payload.comment)
  const { data } = await api.post(`/student/homeworks/${homeworkId}/answer/`, formData)
  return data
}

/* ─── Student test ─── */

export async function getStudentTestDetail(testId: number) {
  const { data } = await api.get(`/student/tests/${testId}/`)
  return data
}

export async function startStudentTest(testId: number) {
  const { data } = await api.post(`/student/tests/${testId}/start/`)
  return data
}

export async function submitStudentTest(resultId: number, answers: Record<number, number>) {
  const { data } = await api.post(`/student/test-results/${resultId}/submit/`, { answers })
  return data
}
