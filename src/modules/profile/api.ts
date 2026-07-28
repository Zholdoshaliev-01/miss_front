import { api } from '@/core/api/axios'
import type { UserProfile } from './types'

export async function getProfile() {
  const { data } = await api.get<UserProfile>('/users/me/')
  return data
}

export async function updateProfile(payload: Partial<UserProfile> | FormData) {
  const { data } = await api.patch<UserProfile>('/users/me/', payload)
  return data
}
