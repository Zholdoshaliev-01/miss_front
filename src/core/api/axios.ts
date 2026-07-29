import axios, { type AxiosInstance } from 'axios'
import { useAuthStore } from '@/modules/auth/store/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.kassi.space'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/* ─── Shared 401 / refresh-token logic ─── */

let refreshPromise: Promise<string | null> | null = null

function clearAuthAndRedirectLogin() {
  useAuthStore.getState().clearAuth()
  window.location.assign('/login')
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = useAuthStore.getState().refreshToken
  if (!refresh) {
    clearAuthAndRedirectLogin()
    return null
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string }>(`${baseURL}/token/refresh/`, { refresh })
      .then((res) => {
        const access = res.data.access
        useAuthStore.getState().setAccessToken(access)
        return access
      })
      .catch(() => {
        clearAuthAndRedirectLogin()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

/**
 * Applies standard auth interceptors (request + 401 response) to any Axios instance.
 * This ensures both `api` and `chatApi` share the same token-attach and
 * refresh-on-401 behavior.
 */
export function applyAuthInterceptors(instance: AxiosInstance) {
  // ── Request: attach Bearer token + handle FormData ──
  instance.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // ── Response: handle 401 with token refresh ──
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean }

      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return Promise.reject(error)
      }

      // Don't intercept auth endpoints — let errors bubble up to the UI
      const url = String(originalRequest?.url ?? '')
      const authPaths = ['/login', '/register', '/logout', '/token/refresh']
      if (authPaths.some((p) => url.includes(p))) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        return Promise.reject(error)
      }

      originalRequest._retry = true
      const access = await refreshAccessToken()
      if (!access) {
        return Promise.reject(error)
      }

      originalRequest.headers.Authorization = `Bearer ${access}`
      return instance(originalRequest)
    },
  )
}

// Apply to the main API instance
applyAuthInterceptors(api)
