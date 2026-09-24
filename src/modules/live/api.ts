import axios from 'axios'
import { api } from '@/core/api/axios'

export interface LiveLesson {
  id: number
  group?: number
  room_name?: string
  started_at?: string
  ended_at?: string | null
  status?: string
}

export interface LiveKitCredentials {
  token: string
  url: string
  room_name: string
  lesson_id: number
  identity: string
}

function unwrapLesson(data: LiveLesson | { lesson?: LiveLesson }) {
  if ('lesson' in data && data.lesson) return data.lesson
  return data as LiveLesson
}

export async function startLiveLesson(groupId: number) {
  const { data } = await api.post<LiveLesson | { lesson?: LiveLesson }>(`/groups/${groupId}/live-lessons/start/`)
  return unwrapLesson(data)
}

export async function getActiveLiveLesson(groupId: number, isStudent: boolean) {
  const path = isStudent
    ? `/student/groups/${groupId}/live-lessons/active/`
    : `/groups/${groupId}/live-lessons/active/`

  try {
    const { data } = await api.get<LiveLesson | { lesson?: LiveLesson }>(path)
    return unwrapLesson(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function getLiveKitCredentials(lessonId: number) {
  const { data } = await api.post<LiveKitCredentials>(`/live-lessons/${lessonId}/token/`)
  return data
}

export async function endLiveLesson(lessonId: number) {
  const { data } = await api.patch<LiveLesson>(`/live-lessons/${lessonId}/end/`)
  return data
}
