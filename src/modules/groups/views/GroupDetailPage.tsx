import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  ArrowLeft, Copy, Users, BookOpen, ClipboardCheck, FileText,
  Calendar, Plus, Download, Search, Loader2,
  Check, X, UserPlus, UserMinus, Edit3, Trash2, Video, CalendarCheck,
} from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { toast } from 'sonner'

import { approveStudent, expelStudent, getAllGroupStudents, getGroupDetail, getPendingStudents, rejectStudent } from '@/modules/groups/api'
import { deleteMaterial, getMaterials, updateMaterial } from '@/modules/materials/api'
import { deleteHomework, getHomeworks, updateHomework } from '@/modules/homeworks/api'
import { deleteTest, getTests, updateTest } from '@/modules/tests/api'
import type { Material } from '@/modules/materials/types'
import type { Homework } from '@/modules/homeworks/types'
import type { CourseTest } from '@/modules/tests/types'
import type { Student } from '@/modules/students/types'
import { useCommonCopy } from '@/shared/i18n'

import { Modal } from '@/shared/ui/Modal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { MaterialForm } from '@/modules/materials/components/MaterialForm'
import { HomeworkForm } from '@/modules/homeworks/components/HomeworkForm'
import { TestForm } from '@/modules/tests/components/TestForm'
import { buildMediaUrl } from '@/shared/utils/buildMediaUrl'
import AttendancePage from '@/modules/attendance/views/AttendancePage'

type ContentKind = 'material' | 'homework' | 'test'
type DeleteTarget = { kind: ContentKind; id: number; title: string }

function toDateInputValue(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback
  const data = error.response?.data as { detail?: string } | undefined
  return data?.detail || error.message || fallback
}

