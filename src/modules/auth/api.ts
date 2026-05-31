import { api } from '@/core/api/axios'
import type { 
  AuthResponse, 
  LoginPayload, 
  RegisterPayload,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload
} from './types'

export async function loginRequest(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>('/login/', payload)
  return data
}

export async function registerRequest(payload: RegisterPayload) {
  await api.post('/register/', payload)
}

export async function logoutRequest(refresh: string) {
  await api.post('/logout/', { refresh })
}

export async function requestPasswordReset(payload: PasswordResetRequestPayload) {
  await api.post('/password-reset/request/', payload)
}

export async function confirmPasswordReset(payload: PasswordResetConfirmPayload) {
  await api.post('/password-reset/confirm/', payload)
}
