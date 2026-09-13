import { useMutation } from '@tanstack/react-query'
import { Bell, Check, Globe, LogOut, Moon, Sun, Monitor, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { logoutRequest } from '@/modules/auth/api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useThemeStore } from '@/modules/theme/themeStore'
import { PageHeader } from '@/shared/ui/PageHeader'
import { cn } from '@/shared/utils/cn'
import { languages, type LanguageCode, useLanguage } from '@/shared/i18n'

const NOTIFICATIONS_KEY = 'kunduz-study-hub-notifications'
const NOTIFICATIONS_EVENT = 'kunduz-study-hub-notifications-changed'

const copy: Record<LanguageCode, {
  title: string
  description: string
  appearance: string
  appearanceDescription: string
  theme: string
  dark: string
  light: string
  switchTo: string
  preferences: string
  preferencesDescription: string
  language: string
  languageDescription: string
  notifications: string
  notificationsDescription: string
  notificationsOn: string
  notificationsOff: string
  notificationsBlocked: string
  enableNotifications: string
  disableNotifications: string
  account: string
  accountDescription: string
  signOut: string
  signOutDescription: string
  signingOut: string
}> = {
  ky: {
    title: 'Жөндөөлөр',
    description: 'Тил, көрүнүш жана билдирүүлөрдү башкаруу.',
    appearance: 'Көрүнүш',
    appearanceDescription: 'Интерфейстин темасын тандаңыз',
    theme: 'Тема',
    dark: 'Караңгы режим',
    light: 'Жарык режим',
    switchTo: 'Которуу:',
    preferences: 'Тандоолор',
    preferencesDescription: 'Тил жана билдирүүлөр',
    language: 'Тил',
    languageDescription: 'Сайттын тили ушул браузерде сакталат.',
    notifications: 'Билдирүүлөр',
    notificationsDescription: 'Үй тапшырма жана тест эскертмелери үчүн.',
    notificationsOn: 'Күйүк',
    notificationsOff: 'Өчүк',
    notificationsBlocked: 'Браузер бөгөттөгөн',
    enableNotifications: 'Күйгүзүү',
    disableNotifications: 'Өчүрүү',
    account: 'Аккаунт',
    accountDescription: 'Сессияны башкаруу',
    signOut: 'Чыгуу',
    signOutDescription: 'Учурдагы сессияны бүтүрүү.',
    signingOut: 'Чыгууда...',
  },
  ru: {
    title: 'Настройки',
    description: 'Управляй языком, внешним видом и уведомлениями.',
    appearance: 'Внешний вид',
    appearanceDescription: 'Настрой тему интерфейса',
    theme: 'Тема',
    dark: 'Темный режим',
    light: 'Светлый режим',
    switchTo: 'Переключить на',
    preferences: 'Предпочтения',
    preferencesDescription: 'Язык и уведомления',
    language: 'Язык',
    languageDescription: 'Язык сайта сохранится в этом браузере.',
    notifications: 'Уведомления',
    notificationsDescription: 'Для напоминаний о домашках и тестах.',
    notificationsOn: 'Включены',
    notificationsOff: 'Выключены',
    notificationsBlocked: 'Заблокированы браузером',
    enableNotifications: 'Включить',
    disableNotifications: 'Выключить',
    account: 'Аккаунт',
    accountDescription: 'Управление сессией',
    signOut: 'Выйти',
    signOutDescription: 'Завершить текущую сессию.',
    signingOut: 'Выходим...',
  },
  en: {
    title: 'Settings',
    description: 'Manage language, appearance, and notifications.',
    appearance: 'Appearance',
    appearanceDescription: 'Customize the UI theme',
    theme: 'Theme',
    dark: 'Dark Mode',
    light: 'Light Mode',
    switchTo: 'Switch to',
    preferences: 'Preferences',
    preferencesDescription: 'Language and notifications',
    language: 'Language',
    languageDescription: 'The site language is saved in this browser.',
    notifications: 'Notifications',
    notificationsDescription: 'For homework and test reminders.',
    notificationsOn: 'Enabled',
    notificationsOff: 'Disabled',
    notificationsBlocked: 'Blocked by browser',
    enableNotifications: 'Enable',
    disableNotifications: 'Disable',
    account: 'Account',
    accountDescription: 'Manage your session',
    signOut: 'Sign Out',
    signOutDescription: 'End your current session.',
    signingOut: 'Signing out...',
  },
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { language, setLanguage } = useLanguage()
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem(NOTIFICATIONS_KEY) === 'true')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission
  })
  const t = copy[language]
  const selectedLanguage = useMemo(() => languages.find((item) => item.code === language) ?? languages[1], [language])

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, String(notificationsEnabled))
    window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
  }, [notificationsEnabled])

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await logoutRequest(refreshToken)
      }
    },
    onSuccess: () => {
      clearAuth()
      toast.success('Signed out')
      navigate('/login', { replace: true })
    },
    onError: () => {
      clearAuth()
      toast.error('Session ended')
      navigate('/login', { replace: true })
    },
  })

  const handleNotificationsToggle = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
      toast.success(language === 'ru' ? 'Уведомления выключены' : language === 'ky' ? 'Билдирүүлөр өчүрүлдү' : 'Notifications disabled')
      return
    }

    if (!('Notification' in window)) {
      toast.error(language === 'ru' ? 'Браузер не поддерживает уведомления' : language === 'ky' ? 'Браузер билдирүүлөрдү колдобойт' : 'Browser notifications are not supported')
      return
    }

    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission

    setNotificationPermission(permission)

    if (permission === 'granted') {
      setNotificationsEnabled(true)
      new Notification('Miss Kunduz Team', {
        body: language === 'ru'
          ? 'Уведомления включены.'
          : language === 'ky'
            ? 'Билдирүүлөр күйгүзүлдү.'
            : 'Notifications are enabled.',
      })
      toast.success(language === 'ru' ? 'Уведомления включены' : language === 'ky' ? 'Билдирүүлөр күйгүзүлдү' : 'Notifications enabled')
    } else {
      setNotificationsEnabled(false)
      toast.error(language === 'ru' ? 'Разрешение на уведомления не получено' : language === 'ky' ? 'Билдирүүгө уруксат берилген жок' : 'Notification permission was not granted')
    }
  }

  const notificationStatus = notificationPermission === 'denied'
    ? t.notificationsBlocked
    : notificationsEnabled
      ? t.notificationsOn
      : t.notificationsOff

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.title}
        description={t.description}
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Appearance */}
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>{t.appearance}</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.appearanceDescription}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-hover)]" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--input-bg)', color: 'var(--color-text)' }}>
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{t.theme}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{theme === 'dark' ? t.dark : t.light}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="btn-secondary !py-1.5 !px-4 text-xs"
              >
                {t.switchTo} {theme === 'dark' ? t.light : t.dark}
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 text-emerald-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>{t.preferences}</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.preferencesDescription}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-hover)]" style={{ border: '1px solid var(--border-color)' }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--input-bg)', color: 'var(--color-text)' }}>
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{t.language}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{selectedLanguage.nativeLabel} · {t.languageDescription}</div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {languages.map((item) => {
                  const isActive = item.code === language
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLanguage(item.code)
                        toast.success(`${item.nativeLabel} selected`)
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-xl border px-3 py-3 text-left transition',
                        isActive
                          ? 'border-accent/50 bg-accent/15 text-white shadow-lg shadow-accent/10'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-accent/25 hover:text-white/80',
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="mt-0.5 block text-[11px] opacity-60">{item.helper}</span>
                      </span>
                      {isActive && <Check className="h-4 w-4 shrink-0 text-accent-light" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-hover)]" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--input-bg)', color: 'var(--color-text)' }}>
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{t.notifications}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{notificationStatus} · {t.notificationsDescription}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNotificationsToggle}
                disabled={notificationPermission === 'denied'}
                className={cn(
                  'btn-secondary !py-1.5 !px-4 text-xs',
                  notificationsEnabled && '!border-emerald-400/30 !bg-emerald-400/10 !text-emerald-200',
                  notificationPermission === 'denied' && 'cursor-not-allowed opacity-50',
                )}
              >
                {notificationsEnabled ? t.disableNotifications : t.enableNotifications}
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="glass-card p-6 md:col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 text-rose-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>{t.account}</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.accountDescription}</p>
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-500">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-rose-500">{t.signOut}</h3>
                  <p className="text-xs text-rose-500/70">{t.signOutDescription}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className={cn(
                  'btn-primary !bg-rose-500 hover:!bg-rose-600 !shadow-rose-500/25',
                  logoutMutation.isPending && 'opacity-50'
                )}
              >
                {logoutMutation.isPending ? t.signingOut : t.signOut}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
