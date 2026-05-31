import { useMutation } from '@tanstack/react-query'
import { Bell, Globe, LogOut, Moon, Sun, Monitor, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { logoutRequest } from '@/modules/auth/api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useThemeStore } from '@/modules/theme/themeStore'
import { PageHeader } from '@/shared/ui/PageHeader'
import { cn } from '@/shared/utils/cn'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearAuth = useAuthStore((s) => s.clearAuth)

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your app preferences and appearance."
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Appearance */}
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>Appearance</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>Customize the UI theme</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-hover)]" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--input-bg)', color: 'var(--color-text)' }}>
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Theme</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="btn-secondary !py-1.5 !px-4 text-xs"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
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
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>Preferences</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>Language and notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-hover)]" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--input-bg)', color: 'var(--color-text)' }}>
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Language</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>English (US)</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast('Language settings coming soon')}
                className="btn-secondary !py-1.5 !px-4 text-xs"
              >
                Change
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-hover)]" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--input-bg)', color: 'var(--color-text)' }}>
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Notifications</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Enabled</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast('Notification settings coming soon')}
                className="btn-secondary !py-1.5 !px-4 text-xs"
              >
                Configure
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
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>Account</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>Manage your session</p>
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-500">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-rose-500">Sign Out</h3>
                  <p className="text-xs text-rose-500/70">End your current session across all tabs.</p>
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
                {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
