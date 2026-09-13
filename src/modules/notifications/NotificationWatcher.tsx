import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { getNotifications, markNotificationRead } from './api'

const NOTIFICATIONS_KEY = 'kunduz-study-hub-notifications'
const NOTIFICATIONS_EVENT = 'kunduz-study-hub-notifications-changed'
const POLL_INTERVAL_MS = 30_000

function notificationsEnabled() {
  return localStorage.getItem(NOTIFICATIONS_KEY) === 'true'
}

function canUseBrowserNotifications() {
  return 'Notification' in window && Notification.permission === 'granted'
}

export function NotificationWatcher() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [enabled, setEnabled] = useState(notificationsEnabled)
  const shownIds = useRef(new Set<number>())

  useEffect(() => {
    const handleChange = () => setEnabled(notificationsEnabled())
    window.addEventListener(NOTIFICATIONS_EVENT, handleChange)
    window.addEventListener('storage', handleChange)
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [])

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => getNotifications({ unread: true }),
    enabled: isAuthenticated && enabled,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: 0,
  })

  useEffect(() => {
    if (!isAuthenticated || !enabled) return
    if (unreadNotifications.length === 0) return

    unreadNotifications.forEach((item) => {
      if (shownIds.current.has(item.id)) return
      shownIds.current.add(item.id)

      if (canUseBrowserNotifications()) {
        new Notification(item.title || 'Miss Kunduz Team', {
          body: item.message,
        })
      } else {
        toast(item.title, {
          description: item.message,
        })
      }

      markNotificationRead(item.id).catch(() => {
        shownIds.current.delete(item.id)
      })
    })
  }, [enabled, isAuthenticated, unreadNotifications])

  return null
}
