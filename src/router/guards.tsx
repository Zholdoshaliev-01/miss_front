import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getGroupDetail, getGroups } from '@/modules/groups/api'
import { academyConfig } from '@/core/config/academy'
import { useCommonCopy } from '@/shared/i18n'

export function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.role)

  if (!isAuthenticated) return <Navigate to="/landing" replace />
  if (role === 'student') return <Navigate to="/student/dashboard" replace />
  return <Navigate to="/dashboard" replace />
}

export function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.role)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  // Teachers and unknown roles get access to the main (teacher) dashboard
  if (role === 'student') {
    return <Navigate to="/student/dashboard" replace />
  }
  return <Outlet />
}

export function StudentRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.role)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (role !== 'student') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { t } = useCommonCopy()
  const { data: paginatedGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  })

  const groups = paginatedGroups?.results ?? []
  const groupDetailQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ['group', group.id],
      queryFn: () => getGroupDetail(group.id),
      enabled: Boolean(group.id),
    })),
  })
  const groupsWithDetails = groups.map((group, index) => groupDetailQueries[index]?.data ?? group)

  const totalGroups = groupsWithDetails.length
  const totalTests = groupsWithDetails.reduce((a, g) => a + (Number(g.tests_count) || 0), 0)
  const totalMaterials = groupsWithDetails.reduce((a, g) => a + (Number(g.materials_count) || 0), 0)
  const totalStudents = groupsWithDetails.reduce((a, g) => a + (Number(g.students_count) || 0), 0)

  const quickStats = [
    {
      label: t.groups,
      value: totalGroups,
      icon: Users,
      color: 'from-blue-500 to-cyan-400',
      glow: 'rgba(59,130,246,0.15)',
      link: '/groups',
    },
    {
      label: t.tests,
      value: totalTests,
      icon: ClipboardCheck,
      color: 'from-violet-500 to-purple-400',
      glow: 'rgba(139,92,246,0.15)',
      link: '/groups',
    },
    {
      label: t.materials,
      value: totalMaterials,
      icon: BookOpen,
      color: 'from-emerald-500 to-green-400',
      glow: 'rgba(16,185,129,0.15)',
      link: '/groups',
    },
    {
      label: t.students,
      value: totalStudents,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-400',
      glow: 'rgba(245,158,11,0.15)',
      link: '/ratings',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/[0.06] to-purple-500/[0.03] p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-[80px]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-lg shadow-accent/20">
              <Sparkles className="h-6 w-6" style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl" style={{ color: 'var(--color-text)' }}>
                {t.welcomeBack}{user?.username ? `, ${user.username}` : ''}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {academyConfig.academyName}: {t.classroomOverview}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/groups" className="btn-primary !py-2 !px-5 text-sm">
              <Plus className="h-4 w-4" />
              {totalGroups > 0 ? t.manageGroups : t.createGroup}
            </Link>
            <Link to="/profile" className="btn-secondary !py-2 !px-5 text-sm">
              {t.profile}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickStats.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className="glass-card glass-card-hover card-shine group p-5"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color}`}
                style={{ boxShadow: `0 6px 20px ${s.glow}` }}
              >
                <s.icon className="h-5 w-5" style={{ color: '#fff' }} />
              </div>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" style={{ color: 'var(--color-text-faint)' }} />
            </div>
            <div className="mt-4">
              <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{s.value}</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="glass-card p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {t.recentActivity}
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>
                {t.dashboardActivityDescription}
              </p>
            </div>
            <Link to="/groups" className="btn-secondary !py-2 !px-4 text-sm">
              {t.openGroups}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}>
              <GraduationCap className="h-7 w-7" />
            </div>
            <p className="mt-4 font-heading text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {totalGroups > 0 ? t.dashboardEmptyTitle : t.noGroupsYet}
            </p>
            <p className="mt-1 max-w-md text-sm" style={{ color: 'var(--color-text-faint)' }}>
              {totalGroups > 0 ? t.dashboardEmptyDescription : t.noGroupsDescription}
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            {t.contentOverview}
          </h2>
          <div className="mt-5 space-y-3">
            {[
              { label: t.materials, value: totalMaterials, icon: BookOpen },
              { label: t.tests, value: totalTests, icon: ClipboardCheck },
              { label: t.students, value: totalStudents, icon: Users },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" style={{ color: 'var(--color-accent-light)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
                </div>
                <span className="font-heading text-sm font-bold" style={{ color: 'var(--color-text)' }}>{item.value}</span>
              </div>
            ))}
          </div>
          <Link to="/ratings" className="btn-secondary mt-5 w-full justify-center !py-2.5 text-sm">
            {t.openRating}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
