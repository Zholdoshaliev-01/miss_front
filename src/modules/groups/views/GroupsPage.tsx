import { useState } from 'react'
import { Edit3, Plus, Users, BookOpen, ClipboardCheck, FileText, GraduationCap, Loader2, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { getGroupDetail, getGroups, createGroup, deleteGroup, updateGroup } from '../api'
import type { Group } from '../types'
import { useCommonCopy } from '@/shared/i18n'

const LEVEL_OPTIONS = [
  { value: 'A1', label: 'Beginner', description: 'A1' },
  { value: 'A2', label: 'Elementary', description: 'A2' },
  { value: 'B1', label: 'Intermediate', description: 'B1' },
  { value: 'B2', label: 'Upper Intermediate', description: 'B2' },
  { value: 'C1', label: 'Advanced', description: 'C1' },
]

function GroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: Group
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
}) {
  const { t } = useCommonCopy()
  // Use a fallback gradient if color isn't provided by API
  const color = 'from-blue-500 to-cyan-400'

  return (
    <div className="glass-card glass-card-hover card-shine group relative overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />
      <div className="absolute right-4 top-4 z-10 flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(group)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/60 transition hover:border-accent/30 hover:bg-accent/15 hover:text-white"
          title={t.editGroup}
          aria-label={t.editGroup}
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(group)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/60 transition hover:border-rose-400/30 hover:bg-rose-500/15 hover:text-rose-200"
          title={t.deleteGroup}
          aria-label={t.deleteGroup}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Link to={`/groups/${group.id}`} className="block p-5 pr-24">
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
            <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>{t.students}</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center" style={{ color: 'var(--color-text-faint)' }}>
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{Number(group.materials_count) || 0}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>{t.materials}</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center" style={{ color: 'var(--color-text-faint)' }}>
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{Number(group.homeworks_count) || 0}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>{t.homework}</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center" style={{ color: 'var(--color-text-faint)' }}>
              <ClipboardCheck className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-heading text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{Number(group.tests_count) || 0}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>{t.tests}</div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function GroupsPage() {
  const queryClient = useQueryClient()
  const { t } = useCommonCopy()
  const [showModal, setShowModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupLevel, setNewGroupLevel] = useState('A1')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupLevel, setEditGroupLevel] = useState('A1')
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
  const trimmedGroupName = newGroupName.trim()
  const trimmedEditGroupName = editGroupName.trim()

  const { data: paginatedGroups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  })

  const createGroupMut = useMutation({
    mutationFn: async () => {
      return createGroup({ group_name: trimmedGroupName, level: newGroupLevel })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success(t.groupCreated)
      setShowModal(false)
      setNewGroupName('')
      setNewGroupLevel('A1')

      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
    onError: (err: any) => {
      const data = err.response?.data
      const msg =
        data?.detail ||
        data?.group_name?.[0] ||
        data?.level?.[0] ||
        err.message ||
        t.failedCreateGroup
      toast.error(msg)
    }
  })

  const updateGroupMut = useMutation({
    mutationFn: () => {
      if (!editingGroup) throw new Error('Group is missing')
      return updateGroup(editingGroup.id, {
        group_name: trimmedEditGroupName,
        level: editGroupLevel,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      if (editingGroup?.id) {
        queryClient.invalidateQueries({ queryKey: ['group', editingGroup.id] })
      }
      toast.success(t.groupUpdated)
      setEditingGroup(null)
      setEditGroupName('')
      setEditGroupLevel('A1')
    },
    onError: (err: any) => {
      const data = err.response?.data
      toast.error(data?.detail || data?.group_name?.[0] || data?.level?.[0] || err.message || t.failedCreateGroup)
    },
  })

  const deleteGroupMut = useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      toast.success(t.groupDeleted)
      setGroupToDelete(null)
    },
    onError: (err: any) => {
      const data = err.response?.data
      toast.error(data?.detail || err.message || t.failedCreateGroup)
    },
  })

  function openEditGroup(group: Group) {
    setEditingGroup(group)
    setEditGroupName(group.group_name)
    setEditGroupLevel(group.level || 'A1')
  }

  function closeCreateModal() {
    createGroupMut.reset()
    setShowModal(false)
  }

  function closeEditModal() {
    updateGroupMut.reset()
    setEditingGroup(null)
  }

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
        title={t.groups}
        description={t.groupsDescription}
        actions={
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary text-sm">
            <Plus className="h-4 w-4" />
            {t.createGroup}
          </button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{groupsWithDetails.length}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{t.totalGroups}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groupsWithDetails.reduce((a, g) => a + (Number(g.students_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{t.totalStudents}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groupsWithDetails.reduce((a, g) => a + (Number(g.materials_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{t.materials}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {groupsWithDetails.reduce((a, g) => a + (Number(g.tests_count) || 0), 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{t.tests}</div>
        </div>
      </div>

      {hasGroups ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groupsWithDetails.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={openEditGroup}
              onDelete={setGroupToDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title={t.noGroupsYet}
          description={t.noGroupsDescription}
          action={
            <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              {t.createGroup}
            </button>
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(groupToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteGroupMut.isPending) setGroupToDelete(null)
        }}
        title={t.deleteGroupTitle}
        description={groupToDelete ? `${t.deleteGroupDescription} (${groupToDelete.group_name})` : t.deleteGroupDescription}
        confirmLabel={deleteGroupMut.isPending ? t.saving : t.delete}
        cancelLabel={t.cancel}
        variant="danger"
        onConfirm={() => {
          if (groupToDelete && !deleteGroupMut.isPending) {
            deleteGroupMut.mutate(groupToDelete.id)
          }
        }}
      />

      {editingGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal()
          }}
        >
          <div className="glass-card relative w-full max-w-xl overflow-hidden p-0 animate-in fade-in zoom-in duration-200">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/20 blur-[70px]" />
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                closeEditModal()
              }}
              className="absolute right-4 top-4 z-30 rounded-xl p-2 transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative border-b border-white/[0.06] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent-light ring-1 ring-accent/20">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t.editGroup}</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.groupFormDescription}</p>
                </div>
              </div>
            </div>
            <form
              className="relative space-y-5 p-6"
              onSubmit={(event) => {
                event.preventDefault()
                if (!trimmedEditGroupName) {
                  toast.error(t.groupNameRequired)
                  return
                }
                if (!updateGroupMut.isPending) updateGroupMut.mutate()
              }}
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t.groupName}</label>
                  <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                    {trimmedEditGroupName.length}/45
                  </span>
                </div>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder={t.groupNamePlaceholder}
                  className="input-field w-full !rounded-2xl !py-3"
                  maxLength={45}
                  required
                  autoFocus
                  disabled={updateGroupMut.isPending}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t.chooseLevel}</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {LEVEL_OPTIONS.map((level) => {
                    const selected = editGroupLevel === level.value
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setEditGroupLevel(level.value)}
                        disabled={updateGroupMut.isPending}
                        className={[
                          'flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                          selected
                            ? 'border-accent/70 bg-accent/15 text-white shadow-[0_0_24px_rgba(99,102,241,0.18)]'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]',
                        ].join(' ')}
                      >
                        <span className="min-w-0 pr-3 text-sm font-medium">{level.label}</span>
                        <span className={[
                          'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
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
              <button
                type="submit"
                disabled={updateGroupMut.isPending || !trimmedEditGroupName}
                className="btn-primary w-full justify-center !rounded-2xl !py-3"
              >
                {updateGroupMut.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  t.updateGroup
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreateModal()
          }}
        >
          <div className="glass-card relative w-full max-w-xl overflow-hidden p-0 animate-in fade-in zoom-in duration-200">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/20 blur-[70px]" />
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                closeCreateModal()
              }}
              className="absolute right-4 top-4 z-30 rounded-xl p-2 transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative border-b border-white/[0.06] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent-light ring-1 ring-accent/20">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t.createNewGroup}</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.groupFormDescription}</p>
                </div>
              </div>
            </div>
            <form
              className="relative space-y-5 p-6"
              onSubmit={(event) => {
                event.preventDefault()
                if (!trimmedGroupName) {
                  toast.error(t.groupNameRequired)
                  return
                }
                if (!createGroupMut.isPending) createGroupMut.mutate()
              }}
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t.groupName}</label>
                  <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                    {trimmedGroupName.length}/45
                  </span>
                </div>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={t.groupNamePlaceholder}
                  className="input-field w-full !rounded-2xl !py-3"
                  maxLength={45}
                  required
                  autoFocus
                  disabled={createGroupMut.isPending}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t.chooseLevel}</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {LEVEL_OPTIONS.map((level) => {
                    const selected = newGroupLevel === level.value
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setNewGroupLevel(level.value)}
                        disabled={createGroupMut.isPending}
                        className={[
                          'group/level flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                          selected
                            ? 'border-accent/70 bg-accent/15 text-white shadow-[0_0_24px_rgba(99,102,241,0.18)]'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]',
                        ].join(' ')}
                      >
                        <span className="min-w-0 pr-3 text-sm font-medium">{level.label}</span>
                        <span
                          className={[
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
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
              {createGroupMut.isPending && (
                <p className="rounded-2xl border border-accent/15 bg-accent/[0.06] px-4 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {t.groupCreatingHint}
                </p>
              )}
              <div className="pt-1">
                <button 
                  type="submit"
                  disabled={createGroupMut.isPending || !trimmedGroupName}
                  className="btn-primary w-full justify-center !rounded-2xl !py-3"
                >
                  {createGroupMut.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t.creating}
                    </>
                  ) : (
                    t.createGroup
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
