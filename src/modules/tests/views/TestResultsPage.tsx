import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, BarChart3, Trophy, TrendingUp, Loader2, HelpCircle } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { getTestDetail, getTestResults } from '@/modules/tests/api'
import type { StudentTestResult } from '@/modules/tests/types'
import { useCommonCopy } from '@/shared/i18n'

type ResultRow = StudentTestResult & {
  student_name?: string
  student_full_name?: string
  full_name?: string
  email?: string
}

function scoreColor(pct: number) {
  if (pct >= 90) return 'text-emerald-400'
  if (pct >= 70) return 'text-amber-400'
  return 'text-rose-400'
}

function getStudentName(result: ResultRow) {
  return result.student_name || result.student_full_name || result.full_name || `Student #${result.student}`
}

function getPercentage(result: ResultRow) {
  if (Number.isFinite(Number(result.percentage))) return Math.round(Number(result.percentage))
  const score = Number(result.score) || 0
  const maxScore = Number(result.max_score) || 0
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
}

function buildDistribution(results: ResultRow[]) {
  const buckets = [
    { range: '90-100%', min: 90, max: 100, color: 'bg-emerald-500' },
    { range: '80-89%', min: 80, max: 89, color: 'bg-blue-500' },
    { range: '70-79%', min: 70, max: 79, color: 'bg-amber-500' },
    { range: '60-69%', min: 60, max: 69, color: 'bg-orange-500' },
    { range: '<60%', min: 0, max: 59, color: 'bg-rose-500' },
  ]

  return buckets.map((bucket) => {
    const count = results.filter((result) => {
      const percentage = getPercentage(result)
      return percentage >= bucket.min && percentage <= bucket.max
    }).length

    return {
      ...bucket,
      count,
      pct: results.length ? Math.round((count / results.length) * 100) : 0,
    }
  })
}

export default function TestResultsPage() {
  const { t } = useCommonCopy()
  const { id } = useParams()
  const testId = Number(id)

  const { data: test, isLoading: isLoadingTest } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => getTestDetail(testId),
    enabled: Number.isFinite(testId),
  })

  const { data: resultsData, isLoading: isLoadingResults } = useQuery({
    queryKey: ['test-results', testId],
    queryFn: () => getTestResults(testId),
    enabled: Number.isFinite(testId),
  })

  const results = ((resultsData?.results ?? []) as ResultRow[])
    .slice()
    .sort((a, b) => getPercentage(b) - getPercentage(a))

  const percentages = results.map(getPercentage)
  const average = percentages.length
    ? Math.round(percentages.reduce((sum, pct) => sum + pct, 0) / percentages.length)
    : 0
  const topScore = percentages.length ? Math.max(...percentages) : 0
  const lowestScore = percentages.length ? Math.min(...percentages) : 0
  const distribution = buildDistribution(results)

  if (isLoadingTest || isLoadingResults) {
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
        <Link to="/groups" className="btn-primary mt-6 !py-2.5">{t.backToGroups}</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/tests/${id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          {t.backToTest}
        </Link>
        <PageHeader
          title={`${test.title} — ${t.results}`}
          description={t.testResultsDescription}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-5 text-center">
          <Users className="mx-auto mb-2 h-5 w-5 text-blue-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{results.length}</div>
          <div className="text-xs text-white/35">{t.submissions}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <BarChart3 className="mx-auto mb-2 h-5 w-5 text-emerald-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{average}%</div>
          <div className="text-xs text-white/35">{t.average}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <Trophy className="mx-auto mb-2 h-5 w-5 text-amber-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{topScore}%</div>
          <div className="text-xs text-white/35">{t.topScore}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <TrendingUp className="mx-auto mb-2 h-5 w-5 text-violet-400/40" />
          <div className="font-heading text-2xl font-bold text-white">{lowestScore}%</div>
          <div className="text-xs text-white/35">{t.lowest}</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-heading text-sm font-semibold text-white/60">{t.scoreDistribution}</h3>
        <div className="space-y-3">
          {distribution.map((bar) => (
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

      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="font-heading text-sm font-semibold text-white/70">{t.studentResults}</h3>
        </div>
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Users className="h-10 w-10 text-white/15" />
            <p className="mt-4 text-sm font-medium text-white/50">{t.noTestSubmissionsYet}</p>
            <p className="mt-1 text-sm text-white/30">{t.testResultsWillAppear}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.rank}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.student}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.score}</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">{t.percentage}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const percentage = getPercentage(result)
                  const studentName = getStudentName(result)

                  return (
                    <tr key={result.id} className="border-b border-white/[0.04] transition hover:bg-accent/[0.02]">
                      <td className="px-6 py-3.5">
                        {index < 3 ? (
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-amber-500/15 text-amber-400' :
                            index === 1 ? 'bg-gray-400/15 text-gray-300' :
                            'bg-orange-600/15 text-orange-400'
                          }`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="pl-2 text-white/30">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <Link to={`/students/${result.student}`} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-purple-500/25 text-xs font-bold text-white/70">
                            {studentName[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <span className="block font-medium text-white/80 hover:text-white">{studentName}</span>
                            {result.email && <span className="text-xs text-white/30">{result.email}</span>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-white/50">{result.score}/{result.max_score}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full ${percentage >= 90 ? 'bg-emerald-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${scoreColor(percentage)}`}>{percentage}%</span>
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
    </div>
  )
}
