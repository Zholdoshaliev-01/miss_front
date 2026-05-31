import { useState } from 'react'
import { Plus, Users, BookOpen, ClipboardCheck, FileText, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { getGroups, createGroup } from '../api'
import { createRoom } from '@/modules/chat/api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type { Group } from '../types'

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

  const { data: paginatedGroups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  })

  const createGroupMut = useMutation({
    mutationFn: async () => {
      // 1. Create in Django
      const group = await createGroup({ group_name: newGroupName, level: newGroupLevel })
      
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
    onError: () => {
      toast.error('Failed to create group')
    }
  })

  const groups = paginatedGroups?.results || []
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
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{groups.length}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Total Groups</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groups.reduce((a, g) => a + (Number(g.students_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Total Students</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groups.reduce((a, g) => a + (Number(g.materials_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Materials</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groups.reduce((a, g) => a + (Number(g.tests_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Tests</div>
        </div>
      </div>

      {hasGroups ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Computer Science 101"
                  className="input-field w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Level</label>
                <select 
                  value={newGroupLevel}
                  onChange={(e) => setNewGroupLevel(e.target.value)}
                  className="input-field w-full appearance-none"
                >
                  <option value="A1">Beginner (A1)</option>
                  <option value="A2">Elementary (A2)</option>
                  <option value="B1">Intermediate (B1)</option>
                  <option value="B2">Upper Intermediate (B2)</option>
                  <option value="C1">Advanced (C1)</option>
                </select>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => createGroupMut.mutate()}
                  disabled={createGroupMut.isPending || !newGroupName.trim()}
                  className="btn-primary w-full justify-center"
                >
                  {createGroupMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