export default function GroupDetailPage() {
  const queryClient = useQueryClient()
  const { t } = useCommonCopy()
  const { groupId: groupIdStr } = useParams()
  const groupId = Number(groupIdStr)
  const [searchParams] = useSearchParams()
  const initialTab = ['students', 'requests', 'materials', 'homeworks', 'tests', 'attendance'].includes(searchParams.get('tab') ?? '')
    ? (searchParams.get('tab') as string)
    : 'students'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [isMaterialOpen, setIsMaterialOpen] = useState(false)
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false)
  const [isTestOpen, setIsTestOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null)
  const [editingTest, setEditingTest] = useState<CourseTest | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [studentToExpel, setStudentToExpel] = useState<Student | null>(null)
  const [materialDraft, setMaterialDraft] = useState({ title: '', description: '', file: null as File | null })
  const [homeworkDraft, setHomeworkDraft] = useState({ title: '', description: '', due_date: '', file: null as File | null })
  const [testDraft, setTestDraft] = useState({ title: '', description: '' })

  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroupDetail(groupId),
    enabled: !!groupId,
  })

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['group-students', groupId, 'all-active'],
    queryFn: () => getAllGroupStudents(groupId),
    select: (groupStudents) => groupStudents.filter((student) => student.status === 'active'),
    enabled: !!groupId && activeTab === 'students',
  })

  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['group-requests', groupId],
    queryFn: () => getPendingStudents(groupId),
    enabled: !!groupId,
  })

  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['group-materials', groupId],
    queryFn: () => getMaterials(groupId),
    enabled: !!groupId && activeTab === 'materials',
  })

  const { data: homeworksData, isLoading: isLoadingHomeworks } = useQuery({
    queryKey: ['group-homeworks', groupId],
    queryFn: () => getHomeworks(groupId),
    enabled: !!groupId && activeTab === 'homeworks',
  })

  const { data: testsData, isLoading: isLoadingTests } = useQuery({
    queryKey: ['group-tests', groupId],
    queryFn: () => getTests(groupId),
    enabled: !!groupId && activeTab === 'tests',
  })

  const materials = materialsData?.results ?? []
  const homeworks = homeworksData?.results ?? []
  const tests = testsData?.results ?? []
  const requests = requestsData?.results ?? []

  const approveMutation = useMutation({
    mutationFn: (studentId: number) => approveStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-requests', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-students', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('Student approved')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to approve student'))
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (studentId: number) => rejectStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-requests', groupId] })
      toast.success('Request rejected')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to reject request'))
    },
  })

  const expelMutation = useMutation({
    mutationFn: (studentMembershipId: number) => expelStudent(studentMembershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-students', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-requests', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      setStudentToExpel(null)
      toast.success('Student expelled')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to expel student')),
  })

  const invalidateContent = (kind: ContentKind) => {
    const queryKey =
      kind === 'material'
        ? ['group-materials', groupId]
        : kind === 'homework'
          ? ['group-homeworks', groupId]
          : ['group-tests', groupId]

    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['group', groupId] })
  }

  const updateMaterialMutation = useMutation({
    mutationFn: () => {
      if (!editingMaterial) throw new Error('Material is not selected')
      return updateMaterial(editingMaterial.id, materialDraft)
    },
    onSuccess: () => {
      invalidateContent('material')
      setEditingMaterial(null)
      setMaterialDraft({ title: '', description: '', file: null })
      toast.success(t.materialUpdated)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t.failedUpdateContent)),
  })

  const updateHomeworkMutation = useMutation({
    mutationFn: () => {
      if (!editingHomework) throw new Error('Homework is not selected')
      return updateHomework(editingHomework.id, {
        title: homeworkDraft.title,
        description: homeworkDraft.description,
        due_date: homeworkDraft.due_date || undefined,
        file: homeworkDraft.file,
      })
    },
    onSuccess: () => {
      invalidateContent('homework')
      setEditingHomework(null)
      setHomeworkDraft({ title: '', description: '', due_date: '', file: null })
      toast.success(t.homeworkUpdated)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t.failedUpdateContent)),
  })

  const updateTestMutation = useMutation({
    mutationFn: () => {
      if (!editingTest) throw new Error('Test is not selected')
      return updateTest(editingTest.id, testDraft)
    },
    onSuccess: () => {
      invalidateContent('test')
      setEditingTest(null)
      setTestDraft({ title: '', description: '' })
      toast.success(t.testUpdated)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t.failedUpdateContent)),
  })

  const deleteContentMutation = useMutation({
    mutationFn: (target: DeleteTarget) => {
      if (target.kind === 'material') return deleteMaterial(target.id)
      if (target.kind === 'homework') return deleteHomework(target.id)
      return deleteTest(target.id)
    },
    onSuccess: (_, target) => {
      invalidateContent(target.kind)
      toast.success(
        target.kind === 'material'
          ? t.materialDeleted
          : target.kind === 'homework'
            ? t.homeworkDeleted
            : t.testDeleted
      )
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t.failedDeleteContent)),
  })

  const openMaterialEditor = (material: Material) => {
    setEditingMaterial(material)
    setMaterialDraft({ title: material.title, description: material.description ?? '', file: null })
  }

  const openHomeworkEditor = (homework: Homework) => {
    setEditingHomework(homework)
    setHomeworkDraft({
      title: homework.title,
      description: homework.description ?? '',
      due_date: toDateInputValue(homework.due_date),
      file: null,
    })
  }

  const openTestEditor = (test: CourseTest) => {
    setEditingTest(test)
    setTestDraft({ title: test.title, description: test.description ?? '' })
  }

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { id: 'students', label: 'Students', icon: Users, count: students.length || Number(group?.students_count) || 0 },
    { id: 'requests', label: 'Requests', icon: UserPlus, count: requestsData?.count ?? 0 },
    { id: 'materials', label: 'Materials', icon: BookOpen, count: Number(group?.materials_count) || materialsData?.count || 0 },
    { id: 'homeworks', label: 'Homework', icon: FileText, count: Number(group?.homeworks_count) || homeworksData?.count || 0 },
    { id: 'tests', label: 'Tests', icon: ClipboardCheck, count: Number(group?.tests_count) || testsData?.count || 0 },
    { id: 'attendance', label: t.attendance, icon: CalendarCheck },
  ]

  if (isLoadingGroup) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Group not found</h2>
        <Link to="/groups" className="mt-4 text-accent hover:underline">Return to Groups</Link>
      </div>
    )
  }

  const inviteCode = group.invite_code || `G-${group.id}XYZ`
  const isUpdatingContent =
    updateMaterialMutation.isPending || updateHomeworkMutation.isPending || updateTestMutation.isPending

  const handleMaterialSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!materialDraft.title.trim()) {
      toast.error(t.contentTitleRequired)
      return
    }
    updateMaterialMutation.mutate()
  }

  const handleHomeworkSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!homeworkDraft.title.trim()) {
      toast.error(t.contentTitleRequired)
      return
    }
    updateHomeworkMutation.mutate()
  }

  const handleTestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!testDraft.title.trim()) {
      toast.error(t.contentTitleRequired)
      return
    }
    updateTestMutation.mutate()
  }

  const handleAddContent = () => {
    if (activeTab === 'homeworks') {
      setIsHomeworkOpen(true)
      return
    }

    if (activeTab === 'tests') {
      setIsTestOpen(true)
      return
    }

    if (activeTab !== 'materials') setActiveTab('materials')
    setIsMaterialOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Link>
        <PageHeader
          title={group.group_name}
          description={`${group.level} level`}
          actions={
            <div className="flex gap-2">
              <Link to={`/live/${group.id}`} className="btn-primary text-sm">
                <Video className="h-4 w-4" />
                {t.onlineLesson}
              </Link>
              <button type="button" className="btn-secondary text-sm" onClick={handleAddContent}>
                <Plus className="h-4 w-4" />
                Add Content
              </button>
            </div>
          }
        />
      </div>

      {/* Invite Code Card */}
      <div className="glass-card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/30">Join Link</div>
          <div className="mt-1 font-heading text-lg font-bold tracking-[0.1em] text-accent-light">
            {window.location.origin}/join/{inviteCode}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`)
              toast.success('Join link copied!')
            }}
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="motion-tabs flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`motion-tab flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'motion-tab-active bg-accent/[0.1] text-accent-light shadow-sm'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === tab.id ? 'bg-accent/20 text-accent-light' : 'bg-white/[0.06] text-white/30'
            }`}>
              {tab.count}
            </span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="motion-tab-panels min-h-[300px]">
        {activeTab === 'attendance' && <AttendancePage groupId={groupId} />}

        {activeTab === 'students' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input 
                className="input-field input-with-icon" 
                placeholder="Search students..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Students table */}
            <div className="glass-card overflow-hidden">
              {isLoadingStudents ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex justify-center py-10 text-white/40">No students found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white/35">Name</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white/35 hidden sm:table-cell">Email</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white/35">Status</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white/35 hidden md:table-cell">Joined</th>
                        <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-white/35">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="motion-table-row border-b border-white/[0.04] transition hover:bg-accent/[0.03]">
                          <td className="px-5 py-3.5">
                            <Link to={`/students/${s.id}`} className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-purple-500/25 text-xs font-bold text-white/70">
                                {s.full_name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <span className="font-medium text-white/85 hover:text-white">{s.full_name}</span>
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-white/45 hidden sm:table-cell">{s.email}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge label={s.status} variant={s.status} />
                          </td>
                          <td className="px-5 py-3.5 text-white/35 hidden md:table-cell">
                            {new Date(s.joined_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              className="btn-danger !px-3 !py-1.5 !text-xs"
                              disabled={expelMutation.isPending}
                              onClick={() => setStudentToExpel(s)}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                              Expel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="glass-card overflow-hidden">
              {isLoadingRequests ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserPlus className="h-9 w-9 text-white/15" />
                  <p className="mt-3 text-sm font-medium text-white/50">No pending requests</p>
                  <p className="mt-1 text-sm text-white/30">Students who join by invite link will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white/35">Student</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white/35 hidden sm:table-cell">Email</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white/35 hidden md:table-cell">Requested</th>
                        <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white/35 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((s) => (
                        <tr key={s.id} className="motion-table-row border-b border-white/[0.04] transition hover:bg-accent/[0.03]">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-purple-500/25 text-xs font-bold text-white/70">
                                {s.full_name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <span className="font-medium text-white/85">{s.full_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-white/45 hidden sm:table-cell">{s.email}</td>
                          <td className="px-5 py-3.5 text-white/35 hidden md:table-cell">
                            {s.joined_at ? new Date(s.joined_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className="btn-primary !py-1.5 !px-3 !text-xs"
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                onClick={() => approveMutation.mutate(s.id)}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-secondary !py-1.5 !px-3 !text-xs"
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                onClick={() => rejectMutation.mutate(s.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </button>
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
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button type="button" className="btn-primary text-sm" onClick={() => setIsMaterialOpen(true)}>
                <Plus className="h-4 w-4" />
                Upload Material
              </button>
            </div>
            {isLoadingMaterials ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
            ) : materials.length === 0 ? (
              <div className="glass-card flex justify-center py-10 text-white/40">No materials uploaded yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((m) => {
                  const fileUrl = m.file ? buildMediaUrl(m.file) : ''
                  const cardContent = (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-400/10">
                        <BookOpen className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate font-medium text-white/85 group-hover:text-white">{m.title}</h4>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/30">
                          <Calendar className="h-3 w-3" />
                          {new Date(m.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )

                  return (
                    <div key={m.id} className="glass-card glass-card-hover card-shine group relative overflow-hidden">
                      <div className="absolute right-3 top-3 z-10 flex gap-1">
                        <button
                          type="button"
                          className="rounded-lg border border-white/[0.08] bg-white/[0.06] p-2 text-white/45 transition hover:border-accent/35 hover:text-white"
                          title={t.editMaterial}
                          onClick={() => openMaterialEditor(m)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-400/10 bg-red-500/[0.06] p-2 text-red-200/60 transition hover:border-red-400/30 hover:text-red-200"
                          title={t.deleteMaterial}
                          onClick={() => setDeleteTarget({ kind: 'material', id: m.id, title: m.title })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {fileUrl ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block p-5 pr-24">
                          {cardContent}
                        </a>
                      ) : (
                        <div className="p-5 pr-24">{cardContent}</div>
                      )}
                      {fileUrl && (
                        <div className="flex justify-end px-5 pb-5">
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-1 !px-2 text-xs text-white/30">
                            <Download className="h-3 w-3" />
                            Open file
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'homeworks' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button type="button" className="btn-primary text-sm" onClick={() => setIsHomeworkOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Homework
              </button>
            </div>
            {isLoadingHomeworks ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
            ) : homeworks.length === 0 ? (
              <div className="glass-card flex justify-center py-10 text-white/40">No homeworks assigned yet.</div>
            ) : (
              homeworks.map((hw) => (
                <div key={hw.id} className="glass-card glass-card-hover card-shine group relative">
                  <div className="absolute right-4 top-4 z-10 flex gap-1">
                    <button
                      type="button"
                      className="rounded-lg border border-white/[0.08] bg-white/[0.06] p-2 text-white/45 transition hover:border-accent/35 hover:text-white"
                      title={t.editHomework}
                      onClick={() => openHomeworkEditor(hw)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-400/10 bg-red-500/[0.06] p-2 text-red-200/60 transition hover:border-red-400/30 hover:text-red-200"
                      title={t.deleteHomework}
                      onClick={() => setDeleteTarget({ kind: 'homework', id: hw.id, title: hw.title })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Link to={`/homeworks/${hw.id}`} className="flex items-center justify-between p-5 pr-28">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-400/10">
                        <FileText className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/85 group-hover:text-white">{hw.title}</h4>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-white/30">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-white/15 group-hover:text-white/40 transition" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button type="button" className="btn-primary text-sm" onClick={() => setIsTestOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Test
              </button>
            </div>
            {isLoadingTests ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
            ) : tests.length === 0 ? (
              <div className="glass-card flex justify-center py-10 text-white/40">No tests created yet.</div>
            ) : (
              tests.map((test) => (
                <div key={test.id} className="glass-card glass-card-hover card-shine group relative">
                  <div className="absolute right-4 top-4 z-10 flex gap-1">
                    <button
                      type="button"
                      className="rounded-lg border border-white/[0.08] bg-white/[0.06] p-2 text-white/45 transition hover:border-accent/35 hover:text-white"
                      title={t.editTest}
                      onClick={() => openTestEditor(test)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-400/10 bg-red-500/[0.06] p-2 text-red-200/60 transition hover:border-red-400/30 hover:text-red-200"
                      title={t.deleteTest}
                      onClick={() => setDeleteTarget({ kind: 'test', id: test.id, title: test.title })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Link to={`/tests/${test.id}`} className="flex items-center justify-between p-5 pr-28">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-400/10">
                        <ClipboardCheck className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/85 group-hover:text-white">{test.title}</h4>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-white/30">
                          <span>Created: {new Date(test.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-white/15 group-hover:text-white/40 transition" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Modal
        open={isMaterialOpen}
        onOpenChange={setIsMaterialOpen}
        title="Upload Material"
        description="Share a new lecture, document, or resource with your students."
      >
        <MaterialForm groupId={groupId} onSuccess={() => setIsMaterialOpen(false)} />
      </Modal>

      <Modal
        open={isHomeworkOpen}
        onOpenChange={setIsHomeworkOpen}
        title="Create Homework"
        description="Assign a new task to your students."
      >
        <HomeworkForm groupId={groupId} onSuccess={() => setIsHomeworkOpen(false)} />
      </Modal>

      <Modal
        open={isTestOpen}
        onOpenChange={setIsTestOpen}
        title="Create Test"
        description="Create a new test or exam. You can add questions later."
      >
        <TestForm groupId={groupId} onSuccess={() => setIsTestOpen(false)} />
      </Modal>

      <Modal
        open={!!editingMaterial}
        onOpenChange={(open) => !open && setEditingMaterial(null)}
        title={t.editMaterial}
        description={t.editContentDescription}
      >
        <form onSubmit={handleMaterialSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.title}</label>
            <input
              className="input-field"
              value={materialDraft.title}
              disabled={isUpdatingContent}
              onChange={(event) => setMaterialDraft((draft) => ({ ...draft, title: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.description}</label>
            <textarea
              className="input-field min-h-[90px]"
              value={materialDraft.description}
              disabled={isUpdatingContent}
              onChange={(event) => setMaterialDraft((draft) => ({ ...draft, description: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.uploadNewFile}</label>
            <input
              type="file"
              className="input-field file:mr-4 file:rounded-lg file:border-0 file:bg-accent/20 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-accent-light"
              disabled={isUpdatingContent}
              onChange={(event) => setMaterialDraft((draft) => ({ ...draft, file: event.target.files?.[0] ?? null }))}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isUpdatingContent}>
            {updateMaterialMutation.isPending ? t.saving : t.saveChanges}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!editingHomework}
        onOpenChange={(open) => !open && setEditingHomework(null)}
        title={t.editHomework}
        description={t.editContentDescription}
      >
        <form onSubmit={handleHomeworkSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.title}</label>
            <input
              className="input-field"
              value={homeworkDraft.title}
              disabled={isUpdatingContent}
              onChange={(event) => setHomeworkDraft((draft) => ({ ...draft, title: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.description}</label>
            <textarea
              className="input-field min-h-[90px]"
              value={homeworkDraft.description}
              disabled={isUpdatingContent}
              onChange={(event) => setHomeworkDraft((draft) => ({ ...draft, description: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.dueDate}</label>
            <input
              type="date"
              className="input-field"
              value={homeworkDraft.due_date}
              disabled={isUpdatingContent}
              onChange={(event) => setHomeworkDraft((draft) => ({ ...draft, due_date: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.uploadNewFile}</label>
            <input
              type="file"
              className="input-field file:mr-4 file:rounded-lg file:border-0 file:bg-accent/20 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-accent-light"
              disabled={isUpdatingContent}
              onChange={(event) => setHomeworkDraft((draft) => ({ ...draft, file: event.target.files?.[0] ?? null }))}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isUpdatingContent}>
            {updateHomeworkMutation.isPending ? t.saving : t.saveChanges}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!editingTest}
        onOpenChange={(open) => !open && setEditingTest(null)}
        title={t.editTest}
        description={t.editContentDescription}
      >
        <form onSubmit={handleTestSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.title}</label>
            <input
              className="input-field"
              value={testDraft.title}
              disabled={isUpdatingContent}
              onChange={(event) => setTestDraft((draft) => ({ ...draft, title: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/60">{t.description}</label>
            <textarea
              className="input-field min-h-[90px]"
              value={testDraft.description}
              disabled={isUpdatingContent}
              onChange={(event) => setTestDraft((draft) => ({ ...draft, description: event.target.value }))}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isUpdatingContent}>
            {updateTestMutation.isPending ? t.saving : t.saveChanges}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!studentToExpel}
        onOpenChange={(open) => !open && setStudentToExpel(null)}
        title="Expel student?"
        description={studentToExpel ? `${studentToExpel.full_name || studentToExpel.email} will lose access to this group.` : undefined}
        confirmLabel={expelMutation.isPending ? 'Expelling...' : 'Expel'}
        cancelLabel={t.cancel}
        variant="danger"
        onConfirm={() => studentToExpel && expelMutation.mutate(studentToExpel.id)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t.deleteContentTitle}
        description={deleteTarget ? `${t.deleteContentDescription} "${deleteTarget.title}"` : t.deleteContentDescription}
        confirmLabel={deleteContentMutation.isPending ? t.saving : t.delete}
        cancelLabel={t.cancel}
        variant="danger"
        onConfirm={() => deleteTarget && deleteContentMutation.mutate(deleteTarget)}
      />
    </div>
  )
}
