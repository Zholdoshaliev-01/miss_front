import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, ClipboardCheck, FileText, GraduationCap, Loader2, Star, Trophy, UserRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getStudentGlobalLeaderboard, getStudentGroupLeaderboard, getStudentGroups } from '@/modules/student/api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import axios from 'axios'

function normalizeStudentGroup(raw: any) {
  return {
    id: raw.group_id ?? raw.id,
    group_name: raw.group_name ?? raw.name ?? 'Untitled group',
    level: raw.group_level ?? raw.level ?? '',
    status: raw.status ?? '',
    joined_at: raw.joined_at ?? raw.created_date,
    teacher_name: raw.teacher_name ?? raw.teacher_full_name ?? raw.teacher?.full_name ?? raw.teacher?.username ?? '',
    teacher_email: raw.teacher_email ?? raw.teacher?.email ?? '',
    description: raw.description ?? raw.group_description ?? '',
    materials_count: raw.materials_count ?? 0,
    homeworks_count: raw.homeworks_count ?? 0,
    tests_count: raw.tests_count ?? 0,
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'recently'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'recently'
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getLeaderboardErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return 'Unknown error'
  const data = error.response?.data as any
  return data?.detail || data?.error || `Request failed with status ${error.response?.status ?? 'unknown'}`
}

export default function StudentGroupDetailPage() {
  const { groupId } = useParams()
  const numericGroupId = Number(groupId)
  const user = useAuthStore((state) => state.user)
  const [ratingScope, setRatingScope] = useState<'group' | 'teacher'>('group')

  const { data: rawGroupsData, isLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
  })

  const groups = (Array.isArray(rawGroupsData)
    ? rawGroupsData
    : (rawGroupsData as any)?.results ?? []
  ).map(normalizeStudentGroup)

  const group = groups.find((item: any) => item.id === numericGroupId)

  const { data: leaderboardData, isLoading: isLoadingLeaderboard, error: leaderboardError } = useQuery({
    queryKey: ['student-leaderboard', numericGroupId, ratingScope],
    queryFn: () => ratingScope === 'group'
      ? getStudentGroupLeaderboard(numericGroupId)
      : getStudentGlobalLeaderboard(),
    enabled: Number.isFinite(numericGroupId),
  })

  const leaderboard = Array.isArray(leaderboardData)
    ? leaderboardData
    : leaderboardData?.results ?? []
  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.rating_points - a.rating_points)
  const myRankIndex = sortedLeaderboard.findIndex((entry) =>
    entry.email === user?.email || entry.full_name === user?.username,
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <GraduationCap className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">Group not found</h1>
        <Link to="/student/groups" className="btn-primary mt-6 !py-2.5">Back to Groups</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/student/groups" className="inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
        <ArrowLeft className="h-4 w-4" />
        Back to My Groups
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/[0.08] to-purple-500/[0.03] p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-[90px]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/30 to-purple-500/20 text-accent-light ring-1 ring-white/10">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-white">{group.group_name}</h1>
              <p className="mt-1 text-sm text-white/45">
                {group.level ? `Level ${group.level}` : 'Level not set'} · Joined {formatDate(group.joined_at)}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                {group.description || 'No group description yet.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:min-w-72">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/55">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-white/30">Teacher</p>
                <p className="truncate text-sm font-semibold text-white/75">{group.teacher_name || 'Teacher info not available'}</p>
                {group.teacher_email && <p className="truncate text-xs text-white/35">{group.teacher_email}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Link to={`/student/materials?group=${group.id}`} className="glass-card glass-card-hover p-5">
          <BookOpen className="h-7 w-7 text-emerald-400" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-white">Materials</h2>
          <p className="mt-1 text-sm text-white/45">{Number(group.materials_count) || 0} available</p>
        </Link>
        <Link to={`/student/homeworks?group=${group.id}`} className="glass-card glass-card-hover p-5">
          <FileText className="h-7 w-7 text-amber-400" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-white">Homework</h2>
          <p className="mt-1 text-sm text-white/45">{Number(group.homeworks_count) || 0} assigned</p>
        </Link>
        <Link to={`/student/tests?group=${group.id}`} className="glass-card glass-card-hover p-5">
          <ClipboardCheck className="h-7 w-7 text-violet-400" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-white">Tests</h2>
          <p className="mt-1 text-sm text-white/45">{Number(group.tests_count) || 0} available</p>
        </Link>
        <a href="#group-rating" className="glass-card glass-card-hover p-5">
          <Trophy className="h-7 w-7 text-yellow-400" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-white">Rating</h2>
          <p className="mt-1 text-sm text-white/45">
            {myRankIndex >= 0 ? `Your place #${myRankIndex + 1}` : `${sortedLeaderboard.length} students`}
          </p>
        </a>
      </div>

      <div id="group-rating" className="glass-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">Group Rating</h2>
            <p className="mt-1 text-sm text-white/40">
              {ratingScope === 'group'
                ? `Students from ${group.group_name}, ranked by tests and homework progress.`
                : `All students studying with ${group.teacher_name || 'this teacher'}, across groups.`}
            </p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setRatingScope('group')}
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                ratingScope === 'group' ? 'bg-accent/20 text-white' : 'text-white/45 hover:text-white/70',
              ].join(' ')}
            >
              This Group
            </button>
            <button
              type="button"
              onClick={() => setRatingScope('teacher')}
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                ratingScope === 'teacher' ? 'bg-accent/20 text-white' : 'text-white/45 hover:text-white/70',
              ].join(' ')}
            >
              Teacher
            </button>
          </div>
          {myRankIndex >= 0 && (
            <div className="rounded-full bg-accent/[0.1] px-3 py-1 text-sm font-semibold text-accent-light">
              Your rank #{myRankIndex + 1}
            </div>
          )}
        </div>

        {isLoadingLeaderboard ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : leaderboardError ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Trophy className="h-10 w-10 text-rose-400/40" />
            <p className="mt-4 text-sm font-medium text-white/50">Rating could not be loaded</p>
            <p className="mt-1 text-sm text-white/30">{getLeaderboardErrorMessage(leaderboardError)}</p>
          </div>
        ) : sortedLeaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Trophy className="h-10 w-10 text-white/15" />
            <p className="mt-4 text-sm font-medium text-white/50">No rating yet</p>
            <p className="mt-1 text-sm text-white/30">Complete homework or tests to appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {sortedLeaderboard.slice(0, 10).map((entry, index) => {
              const isMe = entry.email === user?.email || entry.full_name === user?.username
              return (
                <div key={`${entry.student_id}-${entry.group_id ?? group.id}`} className={`flex items-center gap-4 px-6 py-4 ${isMe ? 'bg-accent/[0.06]' : ''}`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-white/65">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/80">{entry.full_name}</p>
                    <p className="truncate text-xs text-white/35">{entry.email}</p>
                  </div>
                  <div className="hidden text-center sm:block">
                    <p className="text-xs text-white/30">Tests</p>
                    <p className="font-heading text-sm font-bold text-white/70">{entry.tests_total_score}</p>
                  </div>
                  <div className="hidden text-center sm:block">
                    <p className="text-xs text-white/30">HW</p>
                    <p className="font-heading text-sm font-bold text-white/70">{entry.homeworks_done}</p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="font-heading text-sm font-bold text-white/80">{entry.rating_points}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
