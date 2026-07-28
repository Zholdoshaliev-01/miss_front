import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock, HelpCircle, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { getStudentTestDetail, startStudentTest, submitStudentTest } from '@/modules/tests/api'
import { useCommonCopy } from '@/shared/i18n'

function getErrorMessage(err: any, fallback: string) {
  const data = err.response?.data
  return data?.detail || data?.answers?.[0] || err.message || fallback
}

function formatDeadline(value: string | null | undefined, messages: { noTimeLimit: string; deadline: string }) {
  if (!value) return messages.noTimeLimit
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return messages.noTimeLimit
  return `${messages.deadline} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export default function TestPage() {
  const { t } = useCommonCopy()
  const { id } = useParams()
  const testId = Number(id)
  const [attempt, setAttempt] = useState<any | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<any | null>(null)

  const { data: test, isLoading } = useQuery({
    queryKey: ['student-test-detail', testId],
    queryFn: () => getStudentTestDetail(testId),
    enabled: Number.isFinite(testId),
  })

  const questions = attempt?.questions ?? test?.questions ?? []
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const allAnswered = questions.length > 0 && answeredCount === questions.length

  const startMutation = useMutation({
    mutationFn: () => startStudentTest(testId),
    onSuccess: (data) => {
      setAttempt(data)
      setAnswers({})
      setResult(null)
    },
    onError: (err) => toast.error(getErrorMessage(err, t.testRequestFailed)),
  })

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!attempt?.result_id) throw new Error('Start the test first')
      const payload = Object.entries(answers).map(([questionId, answerId]) => ({
        question_id: Number(questionId),
        answer_id: Number(answerId),
      }))
      return submitStudentTest(attempt.result_id, payload)
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success(t.testSubmitted)
    },
    onError: (err) => toast.error(getErrorMessage(err, t.testRequestFailed)),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/student/tests" className="inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
        <ArrowLeft className="h-4 w-4" />
        {t.backToTests}
      </Link>

      <div className="glass-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg">
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
                {attempt?.title ?? test?.title ?? `${t.test} #${id}`}
              </h1>
              <p className="mt-1 text-sm text-white/40">{attempt?.description ?? test?.description ?? t.answerAllQuestions}</p>
            </div>
          </div>

          {!attempt && !result && (
            <button
              type="button"
              className="btn-primary !py-2.5"
              disabled={startMutation.isPending}
              onClick={() => startMutation.mutate()}
            >
              {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {t.startTest}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-white/35">
            <HelpCircle className="h-4 w-4" />
            <span>{t.questions}: {questions.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-white/35">
            <Clock className="h-4 w-4" />
            <span>{formatDeadline(attempt?.deadline, t)}</span>
          </div>
        </div>
      </div>

      {result ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          <h2 className="mt-4 font-heading text-xl font-bold text-white">{t.submitted}</h2>
          <p className="mt-2 text-sm text-white/45">
            {t.score}: {result.score ?? 0}/{result.max_score ?? 0}
          </p>
        </div>
      ) : !attempt ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <HelpCircle className="h-10 w-10 text-white/15" />
          <p className="mt-4 font-heading text-sm font-medium text-white/50">{t.startTheTest}</p>
          <p className="mt-1 text-sm text-white/30">{t.attemptBegins}</p>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!allAnswered) {
              toast.error(t.pleaseAnswerAll)
              return
            }
            submitMutation.mutate()
          }}
        >
          {questions.map((question: any, index: number) => (
            <div key={question.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/30">{t.question} {index + 1}</p>
                  <h2 className="mt-1 font-heading text-base font-semibold text-white">{question.text}</h2>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: 'var(--input-bg)', color: 'var(--color-text-muted)' }}>
                  {question.points} {t.pointsShort}
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                {question.answers.map((answer: any) => {
                  const selected = answers[question.id] === answer.id
                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: answer.id }))}
                      className={[
                        'rounded-xl border px-4 py-3 text-left text-sm transition',
                        selected
                          ? 'border-accent/70 bg-accent/15 text-white'
                          : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      {answer.text}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <button type="submit" className="btn-primary w-full !py-3" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t.submitTest} ({answeredCount}/{questions.length})
          </button>
        </form>
      )}
    </div>
  )
}
