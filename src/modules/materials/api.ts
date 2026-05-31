import { api } from '@/core/api/axios'
import type { Material } from './types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/* ─── Teacher endpoints ─── */

export async function getMaterials(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<Material>>(`/groups/${groupId}/materials/`, { params })
  return data
}

export async function getMaterialDetail(materialId: number) {
  const { data } = await api.get<Material>(`/materials/${materialId}/`)
  return data
}

export async function createMaterial(payload: { group: number; title: string; description?: string; file?: File | null }) {
  const formData = new FormData()
  formData.append('group', String(payload.group))
  formData.append('title', payload.title)
  if (payload.description) formData.append('description', payload.description)
  if (payload.file) formData.append('file', payload.file)
  const { data } = await api.post<Material>('/materials/', formData)
  return data
}

export async function updateMaterial(materialId: number, payload: Partial<{ title: string; description: string; file: File | null }>) {
  const formData = new FormData()
  if (payload.title !== undefined) formData.append('title', payload.title)
  if (payload.description !== undefined) formData.append('description', payload.description)
  if (payload.file) formData.append('file', payload.file)
  const { data } = await api.patch<Material>(`/materials/${materialId}/`, formData)
  return data
}

export async function deleteMaterial(materialId: number) {
  await api.delete(`/materials/${materialId}/`)
}

/* ─── Student endpoints ─── */

export async function getStudentMaterials(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<Material>>(`/student/groups/${groupId}/materials/`, { params })
  return data
}
