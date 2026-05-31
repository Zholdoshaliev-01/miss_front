import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, Save } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'

interface Answer {
  id: number
  text: string
  isCorrect: boolean
}

interface Question {
  id: number
  text: string
  points: number
  answers: Answer[]
}

const initialQuestions: Question[] = [
  {
    id: 1,
    text: 'What is the time complexity of binary search?',
    points: 10,
    answers: [
      { id: 1, text: 'O(n)', isCorrect: false },
      { id: 2, text: 'O(log n)', isCorrect: true },
      { id: 3, text: 'O(n²)', isCorrect: false },
      { id: 4, text: 'O(1)', isCorrect: false },
    ],
  },
  {
    id: 2,
    text: 'Which data structure uses FIFO ordering?',
    points: 5,
    answers: [
      { id: 5, text: 'Stack', isCorrect: false },
      { id: 6, text: 'Queue', isCorrect: true },
      { id: 7, text: 'Array', isCorrect: false },
      { id: 8, text: 'Tree', isCorrect: false },
    ],
  },
  {
    id: 3,
    text: 'What is the worst case of quicksort?',
    points: 10,
    answers: [
      { id: 9, text: 'O(n log n)', isCorrect: false },
      { id: 10, text: 'O(n²)', isCorrect: true },
      { id: 11, text: 'O(n)', isCorrect: false },
    ],
  },
]

export default function TestBuilderPage() {
  const { id } = useParams()
  const [questions] = useState<Question[]>(initialQuestions)
  const [expandedId, setExpandedId] = useState<number | null>(1)

  const totalPoints = questions.reduce((s, q) => s + q.points, 0)

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
            <div className="flex gap-2">
              <button type="button" className="btn-secondary text-sm">
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button type="button" className="btn-primary text-sm">
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>
          }
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => {
          const isExpanded = expandedId === q.id
          return (
            <div key={q.id} className="glass-card overflow-hidden">
              {/* Question header */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.02]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/[0.08] text-sm font-bold text-accent-light">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white/80">{q.text}</p>
                  <p className="mt-0.5 text-xs text-white/30">{q.answers.length} answers · {q.points} points</p>
                </div>
                <span className="shrink-0 rounded-full bg-accent/[0.08] px-2.5 py-0.5 text-xs font-semibold text-accent-light">
                  {q.points} pts
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-white/25" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-white/25" />
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                  {/* Question text edit */}
                  <label className="mb-1.5 block text-xs font-medium text-white/40">Question</label>
                  <input className="input-field mb-4" defaultValue={q.text} />

                  <label className="mb-1.5 block text-xs font-medium text-white/40">Points</label>
                  <input className="input-field mb-4 w-24" type="number" defaultValue={q.points} />

                  {/* Answers */}
                  <label className="mb-2 block text-xs font-medium text-white/40">Answer Options</label>
                  <div className="space-y-2">
                    {q.answers.map((a) => (
                      <div
                        key={a.id}
                        className={`flex items-center gap-3 rounded-xl p-3 transition ${
                          a.isCorrect
                            ? 'bg-emerald-500/[0.06] ring-1 ring-emerald-500/20'
                            : 'bg-white/[0.02] ring-1 ring-white/[0.06]'
                        }`}
                      >
                        <CheckCircle
                          className={`h-4 w-4 shrink-0 ${
                            a.isCorrect ? 'text-emerald-400' : 'text-white/15'
                          }`}
                        />
                        <input
                          className="flex-1 bg-transparent text-sm text-white/80 outline-none placeholder:text-white/20"
                          defaultValue={a.text}
                        />
                        <button type="button" className="shrink-0 text-white/15 hover:text-rose-400 transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button type="button" className="btn-ghost text-xs text-accent-light/60">
                      <Plus className="h-3.5 w-3.5" />
                      Add Answer
                    </button>
                    <button type="button" className="btn-ghost text-xs text-rose-400/60 hover:text-rose-400">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add question card */}
      <button
        type="button"
        className="glass-card flex w-full items-center justify-center gap-2 p-8 text-sm font-medium text-white/30 transition hover:border-accent/20 hover:text-accent-light/60 hover:bg-accent/[0.02]"
      >
        <Plus className="h-5 w-5" />
        Add New Question
      </button>
    </div>
  )
}
