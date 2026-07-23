import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Copy, Users, BookOpen, ClipboardCheck, FileText,
  Calendar, Plus, MoreHorizontal, Download, Search, Loader2,
  Check, X, UserPlus,
} from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { toast } from 'sonner'

import { approveStudent, getGroupDetail, getGroupStudents, getPendingStudents, rejectStudent } from '@/modules/groups/api'
import { getMaterials } from '@/modules/materials/api'
import { getHomeworks } from '@/modules/homeworks/api'
import { getTests } from '@/modules/tests/api'

import { Modal } from '@/shared/ui/Modal'
import { MaterialForm } from '@/modules/materials/components/MaterialForm'
import { HomeworkForm } from '@/modules/homeworks/components/HomeworkForm'
import { TestForm } from '@/modules/tests/components/TestForm'

export default function GroupDetailPage() {
  const queryClient = useQueryClient()
  const { groupId: groupIdStr } = useParams()
  const groupId = Number(groupIdStr)
  const [activeTab, setActiveTab] = useState('students')
  const [search, setSearch] = useState('')
  const [isMaterialOpen, setIsMaterialOpen] = useState(false)
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false)
  const [isTestOpen, setIsTestOpen] = useState(false)

  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroupDetail(groupId),
    enabled: !!groupId,
  })

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['group-students', groupId],
    queryFn: () => getGroupStudents(groupId),
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

  const students = studentsData?.results ?? []
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
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.message || 'Failed to approve student')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (studentId: number) => rejectStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-requests', groupId] })
      toast.success('Request rejected')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.message || 'Failed to reject request')
    },
  })

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { id: 'students', label: 'Students', icon: Users, count: Number(group?.students_count) || studentsData?.count || 0 },
    { id: 'requests', label: 'Requests', icon: UserPlus, count: requestsData?.count ?? 0 },
    { id: 'materials', label: 'Materials', icon: BookOpen, count: Number(group?.materials_count) || materialsData?.count || 0 },
    { id: 'homeworks', label: 'Homework', icon: FileText, count: Number(group?.homeworks_count) || homeworksData?.count || 0 },
    { id: 'tests', label: 'Tests', icon: ClipboardCheck, count: Number(group?.tests_count) || testsData?.count || 0 },
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
              <button type="button" className="btn-secondary text-sm">
                <Plus className="h-4 w-4" />
                Add Content
              </button>
              <button type="button" className="btn-ghost text-sm">
                <MoreHorizontal className="h-4 w-4" />
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
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent/[0.1] text-accent-light shadow-sm'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === tab.id ? 'bg-accent/20 text-accent-light' : 'bg-white/[0.06] text-white/30'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="border-b border-white/[0.04] transition hover:bg-accent/[0.03]">
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
                        <tr key={s.id} className="border-b border-white/[0.04] transition hover:bg-accent/[0.03]">
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
                {materials.map((m) => (
                  <Link key={m.id} to={`/materials/${m.id}`} className="glass-card glass-card-hover card-shine group p-5">
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
                    <div className="mt-3 flex justify-end">
                      <button type="button" className="btn-ghost !py-1 !px-2 text-xs text-white/30">
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                    </div>
                  </Link>
                ))}
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
                <Link key={hw.id} to={`/homeworks/${hw.id}`} className="glass-card glass-card-hover card-shine group flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-400/10">
                      <FileText className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white/85 group-hover:text-white">{hw.title}</h4>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-white/30">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(hw.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-white/15 group-hover:text-white/40 transition" />
                </Link>
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
              tests.map((t) => (
                <Link key={t.id} to={`/tests/${t.id}`} className="glass-card glass-card-hover card-shine group flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-400/10">
                      <ClipboardCheck className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white/85 group-hover:text-white">{t.title}</h4>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-white/30">
                        <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-white/15 group-hover:text-white/40 transition" />
                </Link>
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
    </div>
  )
}
