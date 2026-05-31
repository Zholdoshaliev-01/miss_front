import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'
import type { AuthResponse } from '../types'

/* ─── Cookie-based storage adapter ─── */
const cookieStorage: StateStorage = {
  getItem: (name: string) => {
    const value = Cookies.get(name)
    return value ?? null
  },
  setItem: (name: string, value: string) => {
    Cookies.set(name, value, {
      expires: 7,       // 7 days
      sameSite: 'Lax',
      secure: window.location.protocol === 'https:',
    })
  },
  removeItem: (name: string) => {
    Cookies.remove(name)
  },
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: (AuthResponse['user'] & { role?: string }) | null
  isAuthenticated: boolean
  role: 'teacher' | 'student' | null
  setAuth: (data: AuthResponse) => void
  setAccessToken: (access: string) => void
  setRole: (role: 'teacher' | 'student') => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      role: null,
      setAuth: (data) =>
        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          user: data.user,
          isAuthenticated: true,
          role: (data.user.role as 'teacher' | 'student') ?? null,
        }),
      setAccessToken: (access) => set({ accessToken: access }),
      setRole: (role) => set({ role }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          role: null,
        }),
    }),
    {
      name: 'eduflow-auth',
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    },
  ),
)
