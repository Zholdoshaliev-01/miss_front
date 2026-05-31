import { useQuery } from '@tanstack/react-query'
import { GraduationCap, Users, Hash, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getStudentGroups } from '@/modules/student/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function StudentGroupsPage() {
  const { data: rawGroupsData, isLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
  })

  // Handle both paginated response ({ results: [...] }) and flat array ([...])
  const groups: any[] = Array.isArray(rawGroupsData) 
    ? rawGroupsData 
    : (rawGroupsData as any)?.results ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-400 shadow-lg" style={{ boxShadow: '0 6px 20px rgba(99,102,241,0.15)' }}>
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold" style={{ color: 'var(--color-text)' }}>My Groups</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {groups.length} {groups.length === 1 ? 'group' : 'groups'} joined
            </p>
          </div>
        </div>

        <Link to="/join" className="btn-primary !py-2 !text-sm flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Join New Group
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}>
            <Hash className="h-8 w-8" />
          </div>
          <h2 className="mt-6 font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>No groups yet</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>You haven't joined any groups.</p>
          <Link to="/join" className="btn-primary mt-6 !py-2.5 !px-6 text-sm">
            Join a Group
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const imgSrc = group.group_image 
              ? (group.group_image.startsWith('http') ? group.group_image : `${BASE_URL}${group.group_image}`)
              : null

            return (
              <div key={group.id} className="glass-card glass-card-hover card-shine group p-5">
                <div className="flex items-start gap-4">
                  {imgSrc ? (
                    <img 
                      src={imgSrc} 
                      alt={group.group_name} 
                      className="h-14 w-14 rounded-xl object-cover shadow-sm ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 text-accent ring-1 ring-white/10">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                  )}
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-heading text-base font-bold" style={{ color: 'var(--color-text)' }}>
                      {group.group_name}
                    </h3>
                    <div className="mt-1 flex flex-col gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        Level {group.level}
                      </span>
                      <span style={{ color: 'var(--color-text-faint)' }}>
                        Joined {formatDate(group.created_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                  <Link to={`/student/materials?group=${group.id}`} className="btn-secondary !py-1.5 !text-xs w-full text-center">
                    Materials
                  </Link>
                  <Link to={`/student/dashboard?group=${group.id}`} className="btn-secondary !py-1.5 !text-xs w-full text-center">
                    Tasks
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
