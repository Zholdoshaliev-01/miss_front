import { BookOpen, ClipboardCheck, FileText, GraduationCap, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'

const sections = [
  {
    icon: BookOpen,
    title: 'Materials',
    desc: 'Access learning materials shared by your teacher.',
    color: 'from-emerald-500 to-green-400',
    glow: 'rgba(16,185,129,0.15)',
    link: '/student/materials',
  },
  {
    icon: FileText,
    title: 'Homework',
    desc: 'View assigned homework and submit your answers.',
    color: 'from-amber-500 to-orange-400',
    glow: 'rgba(245,158,11,0.15)',
    link: '/student/homeworks',
  },
  {
    icon: ClipboardCheck,
    title: 'Tests',
    desc: 'Take tests and view your results.',
    color: 'from-violet-500 to-purple-400',
    glow: 'rgba(139,92,246,0.15)',
    link: '/student/tests',
  },
]

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user)

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
              Welcome back{user?.username ? `, ${user.username}` : ''}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Your learning hub — materials, homework, and tests in one place.
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
              View
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h2 className="font-heading text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Recent Activity</h2>
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}>
            <GraduationCap className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No recent activity</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>Complete homework and tests to see your progress here.</p>
        </div>
      </div>
    </div>
  )
}
