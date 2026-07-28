import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle, Clock, Download, FileText, Loader2, MessageSquare, Star, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { createReview, getHomeworkAnswers, getHomeworkDetail, updateReview } from '@/modules/homeworks/api'
import type { HomeworkAnswer, Review } from '@/modules/homeworks/types'
import { useCommonCopy } from '@/shared/i18n'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function buildFileUrl(file?: string | null) {
  if (!file) return null
  return file.startsWith('http') ? file : `${BASE_URL}${file}`
}

function formatDate(dateStr: string | null | undefined, fallback: string) {
  if (!dateStr) return fallback
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getAnswerReview(answer: HomeworkAnswer): Review | null {
  if (answer.review) return answer.review
  if (answer.rating === undefined && !answer.review_text) return null

  return {
    id: 0,
    user: answer.student,
    homework: answer.homework,
    rating: Number(answer.rating) || 0,
    text: answer.review_text || '',
    created_date: '',
  }
}

function getErrorMessage(err: any, fallback: string) {
  const data = err.response?.data
  return data?.detail || data?.rating?.[0] || data?.text?.[0] || data?.user?.[0] || err.message || fallback
}

export default function HomeworkDetailPage() {
  const { t } = useCommonCopy()
  const { id } = useParams()
  const homeworkId = Number(id)
  const queryClient = useQueryClient()
  const [reviewingAnswer, setReviewingAnswer] = useState<HomeworkAnswer | null>(null)
  const [reviewRating, setReviewRating] = useState('10')
  const [reviewText, setReviewText] = useState('')

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
  const reviewedCount = answers.filter((answer) => answer.is_reviewed || getAnswerReview(answer)).length
  const pendingCount = answers.length - reviewedCount
  const homeworkFileUrl = buildFileUrl(homework?.file)

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewingAnswer) throw new Error('Answer is missing')
      const rating = Number(reviewRating)
      if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
        throw new Error(t.ratingMustBeBetween)
      }

      const existingReview = getAnswerReview(reviewingAnswer)
      const payload = {
        user: reviewingAnswer.student,
        rating,
        text: reviewText.trim(),
      }

      if (existingReview?.id) return updateReview(existingReview.id, payload)
      return createReview(homeworkId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework', homeworkId] })
      queryClient.invalidateQueries({ queryKey: ['homework-answers', homeworkId] })
      toast.success(t.homeworkReviewed)
      setReviewingAnswer(null)
      setReviewRating('10')
      setReviewText('')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, t.homeworkReviewFailed))
    },
  })

  function openReview(answer: HomeworkAnswer) {
    const review = getAnswerReview(answer)
    setReviewingAnswer(answer)
    setReviewRating(String(review?.rating ?? answer.rating ?? 10))
    setReviewText(review?.text ?? answer.review_text ?? '')
  }

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
        <h1 className="mt-4 font-heading text-xl font-bold text-white">{t.homeworkNotFound}</h1>
        <Link to="/groups" className="btn-primary mt-6 !py-2.5">{t.backToGroups}</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/groups/${homework.group}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          {t.backToGroup}
        </Link>
        <PageHeader
          title={homework.title}
          description={`${t.due} ${formatDate(homework.due_date, t.noDeadline)}`}
          actions={
            homeworkFileUrl ? (
              <a href={homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                <Download className="h-4 w-4" />
                {t.downloadFile}
              </a>
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-5 text-center">
          <Users className="mx-auto mb-2 h-5 w-5 text-blue-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{answers.length}</div>
          <div className="text-xs text-white/35">{t.submissions}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <CheckCircle className="mx-auto mb-2 h-5 w-5 text-emerald-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{reviewedCount}</div>
          <div className="text-xs text-white/35">{t.reviewed}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Clock className="mx-auto mb-2 h-5 w-5 text-amber-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{pendingCount}</div>
          <div className="text-xs text-white/35">{t.pending}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Calendar className="mx-auto mb-2 h-5 w-5 text-violet-400/40" />
          <div className="font-heading text-lg font-bold text-white">{formatDate(homework.due_date, t.noDeadline)}</div>
          <div className="text-xs text-white/35">{t.dueDate}</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-400/10">
            <FileText className="h-6 w-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-base font-semibold text-white/80">{t.assignment}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {homework.description || t.noInstructionsProvided}
            </p>
            {homeworkFileUrl && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a href={homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs text-accent-light/70">
                  <Download className="h-3.5 w-3.5" />
                  {t.downloadFile}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="font-heading text-sm font-semibold text-white/70">{t.studentSubmissions}</h3>
        </div>
        {isLoadingAnswers ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : answers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Users className="h-10 w-10 text-white/15" />
            <p className="mt-4 text-sm font-medium text-white/50">{t.noSubmissionsYet}</p>
            <p className="mt-1 text-sm text-white/30">{t.studentAnswersWillAppear}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.student}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.submitted}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.status}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.fileAttachment}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.yourCommentOptional}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.review}</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((answer) => {
                  const fileUrl = buildFileUrl(answer.file)
                  const review = getAnswerReview(answer)
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
                      <td className="px-6 py-3.5 text-white/40">{formatDate(answer.submitted_at, '-')}</td>
                      <td className="px-6 py-3.5">
                        {review ? (
                          <StatusBadge label={t.reviewed} variant="active" />
                        ) : (
                          <StatusBadge label={t.pending} variant="pending" />
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {fileUrl ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs text-accent-light/70">
                            <Download className="h-3.5 w-3.5" />
                            {t.download}
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
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {review && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                              <Star className="h-3.5 w-3.5" />
                              {review.rating}/10
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => openReview(answer)}
                            className="btn-secondary !px-3 !py-1.5 text-xs"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {review ? t.editReview : t.review}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewingAnswer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !reviewMutation.isPending) setReviewingAnswer(null)
          }}
        >
          <form
            className="glass-card relative w-full max-w-lg overflow-hidden p-0"
            onSubmit={(event) => {
              event.preventDefault()
              if (!reviewMutation.isPending) reviewMutation.mutate()
            }}
          >
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (!reviewMutation.isPending) setReviewingAnswer(null)
              }}
              className="absolute right-4 top-4 z-30 rounded-xl p-2 text-white/45 transition hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-white/[0.06] px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/70">{t.reviewHomework}</p>
              <h2 className="mt-1 font-heading text-xl font-bold text-white">
                {reviewingAnswer.student_name || `${t.student} ${reviewingAnswer.student}`}
              </h2>
              <p className="mt-1 text-sm text-white/40">{homework.title}</p>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/65">{t.scoreOutOfTen}</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  value={reviewRating}
                  onChange={(event) => setReviewRating(event.target.value)}
                  className="input-field w-full"
                  disabled={reviewMutation.isPending}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/65">{t.teacherComment}</label>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder={t.teacherCommentPlaceholder}
                  className="input-field min-h-[120px] resize-y"
                  disabled={reviewMutation.isPending}
                />
              </div>

              <button type="submit" className="btn-primary w-full justify-center !py-3" disabled={reviewMutation.isPending}>
                {reviewMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    {t.saveReview}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
