import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Calendar, CheckCircle, Clock, Edit3, HelpCircle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { getTestDetail } from '@/modules/tests/api'
import { useCommonCopy } from '@/shared/i18n'

export default function TestDetailPage() {
  const { t } = useCommonCopy()
  const { id } = useParams()
  const testId = Number(id)

  const { data: test, isLoading } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => getTestDetail(testId),
    enabled: Number.isFinite(testId),
  })

  const questions = test?.questions ?? []
  const totalPoints = questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0)

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!test) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <HelpCircle className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">{t.testNotFound}</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          {t.backToGroup}
        </Link>
        <PageHeader
          title={test.title}
          description={test.description || t.noDescriptionYet}
          actions={
            <div className="flex gap-2">
              <Link to={`/tests/${id}/builder`} className="btn-secondary text-sm">
                <Edit3 className="h-4 w-4" />
                {t.editQuestions}
              </Link>
              <Link to={`/tests/${id}/results`} className="btn-primary text-sm">
                <BarChart3 className="h-4 w-4" />
                {t.viewResults}
              </Link>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-5 text-center">
          <HelpCircle className="mx-auto mb-2 h-5 w-5 text-accent-light/40" />
          <div className="font-heading text-2xl font-bold text-white">{questions.length}</div>
          <div className="text-xs text-white/35">{t.questions}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <BarChart3 className="mx-auto mb-2 h-5 w-5 text-emerald-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{totalPoints}</div>
          <div className="text-xs text-white/35">{t.totalPoints}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <CheckCircle className="mx-auto mb-2 h-5 w-5 text-violet-400/40" />
          <div className="font-heading text-2xl font-bold text-white">
            {questions.filter((question) => question.answers?.some((answer) => answer.is_correct)).length}
          </div>
          <div className="text-xs text-white/35">{t.withCorrectAnswer}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Calendar className="mx-auto mb-2 h-5 w-5 text-amber-400/40" />
          <div className="font-heading text-sm font-bold text-white">
            {new Date(test.created_at).toLocaleDateString()}
          </div>
          <div className="text-xs text-white/35">{t.created}</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-3 font-heading text-sm font-semibold text-white/60">{t.description}</h3>
        <p className="text-sm leading-relaxed text-white/50">{test.description || t.noDescriptionYet}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/30">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {t.noTimeLimit}
          </span>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="font-heading text-sm font-semibold text-white/70">{t.questions}</h3>
        </div>
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <HelpCircle className="h-10 w-10 text-white/15" />
            <p className="mt-4 text-sm font-medium text-white/50">{t.noQuestionsSaved}</p>
            <Link to={`/tests/${id}/builder`} className="btn-primary mt-5 text-sm">{t.addQuestions}</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {questions.map((question, index) => (
              <div key={question.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-white/[0.02]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/[0.06] text-xs font-bold text-accent-light/70">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/70">{question.text}</p>
                  <p className="mt-0.5 text-xs text-white/30">
                    {question.answers?.length ?? 0} {t.answerOptions} · {question.answers?.some((answer) => answer.is_correct) ? t.hasCorrectAnswer : t.noCorrectAnswer}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-accent/[0.08] px-2.5 py-0.5 text-xs font-semibold text-accent-light">
                  {question.points} {t.pointsShort}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
