import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, BarChart3, Trophy, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'


const mockResults = [
  { id: 1, name: 'Aigerim Kasenova', score: 48, maxScore: 50, pct: 96, rank: 1 },
  { id: 2, name: 'Madina Akhmetova', score: 45, maxScore: 50, pct: 90, rank: 2 },
  { id: 3, name: 'Daulet Muratov', score: 42, maxScore: 50, pct: 84, rank: 3 },
  { id: 4, name: 'Arman Suleimenov', score: 38, maxScore: 50, pct: 76, rank: 4 },
  { id: 5, name: 'Nursultan Tlegenov', score: 35, maxScore: 50, pct: 70, rank: 5 },
]

function scoreColor(pct: number) {
  if (pct >= 90) return 'text-emerald-400'
  if (pct >= 70) return 'text-amber-400'
  return 'text-rose-400'
}

export default function TestResultsPage() {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/tests/${id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back to Test
        </Link>
        <PageHeader
          title="Midterm Exam — Results"
          description="Score distribution and student submissions."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-5 text-center">
          <Users className="mx-auto h-5 w-5 text-blue-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">{mockResults.length}</div>
          <div className="text-xs text-white/35">Submissions</div>
        </div>
        <div className="glass-card p-5 text-center">
          <BarChart3 className="mx-auto h-5 w-5 text-emerald-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">83%</div>
          <div className="text-xs text-white/35">Average</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Trophy className="mx-auto h-5 w-5 text-amber-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">96%</div>
          <div className="text-xs text-white/35">Top Score</div>
        </div>
        <div className="glass-card p-5 text-center">
          <TrendingUp className="mx-auto h-5 w-5 text-violet-400/40 mb-2" />
          <div className="font-heading text-2xl font-bold text-white">70%</div>
          <div className="text-xs text-white/35">Lowest</div>
        </div>
      </div>

      {/* Score distribution visual */}
      <div className="glass-card p-6">
        <h3 className="mb-4 font-heading text-sm font-semibold text-white/60">Score Distribution</h3>
        <div className="space-y-3">
          {[
            { range: '90-100%', count: 2, pct: 40, color: 'bg-emerald-500' },
            { range: '80-89%', count: 1, pct: 20, color: 'bg-blue-500' },
            { range: '70-79%', count: 2, pct: 40, color: 'bg-amber-500' },
            { range: '60-69%', count: 0, pct: 0, color: 'bg-orange-500' },
            { range: '<60%', count: 0, pct: 0, color: 'bg-rose-500' },
          ].map((bar) => (
            <div key={bar.range} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-white/40">{bar.range}</span>
              <div className="h-6 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className={`h-full rounded-full ${bar.color} transition-all duration-700`}
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs text-white/40">{bar.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Results table */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="font-heading text-sm font-semibold text-white/70">Student Results</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Rank</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Student</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Score</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {mockResults.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.04] transition hover:bg-accent/[0.02]">
                <td className="px-6 py-3.5">
                  {r.rank <= 3 ? (
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      r.rank === 1 ? 'bg-amber-500/15 text-amber-400' :
                      r.rank === 2 ? 'bg-gray-400/15 text-gray-300' :
                      'bg-orange-600/15 text-orange-400'
                    }`}>
                      {r.rank}
                    </span>
                  ) : (
                    <span className="pl-2 text-white/30">{r.rank}</span>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <Link to={`/students/${r.id}`} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-purple-500/25 text-xs font-bold text-white/70">
                      {r.name[0]}
                    </div>
                    <span className="font-medium text-white/80 hover:text-white">{r.name}</span>
                  </Link>
                </td>
                <td className="px-6 py-3.5 text-white/50">{r.score}/{r.maxScore}</td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${r.pct >= 90 ? 'bg-emerald-500' : r.pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${scoreColor(r.pct)}`}>{r.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
