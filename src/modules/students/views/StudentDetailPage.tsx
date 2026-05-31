import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, BarChart3, FileText, ClipboardCheck, Mail, GraduationCap, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const mockActivity = [
  { action: 'Submitted Homework #2 — Linked Lists', date: '2026-03-22', type: 'homework' },
  { action: 'Scored 96% on Midterm Exam', date: '2026-03-15', type: 'test' },
  { action: 'Submitted Homework #1 — Arrays', date: '2026-03-14', type: 'homework' },
  { action: 'Joined the group', date: '2026-01-15', type: 'join' },
]

export default function StudentDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link to="/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <PageHeader title="Aigerim Kasenova" description="Computer Science 101 · Beginner" />
      </div>

      {/* Student Profile Card */}
      <div className="glass-card overflow-hidden">
        <div className="relative h-24 bg-gradient-to-r from-accent/25 via-purple-500/20 to-pink-500/10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111627] to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[#111627] bg-gradient-to-br from-accent/50 to-purple-500/50 font-heading text-2xl font-bold text-white shadow-glow">
              A
            </div>
            <div className="mb-1 flex-1">
              <h2 className="font-heading text-xl font-bold text-white">Aigerim Kasenova</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm text-white/40">
                  <Mail className="h-3.5 w-3.5" />
                  aigerim@mail.com
                </span>
                <span className="flex items-center gap-1.5 text-sm text-white/40">
                  <GraduationCap className="h-3.5 w-3.5" />
                  CS101
                </span>
                <StatusBadge label="Active" variant="active" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-5 text-center">
          <FileText className="mx-auto h-5 w-5 text-amber-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">2</div>
          <div className="text-xs text-white/35">Submissions</div>
        </div>
        <div className="glass-card p-5 text-center">
          <ClipboardCheck className="mx-auto h-5 w-5 text-violet-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">1</div>
          <div className="text-xs text-white/35">Tests Taken</div>
        </div>
        <div className="glass-card p-5 text-center">
          <BarChart3 className="mx-auto h-5 w-5 text-emerald-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">96%</div>
          <div className="text-xs text-white/35">Avg Score</div>
        </div>
        <div className="glass-card p-5 text-center">
          <TrendingUp className="mx-auto h-5 w-5 text-blue-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">#1</div>
          <div className="text-xs text-white/35">Rank</div>
        </div>
      </div>

      {/* Performance */}
      <div className="glass-card p-6">
        <h3 className="mb-4 font-heading text-sm font-semibold text-white/60">Performance Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-white/50">Homework Completion</span>
              <span className="font-medium text-emerald-400">100%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-full rounded-full bg-emerald-500 transition-all duration-700" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-white/50">Test Average</span>
              <span className="font-medium text-emerald-400">96%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[96%] rounded-full bg-violet-500 transition-all duration-700" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-white/50">Attendance</span>
              <span className="font-medium text-amber-400">85%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[85%] rounded-full bg-amber-500 transition-all duration-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="glass-card p-6">
        <h3 className="mb-4 font-heading text-sm font-semibold text-white/60">Activity Timeline</h3>
        <div className="space-y-1">
          {mockActivity.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-white/[0.02]">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                item.type === 'test' ? 'bg-violet-500/[0.1]' :
                item.type === 'homework' ? 'bg-amber-500/[0.1]' :
                'bg-accent/[0.08]'
              }`}>
                {item.type === 'test' ? <ClipboardCheck className="h-4 w-4 text-violet-400/60" /> :
                 item.type === 'homework' ? <FileText className="h-4 w-4 text-amber-400/60" /> :
                 <GraduationCap className="h-4 w-4 text-accent-light/60" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/60">{item.action}</p>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-xs text-white/25">
                <Calendar className="h-3 w-3" />
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
