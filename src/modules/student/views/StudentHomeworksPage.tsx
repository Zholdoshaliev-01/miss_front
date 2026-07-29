import { useQueries, useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarDays, FileText, Loader2, Search, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStudentGroups, getStudentHomeworks } from '@/modules/student/api'
import type { StudentHomework } from '@/modules/student/api'
import type { Group } from '@/modules/groups/types'
import { useCommonCopy } from '@/shared/i18n'

type StudentGroupOption = {
  id: number
  group_name: string
}

function formatDate(dateStr: string | undefined, fallback: string) {
  if (!dateStr) return fallback
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function normalizeStudentGroup(raw: Group & {
  group_id?: number
  name?: string
}): StudentGroupOption {
  return {
    id: raw.group_id ?? raw.id,
    group_name: raw.group_name ?? raw.name ?? 'Untitled group',
  }
}

function unpackResults<T>(data: T[] | { results?: T[] } | undefined): T[] {
  return Array.isArray(data) ? data : data?.results ?? []
}

export default function StudentHomeworksPage() {
  const { t } = useCommonCopy()
  const searchParams = new URLSearchParams(window.location.search)
  const initialGroupId = searchParams.get('group') ? Number(searchParams.get('group')) : null

  const [search, setSearch] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(initialGroupId)

  const { data: rawGroupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
  })

  const groups: StudentGroupOption[] = (Array.isArray(rawGroupsData)
    ? rawGroupsData
    : (rawGroupsData as any)?.results ?? []
  ).map(normalizeStudentGroup)

  const activeGroupId = selectedGroupId

  const { data: rawHomeworksData, isLoading: homeworksLoading } = useQuery({
    queryKey: ['student-homeworks', activeGroupId],
    queryFn: () => getStudentHomeworks(activeGroupId!),
    enabled: !!activeGroupId,
  })

  const allGroupHomeworkQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ['student-homeworks', group.id],
      queryFn: () => getStudentHomeworks(group.id),
      enabled: !activeGroupId && groups.length > 0,
    })),
  })

  const homeworks = activeGroupId
    ? unpackResults<StudentHomework>(rawHomeworksData)
    : allGroupHomeworkQueries.flatMap((query) => unpackResults<StudentHomework>(query.data))

  const filtered = homeworks.filter((homework) =>
    homework.title.toLowerCase().includes(search.toLowerCase())
    || homework.description?.toLowerCase().includes(search.toLowerCase()),
  )

  const isLoading = groupsLoading || (activeGroupId ? homeworksLoading : allGroupHomeworkQueries.some((query) => query.isLoading))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t.homework}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {filtered.length} {filtered.length === 1 ? t.task : t.tasks.toLowerCase()} {t.assigned}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {groups.length > 1 && (
            <select
              value={activeGroupId ?? 'all'}
              onChange={(e) => setSelectedGroupId(e.target.value === 'all' ? null : Number(e.target.value))}
              className="input-field !py-2 !text-sm !rounded-xl"
            >
              <option value="all">{t.allGroups}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.group_name}</option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
            <input
              type="text"
              placeholder={t.searchHomework}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field input-with-icon !py-2 !text-sm !rounded-xl"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-10 w-10 text-white/15" />
          <p className="mt-4 font-heading text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{t.noGroupsYet}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.joinGroupHomework}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-10 w-10 text-white/15" />
          <p className="mt-4 font-heading text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {search ? t.noHomeworkMatch : t.noHomeworkYet}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.teacherNoHomework}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((homework) => (
            <div key={homework.id} className="glass-card glass-card-hover card-shine p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-heading text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{homework.title}</h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-faint)' }}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t.due} {formatDate(homework.due_date, t.noDeadline)}
                  </p>
                </div>
              </div>

              {homework.description && (
                <p className="mt-4 line-clamp-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{homework.description}</p>
              )}

              <div className="mt-5 flex items-center justify-between gap-2">
                <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: 'var(--input-bg)', color: 'var(--color-text-muted)' }}>
                  {homework.is_submitted ? t.submitted : t.notSubmitted}
                </span>
                <Link
                  to={`/student/homework/${homework.id}`}
                  className={`${homework.is_submitted ? 'btn-secondary' : 'btn-primary'} !py-1.5 !px-4 !text-xs !rounded-lg`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {homework.is_submitted ? t.updateSubmission : t.submit}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
