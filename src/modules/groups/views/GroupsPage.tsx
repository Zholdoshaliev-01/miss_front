import { useState } from 'react'
import { Plus, Users, BookOpen, ClipboardCheck, FileText, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { getGroupDetail, getGroups, createGroup } from '../api'
import { createRoom } from '@/modules/chat/api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type { Group } from '../types'

const LEVEL_OPTIONS = [
  { value: 'A1', label: 'Beginner', description: 'A1' },
  { value: 'A2', label: 'Elementary', description: 'A2' },
  { value: 'B1', label: 'Intermediate', description: 'B1' },
  { value: 'B2', label: 'Upper Intermediate', description: 'B2' },
  { value: 'C1', label: 'Advanced', description: 'C1' },
]

function GroupCard({ group }: { group: Group }) {
  // Use a fallback gradient if color isn't provided by API
  const color = 'from-blue-500 to-cyan-400'

  return (
    <Link
      to={`/groups/${group.id}`}
      className="glass-card glass-card-hover card-shine group block overflow-hidden"
    >
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              {group.group_name}
            </h3>
            <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs" style={{ background: 'var(--input-bg)', color: 'var(--color-text-muted)' }}>
              {group.level}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="flex justify-center" style={{ color: 'var(--color-text-faint)' }}>
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{Number(group.students_count) || 0}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>Students</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center" style={{ color: 'var(--color-text-faint)' }}>
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{Number(group.materials_count) || 0}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>Materials</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center" style={{ color: 'var(--color-text-faint)' }}>
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{Number(group.homeworks_count) || 0}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>HW</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center" style={{ color: 'var(--color-text-faint)' }}>
              <ClipboardCheck className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{Number(group.tests_count) || 0}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>Tests</div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function GroupsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupLevel, setNewGroupLevel] = useState('A1')
  const trimmedGroupName = newGroupName.trim()

  const { data: paginatedGroups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  })

  const createGroupMut = useMutation({
    mutationFn: async () => {
      // 1. Create in Django
      const group = await createGroup({ group_name: trimmedGroupName, level: newGroupLevel })
      
      // 2. Try to sync with Chat API automatically
      try {
        const authUser = useAuthStore.getState().user
        await createRoom({ group_id: group.id, owner_id: (authUser as any)?.id ?? 0, title: group.group_name })
      } catch (err) {
        // Chat room failed, but group was created.
        console.error('Failed to auto-create chat room', err)
        toast.error('Group created, but failed to initialize chat room automatically. You can add it manually in Chat.')
      }
      return group
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] }) // Refresh chat rooms list
      toast.success('Group created successfully!')
      setShowModal(false)
      setNewGroupName('')
      setNewGroupLevel('A1')
    },
    onError: (err: any) => {
      const data = err.response?.data
      const msg =
        data?.detail ||
        data?.group_name?.[0] ||
        data?.level?.[0] ||
        err.message ||
        'Failed to create group'
      toast.error(msg)
    }
  })

  const groups = paginatedGroups?.results || []
  const groupDetailQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ['group', group.id],
      queryFn: () => getGroupDetail(group.id),
      enabled: Boolean(group.id),
    })),
  })
  const groupsWithDetails = groups.map((group, index) => groupDetailQueries[index]?.data ?? group)
  const hasGroups = groups.length > 0

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-8 relative">
      <PageHeader
        title="Groups"
        description="Manage your student groups and classes."
        actions={
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary text-sm">
            <Plus className="h-4 w-4" />
            Create Group
          </button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{groupsWithDetails.length}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Total Groups</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groupsWithDetails.reduce((a, g) => a + (Number(g.students_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Total Students</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groupsWithDetails.reduce((a, g) => a + (Number(g.materials_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Materials</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groupsWithDetails.reduce((a, g) => a + (Number(g.tests_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Tests</div>
        </div>
      </div>

      {hasGroups ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groupsWithDetails.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="No groups yet"
          description="Create your first group to start adding students and materials."
          action={
            <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Create Group
            </button>
          }
        />
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: 'var(--color-text-faint)' }}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Create New Group</h2>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!trimmedGroupName) {
                  toast.error('Group name is required')
                  return
                }
                createGroupMut.mutate()
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Computer Science 101"
                  className="input-field w-full"
                  maxLength={45}
                  required
                  autoFocus
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {trimmedGroupName.length}/45
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Level</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {LEVEL_OPTIONS.map((level) => {
                    const selected = newGroupLevel === level.value
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setNewGroupLevel(level.value)}
                        className={[
                          'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition',
                          selected
                            ? 'border-accent/70 bg-accent/15 text-white shadow-[0_0_24px_rgba(99,102,241,0.18)]'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]',
                        ].join(' ')}
                      >
                        <span className="text-sm font-medium">{level.label}</span>
                        <span
                          className={[
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            selected ? 'bg-accent text-white' : 'bg-white/10 text-white/50',
                          ].join(' ')}
                        >
                          {level.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={createGroupMut.isPending || !trimmedGroupName}
                  className="btn-primary w-full justify-center"
                >
                  {createGroupMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
