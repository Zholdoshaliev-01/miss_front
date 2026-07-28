import { useQueries, useQuery } from '@tanstack/react-query'
import { ClipboardCheck, HelpCircle, Loader2, Play, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStudentGroups, getStudentTests } from '@/modules/student/api'
import { useCommonCopy } from '@/shared/i18n'

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function normalizeStudentGroup(raw: any) {
  return {
    id: raw.group_id ?? raw.id,
    group_name: raw.group_name ?? raw.name ?? 'Untitled group',
  }
}

function unpackResults(data: any) {
  return Array.isArray(data) ? data : data?.results ?? []
}

export default function StudentTestsPage() {
  const { t } = useCommonCopy()
  const searchParams = new URLSearchParams(window.location.search)
  const initialGroupId = searchParams.get('group') ? Number(searchParams.get('group')) : null

  const [search, setSearch] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(initialGroupId)

  const { data: rawGroupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
  })

  const groups = (Array.isArray(rawGroupsData)
    ? rawGroupsData
    : (rawGroupsData as any)?.results ?? []
  ).map(normalizeStudentGroup)

  const activeGroupId = selectedGroupId

  const { data: rawTestsData, isLoading: testsLoading } = useQuery({
    queryKey: ['student-tests', activeGroupId],
    queryFn: () => getStudentTests(activeGroupId!),
    enabled: !!activeGroupId,
  })

  const allGroupTestQueries = useQueries({
    queries: groups.map((group: any) => ({
      queryKey: ['student-tests', group.id],
      queryFn: () => getStudentTests(group.id),
      enabled: !activeGroupId && groups.length > 0,
    })),
  })

  const tests = activeGroupId
    ? unpackResults(rawTestsData)
    : allGroupTestQueries.flatMap((query) => unpackResults(query.data))

  const filtered = tests.filter((test: any) =>
    test.title.toLowerCase().includes(search.toLowerCase()),
  )

  const isLoading = groupsLoading || (activeGroupId ? testsLoading : allGroupTestQueries.some((query) => query.isLoading))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t.tests}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {filtered.length} {filtered.length === 1 ? t.test : t.tests.toLowerCase()} {t.available}
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
              {groups.map((group: any) => (
                <option key={group.id} value={group.id}>{group.group_name}</option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
            <input
              type="text"
              placeholder={t.searchTests}
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
          <Users className="h-10 w-10 text-white/15" />
          <p className="mt-4 font-heading text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{t.noGroupsYet}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.joinGroupTests}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <HelpCircle className="h-10 w-10 text-white/15" />
          <p className="mt-4 font-heading text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {search ? t.noTestsMatch : t.noTestsYet}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.teacherNoTests}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((test: any) => (
            <div key={test.id} className="glass-card glass-card-hover card-shine p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-heading text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{test.title}</h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>{formatDate(test.created_at)}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: 'var(--input-bg)', color: 'var(--color-text-muted)' }}>
                  {Number(test.questions_count) || 0} {t.questions.toLowerCase()}
                </span>
                <Link to={`/student/test/${test.id}`} className="btn-primary !py-1.5 !px-4 !text-xs !rounded-lg">
                  <Play className="h-3.5 w-3.5" />
                  {t.open}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
