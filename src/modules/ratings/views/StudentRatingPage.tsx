import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Medal, Star, Users, Loader2, Search, ChevronDown } from 'lucide-react'
import { getGroups, getGroupLeaderboard, getGlobalLeaderboard } from '@/modules/groups/api'
import type { LeaderboardEntry } from '@/modules/groups/api'
import { PageHeader } from '@/shared/ui/PageHeader'

function getRankBadge(index: number) {
  if (index === 0)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}>
        <Trophy className="h-4 w-4 text-white" />
      </div>
    )
  if (index === 1)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', boxShadow: '0 2px 8px rgba(192,192,192,0.4)' }}>
        <Medal className="h-4 w-4 text-white" />
      </div>
    )
  if (index === 2)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #CD7F32, #B8860B)', boxShadow: '0 2px 8px rgba(205,127,50,0.4)' }}>
        <Star className="h-4 w-4 text-white" />
      </div>
    )
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--input-bg)' }}>
      <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
        {index + 1}
      </span>
    </div>
  )
}

export default function StudentRatingPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')

  const { data: paginatedGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  })

  const groups = paginatedGroups?.results ?? []

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard', selectedGroupId],
    queryFn: () =>
      selectedGroupId === 'all'
        ? getGlobalLeaderboard()
        : getGroupLeaderboard(selectedGroupId),
  })

  const entries: LeaderboardEntry[] = leaderboardData?.results ?? []

  const filteredEntries = entries.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()),
  )

  // Sort by rating_points descending
  const sorted = [...filteredEntries].sort((a, b) => b.rating_points - a.rating_points)

  const totalPoints = entries.reduce((acc, e) => acc + e.rating_points, 0)
  const avgPoints = entries.length > 0 ? Math.round(totalPoints / entries.length) : 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="Student Rating"
        description="Track student performance across groups with leaderboard rankings."
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {entries.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Total Students</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {avgPoints}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Avg Rating</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {entries.reduce((acc, e) => acc + e.tests_total_score, 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Total Test Score</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {entries.reduce((acc, e) => acc + e.homeworks_done, 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>HW Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Group filter */}
        <div className="relative w-full sm:w-64">
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="input-field w-full appearance-none !pr-10"
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field input-with-icon w-full"
          />
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-3 h-12 w-12" style={{ color: 'var(--color-text-faint)' }} />
            <p className="font-heading text-lg font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              No students found
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>
              {search ? 'Try a different search term' : 'Students will appear here once they join groups'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--color-text-faint)' }}>
                    Group
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
                    Tests Score
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
                    HW Done
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, idx) => (
                  <tr
                    key={entry.student_id}
                    className="transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <td className="px-6 py-4">
                      {getRankBadge(idx)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{
                            background: idx < 3
                              ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))'
                              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          }}
                        >
                          {entry.full_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {entry.full_name}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                            {entry.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: 'var(--input-bg)', color: 'var(--color-text-muted)' }}
                      >
                        {entry.group_name || `Group ${entry.group_id ?? '-'}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                        {entry.tests_total_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                        {entry.homeworks_done}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 rounded-full px-3 py-1" style={{
                        background: idx === 0
                          ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.15))'
                          : idx < 3
                            ? 'var(--color-accent-glow)'
                            : 'var(--input-bg)',
                      }}>
                        <Star className="h-3.5 w-3.5" style={{
                          color: idx === 0 ? '#FFD700' : idx < 3 ? 'var(--color-accent-light)' : 'var(--color-text-faint)',
                        }} />
                        <span className="font-heading text-sm font-bold" style={{
                          color: idx === 0 ? '#FFD700' : idx < 3 ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
                        }}>
                          {entry.rating_points}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
