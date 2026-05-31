import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Calendar, Users, Download, Clock, MessageSquare, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const mockSubmissions = [
  { id: 1, name: 'Aigerim Kasenova', submitted: '2026-03-14', status: 'reviewed' as const, rating: 9 },
  { id: 2, name: 'Daulet Muratov', submitted: '2026-03-14', status: 'reviewed' as const, rating: 7 },
  { id: 3, name: 'Madina Akhmetova', submitted: '2026-03-15', status: 'pending' as const, rating: null },
  { id: 4, name: 'Nursultan Tlegenov', submitted: '2026-03-15', status: 'pending' as const, rating: null },
]

export default function HomeworkDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link to="/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <PageHeader
          title="Homework #1 — Arrays"
          description="Computer Science 101 · Due March 15, 2026"
          actions={
            <button type="button" className="btn-secondary text-sm">
              <Download className="h-4 w-4" />
              Download All
            </button>
          }
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-5 text-center">
          <Users className="mx-auto h-5 w-5 text-blue-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">{mockSubmissions.length}</div>
          <div className="text-xs text-white/35">Submissions</div>
        </div>
        <div className="glass-card p-5 text-center">
          <CheckCircle className="mx-auto h-5 w-5 text-emerald-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">2</div>
          <div className="text-xs text-white/35">Reviewed</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Clock className="mx-auto h-5 w-5 text-amber-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">2</div>
          <div className="text-xs text-white/35">Pending</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Calendar className="mx-auto h-5 w-5 text-violet-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">Mar 15</div>
          <div className="text-xs text-white/35">Due Date</div>
        </div>
      </div>

      {/* Description */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-400/10 shrink-0">
            <FileText className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-white/80">Assignment Details</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Complete all exercises from Chapter 3 about arrays. Implement the following: dynamic array resizing, binary search on sorted array, and merge two sorted arrays. Submit your code as a single PDF document with explanations.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" className="btn-ghost text-xs text-accent-light/70">
                <Download className="h-3.5 w-3.5" />
                assignment.pdf
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="font-heading text-sm font-semibold text-white/70">Student Submissions</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Student</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Submitted</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Status</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Rating</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30"></th>
            </tr>
          </thead>
          <tbody>
            {mockSubmissions.map((s) => (
              <tr key={s.id} className="border-b border-white/[0.04] transition hover:bg-accent/[0.02]">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-purple-500/25 text-xs font-bold text-white/70">
                      {s.name[0]}
                    </div>
                    <span className="font-medium text-white/80">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-white/40">{s.submitted}</td>
                <td className="px-6 py-3.5">
                  <StatusBadge
                    label={s.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                    variant={s.status === 'reviewed' ? 'active' : 'pending'}
                  />
                </td>
                <td className="px-6 py-3.5">
                  {s.rating != null ? (
                    <span className="font-heading text-sm font-bold text-white/70">{s.rating}/10</span>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <button type="button" className="btn-ghost text-xs">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
