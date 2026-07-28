import { useMutation } from '@tanstack/react-query'
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  UserRound,
  ChevronLeft,
  Menu,
  MessageSquare,
  BookOpen,
  ClipboardCheck,
  FileText,
  Users,
  Settings,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useState } from 'react'
import { logoutRequest } from '@/modules/auth/api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { academyConfig } from '@/core/config/academy'

import { cn } from '@/shared/utils/cn'
import { useCommonCopy } from '@/shared/i18n'

const studentNav = [
  { to: '/student/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { to: '/student/groups', labelKey: 'myGroups', icon: Users },
  { to: '/student/materials', labelKey: 'materials', icon: BookOpen },
  { to: '/student/homeworks', labelKey: 'homework', icon: FileText },
  { to: '/student/tests', labelKey: 'tests', icon: ClipboardCheck },
  { to: '/student/chat', labelKey: 'chat', icon: MessageSquare },
  { to: '/student/profile', labelKey: 'profile', icon: UserRound },
  { to: '/student/settings', labelKey: 'settings', icon: Settings },
] as const

function NavItem({ to, label, icon: Icon, collapsed }: { to: string; label: string; icon: (typeof studentNav)[number]['icon']; collapsed?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          collapsed && 'justify-center px-2',
          isActive && 'bg-accent/[0.08] shadow-sm',
        )
      }
      style={({ isActive }) => ({
        color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          )}
          <Icon
            className="h-5 w-5 shrink-0 transition-colors"
            style={{ color: isActive ? 'var(--color-accent-light)' : 'var(--color-text-faint)' }}
            aria-hidden
          />
          {!collapsed && <span>{label}</span>}
        </>
      )}
    </NavLink>
  )
}

export function StudentLayout() {
  const navigate = useNavigate()
  const { t } = useCommonCopy()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const user = useAuthStore((s) => s.user)
  const [collapsed, setCollapsed] = useState(false)

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

  const sidebarWidth = collapsed ? 'md:w-[72px]' : 'md:w-64'
  const mainPadding = collapsed ? 'md:pl-[72px]' : 'md:pl-64'

  return (
    <div className={cn('relative min-h-dvh pb-20 md:pb-0 transition-all duration-300 noise-overlay', mainPadding)} style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="mesh-gradient" />

      {/* ─── SIDEBAR (desktop) ─── */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-full flex-col backdrop-blur-xl transition-all duration-300 md:flex',
          sidebarWidth,
        )}
        style={{ background: 'var(--color-bg-alt)', borderRight: '1px solid var(--border-color)' }}
      >
        {/* Logo area */}
        <div className={cn('flex items-center px-4 py-5', collapsed ? 'justify-center' : 'justify-between')} style={{ borderBottom: '1px solid var(--border-color)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-lg shadow-accent/20">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="truncate font-heading text-lg font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                {academyConfig.academyName}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* User section */}
        {!collapsed && (
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-green-500/30 text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {user?.username?.[0]?.toUpperCase() ?? 'S'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{user?.username ?? 'Student'}</div>
                <div className="truncate text-xs" style={{ color: 'var(--color-text-faint)' }}>{user?.email ?? ''}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {studentNav.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={t[item.labelKey]} collapsed={collapsed} />
          ))}
        </nav>

        {/* Empty space filler for bottom */}
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="relative z-10 flex min-h-dvh flex-col">
        <div className="page-transition mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex px-2 py-2 backdrop-blur-xl md:hidden"
        style={{ background: 'var(--color-bg-alt)', borderTop: '1px solid var(--border-color)' }}
      >
        {studentNav.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent-light)' : 'var(--color-text-faint)',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" aria-hidden />
                {t[labelKey]}
                {isActive && (
                  <div className="absolute bottom-1 h-1 w-1 rounded-full bg-accent shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium"
          style={{ color: 'var(--color-text-faint)' }}
        >
          <LogOut className="h-5 w-5" aria-hidden />
          Out
        </button>
      </nav>
    </div>
  )
}
