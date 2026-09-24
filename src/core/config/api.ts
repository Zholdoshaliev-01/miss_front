const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export const DJANGO_API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || 'https://api.misskunduz.edu.kg',
)

export const CHAT_API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_CHAT_API_URL || 'https://chat.misskunduz.edu.kg',
)

export const DJANGO_MEDIA_BASE_URL = DJANGO_API_BASE_URL.replace(/\/api$/, '')

export function resolveServiceUrl(baseUrl: string, path: string) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) return path
  return `${trimTrailingSlash(baseUrl)}/${path.replace(/^\//, '')}`
}
