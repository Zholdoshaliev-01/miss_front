import { api } from '@/core/api/axios'
import type { Homework, HomeworkAnswer, Review } from './types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/* ─── Teacher: Homework CRUD ─── */

export async function getHomeworks(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<Homework>>(`/groups/${groupId}/homeworks/`, { params })
  return data
}

export async function getHomeworkDetail(homeworkId: number) {
  const { data } = await api.get<Homework>(`/homeworks/${homeworkId}/`)
  return data
}

export async function createHomework(payload: { group: number; title: string; description?: string; file?: File | null; due_date?: string }) {
  const formData = new FormData()
  formData.append('group', String(payload.group))
  formData.append('title', payload.title)
  if (payload.description) formData.append('description', payload.description)
  if (payload.file) formData.append('file', payload.file)
  if (payload.due_date) formData.append('due_date', payload.due_date)
  const { data } = await api.post<Homework>('/homeworks/', formData)
  return data
}

export async function updateHomework(homeworkId: number, payload: Partial<{ title: string; description: string; file: File | null; due_date: string }>) {
  const formData = new FormData()
  if (payload.title !== undefined) formData.append('title', payload.title)
  if (payload.description !== undefined) formData.append('description', payload.description)
  if (payload.file) formData.append('file', payload.file)
  if (payload.due_date !== undefined) formData.append('due_date', payload.due_date)
  const { data } = await api.patch<Homework>(`/homeworks/${homeworkId}/`, formData)
  return data
}

export async function deleteHomework(homeworkId: number) {
  await api.delete(`/homeworks/${homeworkId}/`)
}

/* ─── Teacher: Homework Answers ─── */

export async function getHomeworkAnswers(homeworkId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<HomeworkAnswer>>(`/homeworks/${homeworkId}/answers/list/`, { params })
  return data
}

/* ─── Teacher: Reviews ─── */

export async function createReview(homeworkId: number, payload: { user?: number; text?: string; rating?: number }) {
  const { data } = await api.post<Review>(`/homeworks/${homeworkId}/reviews/`, payload)
  return data
}

export async function updateReview(reviewId: number, payload: Partial<{ user: number; text: string; rating: number }>) {
  const { data } = await api.patch<Review>(`/reviews/${reviewId}/`, payload)
  return data
}

export async function deleteReview(reviewId: number) {
  await api.delete(`/reviews/${reviewId}/`)
}

/* ─── Student: Homework list ─── */

export interface HomeworkStudent {
  id: number
  title: string
  description: string
  file: string
  due_date: string
  created_at: string
  is_submitted: boolean
}

export async function getStudentHomeworks(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<HomeworkStudent>>(`/student/groups/${groupId}/homeworks/`, { params })
  return data
}

/* ─── Student: Submit answer ─── */

export async function submitHomeworkAnswer(homeworkId: number, payload: { file?: File | null; comment?: string }) {
  const formData = new FormData()
  if (payload.file) formData.append('file', payload.file)
  if (payload.comment) formData.append('comment', payload.comment)
  const { data } = await api.post<HomeworkAnswer>(`/student/homeworks/${homeworkId}/answer/`, formData)
  return data
}
