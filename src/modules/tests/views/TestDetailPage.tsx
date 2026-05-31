import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit3, HelpCircle, Calendar, Users, BarChart3, Clock, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'

const mockQuestions = [
  { id: 1, text: 'What is the time complexity of binary search?', points: 10, answers: 4 },
  { id: 2, text: 'Which data structure uses FIFO ordering?', points: 5, answers: 4 },
  { id: 3, text: 'What is the worst case of quicksort?', points: 10, answers: 4 },
  { id: 4, text: 'Define a balanced binary tree.', points: 15, answers: 3 },
  { id: 5, text: 'What is Big-O notation?', points: 10, answers: 4 },
]

export default function TestDetailPage() {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <Link to="/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <PageHeader
          title="Midterm Exam"
          description="Computer Science 101 · Created March 1, 2026"
          actions={
            <div className="flex gap-2">
              <Link to={`/tests/${id}/builder`} className="btn-secondary text-sm">
                <Edit3 className="h-4 w-4" />
                Edit Questions
              </Link>
              <Link to={`/tests/${id}/results`} className="btn-primary text-sm">
                <BarChart3 className="h-4 w-4" />
                View Results
              </Link>
            </div>
          }
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-5 text-center">
          <HelpCircle className="mx-auto h-5 w-5 text-accent-light/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">{mockQuestions.length}</div>
          <div className="text-xs text-white/35">Questions</div>
        </div>
        <div className="glass-card p-5 text-center">
          <BarChart3 className="mx-auto h-5 w-5 text-emerald-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">50</div>
          <div className="text-xs text-white/35">Total Points</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Users className="mx-auto h-5 w-5 text-amber-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">20</div>
          <div className="text-xs text-white/35">Submissions</div>
        </div>
        <div className="glass-card p-5 text-center">
          <CheckCircle className="mx-auto h-5 w-5 text-violet-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">78%</div>
          <div className="text-xs text-white/35">Avg Score</div>
        </div>
      </div>

      {/* Description */}
      <div className="glass-card p-6">
        <h3 className="font-heading text-sm font-semibold text-white/60 mb-3">Description</h3>
        <p className="text-sm leading-relaxed text-white/50">
          This midterm exam covers all topics from weeks 1-8, including algorithms, data structures, sorting, searching, and Big-O notation. Students have 90 minutes to complete all questions. Each question is worth the indicated number of points.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/30">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            90 min duration
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            March 1, 2026
          </span>
        </div>
      </div>

      {/* Questions list */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="font-heading text-sm font-semibold text-white/70">Questions</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {mockQuestions.map((q, i) => (
            <div key={q.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-white/[0.02]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/[0.06] text-xs font-bold text-accent-light/70">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-white/70">{q.text}</p>
                <p className="mt-0.5 text-xs text-white/30">{q.answers} answer options</p>
              </div>
              <span className="shrink-0 rounded-full bg-accent/[0.08] px-2.5 py-0.5 text-xs font-semibold text-accent-light">
                {q.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
