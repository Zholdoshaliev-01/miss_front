import { useEffect, useMemo, useState } from 'react'
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { requestPasswordReset } from '@/modules/auth/api'
import { getProfile, updateProfile } from '@/modules/profile/api'
import { getGroupDetail, getGroups } from '@/modules/groups/api'
import type { UserProfile } from '@/modules/profile/types'
import { PageHeader } from '@/shared/ui/PageHeader'
import {
  User,
  Shield,
  Edit3,
  Globe,
  Save,
  X,
  Loader2,
  Phone,
  Mail,
  FileText,
  GraduationCap,
  Camera,
} from 'lucide-react'
import { useCommonCopy } from '@/shared/i18n'
import { buildMediaUrl } from '@/shared/utils/buildMediaUrl'

export default function ProfilePage() {
  const { t } = useCommonCopy()
  const authUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Fetch live profile data
  const { data: profile, isLoading: _isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  // Edit form state
  const [form, setForm] = useState<Partial<UserProfile>>({})
  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile)
    const avatar = (profile as any)?.avatar || (profile as any)?.profile_image || (profile as any)?.photo || (profile as any)?.image || ''
    return avatar ? buildMediaUrl(avatar) : ''
  }, [avatarFile, profile])

  useEffect(() => {
    if (!avatarFile || !avatarPreview.startsWith('blob:')) return undefined
    return () => URL.revokeObjectURL(avatarPreview)
  }, [avatarFile, avatarPreview])

  function startEditing() {
    setForm({
      username: profile?.username ?? authUser?.username ?? '',
      email: profile?.email ?? authUser?.email ?? '',
      full_name: profile?.full_name ?? '',
      phone_number: profile?.phone_number ?? '',
      bio: profile?.bio ?? '',
    })
    setAvatarFile(null)
    setIsEditing(true)
  }

  const updateMut = useMutation({
    mutationFn: () => {
      if (avatarFile) {
        const payload = new FormData()
        payload.append('phone_number', form.phone_number ?? '')
        payload.append('bio', form.bio ?? '')
        if (form.full_name?.trim()) payload.append('full_name', form.full_name)
        payload.append('avatar', avatarFile)
        return updateProfile(payload)
      }

      const payload: Partial<UserProfile> = {}
      payload.phone_number = form.phone_number
      payload.bio = form.bio
      if (form.full_name?.trim()) {
        payload.full_name = form.full_name
      }
      return updateProfile(payload)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Also update auth store user
      const authState = useAuthStore.getState()
      if (authState.user) {
        useAuthStore.setState({
          user: { ...authState.user, username: data.username, email: data.email },
        })
      }
      toast.success(t.profileUpdated)
      setAvatarFile(null)
      setIsEditing(false)
    },
    onError: (err: any) => {
      const msgs = err.response?.data
      if (msgs && typeof msgs === 'object') {
        // Grab the first validation error message
        const firstError = Object.values(msgs)[0]
        if (Array.isArray(firstError) && typeof firstError[0] === 'string') {
          toast.error(firstError[0])
          return
        }
      }
      toast.error(t.failedUpdateProfile)
    },
  })

  // Fetch live groups for stats
  const { data: paginatedGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  })

  const groups = paginatedGroups?.results ?? []
  const groupDetailQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ['group', group.id],
      queryFn: () => getGroupDetail(group.id),
      enabled: Boolean(group.id),
    })),
  })
  const groupsWithDetails = groups.map((group, index) => groupDetailQueries[index]?.data ?? group)
  const totalGroups = groupsWithDetails.length
  const totalTests = groupsWithDetails.reduce((a, g) => a + (Number(g.tests_count) || 0), 0)
  const totalMaterials = groupsWithDetails.reduce((a, g) => a + (Number(g.materials_count) || 0), 0)
  const totalStudents = groupsWithDetails.reduce((a, g) => a + (Number(g.students_count) || 0), 0)

  const displayUser = profile ?? authUser

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.profile}
        description={t.profileDescription}
      />

      {/* Profile Card */}
      <div className="glass-card overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-r from-accent/25 via-purple-500/20 to-pink-500/15">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] to-transparent" />
          <div className="pointer-events-none absolute right-10 top-4 h-20 w-20 rounded-full bg-accent/20 blur-[40px]" />
          <div className="pointer-events-none absolute right-32 top-8 h-16 w-16 rounded-full bg-purple-500/15 blur-[30px]" />
        </div>

        {/* Avatar + Info */}
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-[var(--color-surface)] bg-gradient-to-br from-accent/50 to-purple-500/50 font-heading text-3xl font-bold text-white shadow-glow">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={(displayUser as any)?.username ?? t.user}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (displayUser as any)?.username?.[0]?.toUpperCase() ?? 'U'
                )}
              </div>
              {isEditing && (
                <label
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-accent text-white shadow-lg transition hover:bg-accent-dark"
                  title={t.changePhoto}
                  aria-label={t.changePhoto}
                >
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      setAvatarFile(file)
                    }}
                  />
                </label>
              )}
            </div>
            <div className="mb-1 flex-1">
              <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {(displayUser as any)?.username ?? t.user}
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
                {(displayUser as any)?.email ?? 'email@example.com'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-active/10 px-2.5 py-0.5 text-xs font-medium text-status-active ring-1 ring-inset ring-status-active/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-active shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                  {t.active}
                </span>
                <span className="flex items-center gap-1 text-xs capitalize" style={{ color: 'var(--color-text-faint)' }}>
                  {((displayUser as any)?.role === 'student' || (displayUser as any)?.role === 'teacher') ? (
                    <GraduationCap className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  {((displayUser as any)?.role === 'teacher' ? t.teacher : (displayUser as any)?.role === 'student' ? t.student : t.user)}
                </span>
              </div>
            </div>
            {!isEditing ? (
              <button type="button" className="btn-secondary text-sm" onClick={startEditing}>
                <Edit3 className="h-4 w-4" />
                {t.editProfile}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={() => updateMut.mutate()}
                  disabled={updateMut.isPending}
                >
                  {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t.save}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => {
                    setAvatarFile(null)
                    setIsEditing(false)
                  }}
                >
                  <X className="h-4 w-4" />
                  {t.cancel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {((displayUser as any)?.role !== 'student') && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: t.groups, value: totalGroups },
            { label: t.students, value: totalStudents },
            { label: t.tests, value: totalTests },
            { label: t.materials, value: totalMaterials },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <div className="font-heading text-xl font-bold" style={{ color: 'var(--color-text)' }}>{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Details */}
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/[0.08]">
              <User className="h-4 w-4 text-accent-light" />
            </div>
            <h3 className="font-heading text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{t.accountDetails}</h3>
          </div>
          <div className="space-y-4">
            {/* Username */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.username}</span>
              {isEditing ? (
                <input
                  type="text"
                  value={form.username ?? ''}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input-field !w-48 !py-1 !text-sm text-right"
                />
              ) : (
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{(displayUser as any)?.username ?? '—'}</span>
              )}
            </div>
            {/* Email */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-faint)' }}>
                <Mail className="h-3 w-3" /> {t.email}
              </span>
              {isEditing ? (
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field !w-48 !py-1 !text-sm text-right"
                />
              ) : (
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{(displayUser as any)?.email ?? '—'}</span>
              )}
            </div>
            {/* Full Name */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.fullName}</span>
              {isEditing ? (
                <input
                  type="text"
                  value={form.full_name ?? ''}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input-field !w-48 !py-1 !text-sm text-right"
                />
              ) : (
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{profile?.full_name || '—'}</span>
              )}
            </div>
            {/* Phone */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-faint)' }}>
                <Phone className="h-3 w-3" /> {t.phone}
              </span>
              {isEditing ? (
                <input
                  type="tel"
                  value={form.phone_number ?? ''}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  className="input-field !w-48 !py-1 !text-sm text-right"
                />
              ) : (
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{profile?.phone_number || '—'}</span>
              )}
            </div>
            {/* Bio */}
            <div className="flex items-start justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <span className="flex items-center gap-1.5 pt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>
                <FileText className="h-3 w-3" /> {t.bio}
              </span>
              {isEditing ? (
                <textarea
                  value={form.bio ?? ''}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="input-field !w-48 !py-1 !text-sm text-right"
                  rows={2}
                />
              ) : (
                <span className="max-w-[200px] text-right text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {profile?.bio || '—'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/[0.08]">
              <Shield className="h-4 w-4 text-accent-light" />
            </div>
            <h3 className="font-heading text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{t.security}</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.password}</span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>••••••••••</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.lastLogin}</span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t.justNow}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>{t.twoFactorAuth}</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
                style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}
              >
                {t.notEnabled}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-secondary mt-5 w-full text-sm disabled:opacity-50"
            onClick={() => {
              if (!displayUser?.email) {
                toast.error(t.noEmailForReset);
                return;
              }
              const promise = requestPasswordReset({ email: displayUser.email });
              toast.promise(promise, {
                loading: t.sendingReset,
                success: t.resetSent,
                error: t.resetFailed
              });
            }}
          >
            <Shield className="h-4 w-4" />
            {t.changePassword}
          </button>
        </div>
      </div>
    </div>
  )
}
