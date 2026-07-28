import { useQueries, useQuery } from '@tanstack/react-query'
import { BookOpen, CheckCircle2, ClipboardCheck, FileText, GraduationCap, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { academyConfig } from '@/core/config/academy'
import { useCommonCopy } from '@/shared/i18n'
import { getStudentGroups, getStudentHomeworks, getStudentTests } from '@/modules/student/api'

function normalizeStudentGroup(raw: any) {
  return {
    id: raw.group_id ?? raw.id,
    group_name: raw.group_name ?? raw.name ?? '',
  }
}

function getList(raw: any) {
  return Array.isArray(raw) ? raw : raw?.results ?? []
}

function getActivityDate(item: any) {
  return item.submitted_at || item.updated_at || item.completed_at || item.created_at || item.due_date || ''
}

function formatActivityDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user)
  const { t } = useCommonCopy()
  const { data: rawGroupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
  })

  const groups = getList(rawGroupsData).map(normalizeStudentGroup)

  const homeworkQueries = useQueries({
    queries: groups.map((group: any) => ({
      queryKey: ['student-homeworks', group.id],
      queryFn: () => getStudentHomeworks(group.id),
      enabled: Boolean(group.id),
    })),
  })

  const testQueries = useQueries({
    queries: groups.map((group: any) => ({
      queryKey: ['student-tests', group.id],
      queryFn: () => getStudentTests(group.id),
      enabled: Boolean(group.id),
    })),
  })

  const recentActivities = [
    ...homeworkQueries.flatMap((query, index) => {
      const group = groups[index]
      return getList(query.data)
        .filter((homework: any) => homework.is_submitted)
        .map((homework: any) => ({
          id: `homework-${homework.id}`,
          type: 'homework',
          title: homework.title,
          label: t.completedHomework,
          groupName: group?.group_name,
          date: getActivityDate(homework),
          icon: CheckCircle2,
          color: 'text-emerald-300',
          href: `/student/homework/${homework.id}`,
        }))
    }),
    ...testQueries.flatMap((query, index) => {
      const group = groups[index]
      return getList(query.data)
        .filter((test: any) => test.is_submitted || test.is_completed || test.status === 'submitted' || test.result_status === 'submitted')
        .map((test: any) => ({
          id: `test-${test.id}`,
          type: 'test',
          title: test.title,
          label: t.completedTest,
          groupName: group?.group_name,
          date: getActivityDate(test),
          icon: ClipboardCheck,
          color: 'text-violet-300',
          href: `/student/test/${test.id}`,
        }))
    }),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5)

  const activityLoading = groupsLoading || homeworkQueries.some((query) => query.isLoading) || testQueries.some((query) => query.isLoading)

  const sections = [
    {
      icon: BookOpen,
      title: t.materials,
      desc: t.accessMaterials,
      color: 'from-emerald-500 to-green-400',
      glow: 'rgba(16,185,129,0.15)',
      link: '/student/materials',
    },
    {
      icon: FileText,
      title: t.homework,
      desc: t.viewHomework,
      color: 'from-amber-500 to-orange-400',
      glow: 'rgba(245,158,11,0.15)',
      link: '/student/homeworks',
    },
    {
      icon: ClipboardCheck,
      title: t.tests,
      desc: t.takeTests,
      color: 'from-violet-500 to-purple-400',
      glow: 'rgba(139,92,246,0.15)',
      link: '/student/tests',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/[0.06] to-purple-500/[0.03] p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-[80px]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark shadow-lg shadow-accent/20">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl" style={{ color: 'var(--color-text)' }}>
              {t.welcomeBack}{user?.username ? `, ${user.username}` : ''}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {academyConfig.academyName}: {t.studentHubLine}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-6 md:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.title} to={s.link} className="glass-card glass-card-hover card-shine group p-6">
            <div
              className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}
              style={{ boxShadow: `0 8px 24px ${s.glow}` }}
            >
              <s.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-heading text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{s.title}</h3>
            <p className="mt-2 text-sm transition-colors" style={{ color: 'var(--color-text-faint)' }}>{s.desc}</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium transition-colors" style={{ color: 'var(--color-accent-light)' }}>
              {t.view}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h2 className="font-heading text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{t.recentActivity}</h2>
        {activityLoading ? (
          <div className="mt-6 flex items-center justify-center gap-2 py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.activityLoading}
          </div>
        ) : recentActivities.length > 0 ? (
          <div className="mt-5 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {recentActivities.map((activity) => (
              <Link
                key={activity.id}
                to={activity.href}
                className="flex items-center gap-4 px-4 py-4 transition hover:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {activity.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {activity.title}
                  </p>
                  {activity.groupName && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      {t.activityFromGroup}: {activity.groupName}
                    </p>
                  )}
                </div>
                <div className="hidden text-right text-xs sm:block" style={{ color: 'var(--color-text-faint)' }}>
                  {formatActivityDate(activity.date)}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}>
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{t.noRecentActivity}</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.completeWorkProgress}</p>
          </div>
        )}
      </div>
    </div>
  )
}
