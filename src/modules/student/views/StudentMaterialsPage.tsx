import { useQueries, useQuery } from '@tanstack/react-query'
import { BookOpen, Download, ExternalLink, FileText, Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import { getStudentGroups, getStudentMaterials } from '@/modules/student/api'
import type { Material } from '@/modules/materials/types'
import { useCommonCopy } from '@/shared/i18n'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function buildFileUrl(file?: string | null) {
  if (!file) return null
  if (file.startsWith('http://') || file.startsWith('https://')) return file
  const base = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')
  const path = file.startsWith('/') ? file : `/${file}`
  return `${base}${path}`
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(dateStr).toLocaleDateString([], {
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

function getFileExtension(url: string) {
  const name = url.split('/').pop() || ''
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return ext
}

function getFileColor(ext: string) {
  if (['pdf'].includes(ext)) return 'from-red-500 to-rose-400'
  if (['doc', 'docx'].includes(ext)) return 'from-blue-500 to-cyan-400'
  if (['xls', 'xlsx'].includes(ext)) return 'from-emerald-500 to-green-400'
  if (['ppt', 'pptx'].includes(ext)) return 'from-amber-500 to-orange-400'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'from-pink-500 to-fuchsia-400'
  return 'from-violet-500 to-purple-400'
}

export default function StudentMaterialsPage() {
  const { t } = useCommonCopy()
  const searchParams = new URLSearchParams(window.location.search)
  const initialGroupId = searchParams.get('group') ? Number(searchParams.get('group')) : null

  const [search, setSearch] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(initialGroupId)

  // Fetch student's groups
  const { data: rawGroupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
  })
  
  const groups = (Array.isArray(rawGroupsData) 
    ? rawGroupsData 
    : (rawGroupsData as any)?.results ?? []
  ).map(normalizeStudentGroup)

  const activeGroupId = selectedGroupId

  // Fetch materials for the active group
  const { data: rawMaterialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ['student-materials', activeGroupId],
    queryFn: () => getStudentMaterials(activeGroupId!),
    enabled: !!activeGroupId,
  })

  const allGroupMaterialQueries = useQueries({
    queries: groups.map((group: any) => ({
      queryKey: ['student-materials', group.id],
      queryFn: () => getStudentMaterials(group.id),
      enabled: !activeGroupId && groups.length > 0,
    })),
  })

  // Handle both paginated response ({ results: [...] }) and flat array ([...])
  const materials: Material[] = activeGroupId
    ? unpackResults(rawMaterialsData)
    : allGroupMaterialQueries.flatMap((query) => unpackResults(query.data))

  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
    || m.description?.toLowerCase().includes(search.toLowerCase()),
  )

  const isLoading = groupsLoading || (activeGroupId ? materialsLoading : allGroupMaterialQueries.some((query) => query.isLoading))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg" style={{ boxShadow: '0 6px 20px rgba(16,185,129,0.15)' }}>
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t.materials}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {filtered.length} {filtered.length === 1 ? t.material : t.materials.toLowerCase()} {t.available}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Group selector */}
          {groups.length > 1 && (
            <select
              value={activeGroupId ?? 'all'}
              onChange={(e) => setSelectedGroupId(e.target.value === 'all' ? null : Number(e.target.value))}
              className="input-field !py-2 !text-sm !rounded-xl"
              style={{ minWidth: 160 }}
            >
              <option value="all">{t.allGroups}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.group_name}</option>
              ))}
            </select>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
            <input
              type="text"
              placeholder={t.searchMaterials}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field input-with-icon !py-2 !text-sm !rounded-xl"
              style={{ minWidth: 200 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}>
            <BookOpen className="h-7 w-7" />
          </div>
          <p className="mt-4 font-heading text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {t.noGroupsYet}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>
            {t.joinGroupMaterials}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}>
            <FileText className="h-7 w-7" />
          </div>
          <p className="mt-4 font-heading text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {search ? t.noMaterialsMatch : t.noMaterialsYet}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>
            {t.teacherNoMaterials}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((material) => {
            const ext = getFileExtension(material.file || '')
            const fileUrl = buildFileUrl(material.file)
            const cardContent = (
              <>
                {/* File type indicator */}
                <div className="flex items-center gap-3 p-5 pb-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getFileColor(ext)} shadow-lg`}
                  >
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-heading text-sm font-semibold transition group-hover:text-accent-light" style={{ color: 'var(--color-text)' }}>
                      {material.title}
                    </h3>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      {ext.toUpperCase()} · {formatDate(material.created_at)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {material.description && (
                  <div className="px-5 pb-2">
                    <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      {material.description}
                    </p>
                  </div>
                )}
              </>
            )

            return (
              <div
                key={material.id}
                className="glass-card glass-card-hover card-shine group overflow-hidden"
              >
                {fileUrl ? (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                    {cardContent}
                  </a>
                ) : (
                  <div>{cardContent}</div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 px-5 pb-4 pt-2">
                  {fileUrl ? (
                    <>
                      <a
                        href={fileUrl}
                        download
                        className="btn-ghost !py-1.5 !px-3 !text-xs !rounded-lg inline-flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t.download}
                      </a>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary !py-1.5 !px-4 !text-xs !rounded-lg inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t.open}
                      </a>
                    </>
                  ) : (
                    <span className="rounded-lg px-3 py-1.5 text-xs" style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}>
                      {t.noFile}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
