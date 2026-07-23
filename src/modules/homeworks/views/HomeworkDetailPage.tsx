import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle, Clock, Download, FileText, Loader2, MessageSquare, Users } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { getHomeworkAnswers, getHomeworkDetail } from '@/modules/homeworks/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function buildFileUrl(file?: string | null) {
  if (!file) return null
  return file.startsWith('http') ? file : `${BASE_URL}${file}`
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'No due date'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function HomeworkDetailPage() {
  const { id } = useParams()
  const homeworkId = Number(id)

  const { data: homework, isLoading: isLoadingHomework } = useQuery({
    queryKey: ['homework', homeworkId],
    queryFn: () => getHomeworkDetail(homeworkId),
    enabled: Number.isFinite(homeworkId),
  })

  const { data: answersData, isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['homework-answers', homeworkId],
    queryFn: () => getHomeworkAnswers(homeworkId),
    enabled: Number.isFinite(homeworkId),
  })

  const answers = answersData?.results ?? homework?.answers ?? []
  const reviewedCount = 0
  const pendingCount = answers.length - reviewedCount
  const homeworkFileUrl = buildFileUrl(homework?.file)

  if (isLoadingHomework) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <FileText className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">Homework not found</h1>
        <Link to="/groups" className="btn-primary mt-6 !py-2.5">Back to Groups</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/groups/${homework.group}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back to Group
        </Link>
        <PageHeader
          title={homework.title}
          description={`Due ${formatDate(homework.due_date)}`}
          actions={
            homeworkFileUrl ? (
              <a href={homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                <Download className="h-4 w-4" />
                Download File
              </a>
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-5 text-center">
          <Users className="mx-auto mb-2 h-5 w-5 text-blue-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{answers.length}</div>
          <div className="text-xs text-white/35">Submissions</div>
        </div>
        <div className="glass-card p-5 text-center">
          <CheckCircle className="mx-auto mb-2 h-5 w-5 text-emerald-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{reviewedCount}</div>
          <div className="text-xs text-white/35">Reviewed</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Clock className="mx-auto mb-2 h-5 w-5 text-amber-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{pendingCount}</div>
          <div className="text-xs text-white/35">Pending</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Calendar className="mx-auto mb-2 h-5 w-5 text-violet-400/40" />
          <div className="font-heading text-lg font-bold text-white">{formatDate(homework.due_date)}</div>
          <div className="text-xs text-white/35">Due Date</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-400/10">
            <FileText className="h-6 w-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-base font-semibold text-white/80">Assignment Details</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {homework.description || 'No instructions provided.'}
            </p>
            {homeworkFileUrl && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a href={homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs text-accent-light/70">
                  <Download className="h-3.5 w-3.5" />
                  Download attachment
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="font-heading text-sm font-semibold text-white/70">Student Submissions</h3>
        </div>
        {isLoadingAnswers ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : answers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Users className="h-10 w-10 text-white/15" />
            <p className="mt-4 text-sm font-medium text-white/50">No submissions yet</p>
            <p className="mt-1 text-sm text-white/30">Student answers will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Student</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Submitted</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">File</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Comment</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((answer) => {
                  const fileUrl = buildFileUrl(answer.file)
                  return (
                    <tr key={answer.id} className="border-b border-white/[0.04] transition hover:bg-accent/[0.02]">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-purple-500/25 text-xs font-bold text-white/70">
                            {answer.student_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="font-medium text-white/80">{answer.student_name || `Student ${answer.student}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-white/40">{formatDate(answer.submitted_at)}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge label="Submitted" variant="active" />
                      </td>
                      <td className="px-6 py-3.5">
                        {fileUrl ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs text-accent-light/70">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-white/45">
                        {answer.comment ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {answer.comment}
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
