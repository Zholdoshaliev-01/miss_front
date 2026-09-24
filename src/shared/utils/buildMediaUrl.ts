import { DJANGO_MEDIA_BASE_URL, resolveServiceUrl } from '@/core/config/api'

export function buildMediaUrl(path: string) {
  return resolveServiceUrl(DJANGO_MEDIA_BASE_URL, path)
}
