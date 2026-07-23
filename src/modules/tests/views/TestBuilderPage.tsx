import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/shared/ui/PageHeader'
import {
  createQuestionAnswer,
  createTestQuestion,
  deleteQuestionAnswer,
  deleteTestQuestion,
  getTestDetail,
  updateQuestionAnswer,
  updateTestQuestion,
} from '@/modules/tests/api'
import type { TestAnswer, TestQuestion } from '@/modules/tests/types'

function getErrorMessage(err: any) {
  const data = err.response?.data
  return (
    data?.detail ||
    data?.text?.[0] ||
    data?.points?.[0] ||
    data?.is_correct?.[0] ||
    err.message ||
    'Request failed'
  )
}

function AnswerEditor({
  answer,
  questionId,
  onSaved,
  disabled,
}: {
  answer: TestAnswer
  questionId: number
  onSaved: () => void
  disabled?: boolean
}) {
  const [text, setText] = useState(answer.text)
  const [isCorrect, setIsCorrect] = useState(Boolean(answer.is_correct))

  const saveAnswer = useMutation({
    mutationFn: () => updateQuestionAnswer(questionId, answer.id, { text, is_correct: isCorrect }),
    onSuccess: () => {
      toast.success('Answer saved')
      onSaved()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteAnswer = useMutation({
    mutationFn: () => deleteQuestionAnswer(questionId, answer.id),
    onSuccess: () => {
      toast.success('Answer deleted')
      onSaved()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3 transition ${
        isCorrect ? 'bg-emerald-500/[0.06] ring-1 ring-emerald-500/20' : 'bg-white/[0.02] ring-1 ring-white/[0.06]'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsCorrect((value) => !value)}
        className="shrink-0"
        disabled={disabled || saveAnswer.isPending}
        title="Toggle correct answer"
      >
        <CheckCircle className={`h-4 w-4 ${isCorrect ? 'text-emerald-400' : 'text-white/15'}`} />
      </button>
      <input
        className="flex-1 bg-transparent text-sm text-white/80 outline-none placeholder:text-white/20"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={disabled || saveAnswer.isPending}
        placeholder="Answer text"
      />
      <button
        type="button"
        className="btn-ghost !py-1 !px-2 text-xs"
        onClick={() => saveAnswer.mutate()}
        disabled={disabled || saveAnswer.isPending || !text.trim()}
      >
        {saveAnswer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        className="shrink-0 text-white/15 transition hover:text-rose-400"
        onClick={() => deleteAnswer.mutate()}
        disabled={disabled || deleteAnswer.isPending}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function QuestionEditor({ testId, question, onSaved }: { testId: number; question: TestQuestion; onSaved: () => void }) {
  const [text, setText] = useState(question.text)
  const [points, setPoints] = useState(question.points)
  const [answerText, setAnswerText] = useState('')
  const answers = question.answers ?? []

  const saveQuestion = useMutation({
    mutationFn: () => updateTestQuestion(testId, question.id, { text, points: Number(points) || 1 }),
    onSuccess: () => {
      toast.success('Question saved')
      onSaved()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const removeQuestion = useMutation({
    mutationFn: () => deleteTestQuestion(testId, question.id),
    onSuccess: () => {
      toast.success('Question deleted')
      onSaved()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const addAnswer = useMutation({
    mutationFn: () => createQuestionAnswer(question.id, { text: answerText, is_correct: answers.length === 0 }),
    onSuccess: () => {
      setAnswerText('')
      toast.success('Answer added')
      onSaved()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const busy = saveQuestion.isPending || removeQuestion.isPending || addAnswer.isPending

  return (
    <div className="glass-card overflow-hidden">
      <div className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/40">Question</label>
            <input className="input-field" value={text} onChange={(event) => setText(event.target.value)} disabled={busy} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/40">Points</label>
            <input
              className="input-field"
              type="number"
              min={1}
              value={points}
              onChange={(event) => setPoints(Number(event.target.value))}
              disabled={busy}
            />
          </div>
          <button
            type="button"
            className="btn-primary !py-3 text-sm"
            onClick={() => saveQuestion.mutate()}
            disabled={busy || !text.trim()}
          >
            {saveQuestion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-white/40">Answer Options</label>
          <div className="space-y-2">
            {answers.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/35">
                No answers yet. Add at least one correct answer.
              </div>
            ) : (
              answers.map((answer) => (
                <AnswerEditor key={answer.id} answer={answer} questionId={question.id} onSaved={onSaved} disabled={busy} />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            <input
              className="input-field !py-2 text-sm"
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              placeholder="New answer option"
              disabled={busy}
            />
            <button
              type="button"
              className="btn-secondary !py-2 text-sm"
              onClick={() => addAnswer.mutate()}
              disabled={busy || !answerText.trim()}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          <button
            type="button"
            className="btn-ghost text-xs text-rose-400/70 hover:text-rose-400"
            onClick={() => removeQuestion.mutate()}
            disabled={busy}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Question
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TestBuilderPage() {
  const { id } = useParams()
  const testId = Number(id)
  const queryClient = useQueryClient()

  const { data: test, isLoading } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => getTestDetail(testId),
    enabled: Number.isFinite(testId),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['test', testId] })
    queryClient.invalidateQueries({ queryKey: ['group-tests'] })
  }

  const addQuestion = useMutation({
    mutationFn: () => createTestQuestion(testId, { text: 'New question', points: 1 }),
    onSuccess: () => {
      toast.success('Question added')
      refresh()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
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

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/tests/${id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back to Test
        </Link>
        <PageHeader
          title="Test Builder"
          description={`${questions.length} questions · ${totalPoints} total points`}
          actions={
            <button type="button" className="btn-primary text-sm" onClick={() => addQuestion.mutate()} disabled={addQuestion.isPending}>
              {addQuestion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Question
            </button>
          }
        />
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
            <Plus className="h-10 w-10 text-white/15" />
            <p className="mt-4 font-heading text-sm font-medium text-white/50">No questions yet</p>
            <button type="button" className="btn-primary mt-5 text-sm" onClick={() => addQuestion.mutate()} disabled={addQuestion.isPending}>
              Add first question
            </button>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionEditor key={question.id} testId={testId} question={question} onSaved={refresh} />
          ))
        )}
      </div>
    </div>
  )
}
