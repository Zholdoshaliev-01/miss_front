import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, ExternalLink, GraduationCap, Loader2, Mic, MonitorUp, Shield, Video, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getGroupDetail } from '@/modules/groups/api'
import { getStudentGroups } from '@/modules/student/api'
import { academyConfig } from '@/core/config/academy'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useCommonCopy } from '@/shared/i18n'

function normalizeStudentGroup(raw: any) {
  return {
    id: raw.group_id ?? raw.id,
    group_name: raw.group_name ?? raw.name ?? 'Untitled group',
    level: raw.group_level ?? raw.level ?? '',
  }
}

function makeRoomName(groupId: number, groupName?: string) {
  const cleanName = (groupName || 'group')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  return `kunduz-study-hub-${groupId}-${cleanName || 'lesson'}`
}

export default function LiveLessonPage() {
  const { t } = useCommonCopy()
  const { groupId } = useParams()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const numericGroupId = Number(groupId)
  const isStudent = location.pathname.startsWith('/student/')

  const { data: teacherGroup, isLoading: teacherGroupLoading } = useQuery({
    queryKey: ['group', numericGroupId],
    queryFn: () => getGroupDetail(numericGroupId),
    enabled: Number.isFinite(numericGroupId) && !isStudent,
  })

  const { data: rawStudentGroups, isLoading: studentGroupsLoading } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
    enabled: Number.isFinite(numericGroupId) && isStudent,
  })

  const studentGroups = (Array.isArray(rawStudentGroups)
    ? rawStudentGroups
    : (rawStudentGroups as any)?.results ?? []
  ).map(normalizeStudentGroup)

  const studentGroup = studentGroups.find((group: any) => group.id === numericGroupId)
  const group = isStudent ? studentGroup : teacherGroup
  const isLoading = isStudent ? studentGroupsLoading : teacherGroupLoading
  const backTo = isStudent ? `/student/groups/${numericGroupId}` : `/groups/${numericGroupId}`

  const roomName = useMemo(() => makeRoomName(numericGroupId, group?.group_name), [numericGroupId, group?.group_name])
  const displayName = user?.username || user?.email || 'Kunduz User'
  const lessonUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinPageEnabled=true`
  const shareUrl = `${window.location.origin}/student/live/${numericGroupId}`

  if (!Number.isFinite(numericGroupId)) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <Video className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">{t.groupNotFound}</h1>
        <Link to={isStudent ? '/student/groups' : '/groups'} className="btn-primary mt-6 !py-2.5">{t.backToGroups}</Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <GraduationCap className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">{t.groupNotFound}</h1>
        <Link to={isStudent ? '/student/groups' : '/groups'} className="btn-primary mt-6 !py-2.5">{t.backToGroups}</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
        <ArrowLeft className="h-4 w-4" />
        {t.backToGroup}
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_34%),linear-gradient(135deg,rgba(99,102,241,0.15),rgba(15,23,42,0.55))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-accent/10 blur-[80px]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-200/20">
              <Video className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/70">
                {isStudent ? t.joinLesson : t.startLesson}
              </p>
              <h1 className="mt-1 font-heading text-3xl font-bold text-white">{group.group_name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{t.liveLessonDescription}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={lessonUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                  <Video className="h-4 w-4" />
                  {isStudent ? t.joinLesson : t.startLesson}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl)
                    toast.success(t.lessonLinkCopied)
                  }}
                  className="btn-secondary text-sm"
                >
                  <Copy className="h-4 w-4" />
                  {t.copyLessonLink}
                </button>
                <a href={lessonUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                  <ExternalLink className="h-4 w-4" />
                  {t.openInNewTab}
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <Mic className="h-5 w-5 text-cyan-200" />
              <p className="mt-2 text-sm font-semibold text-white/80">{t.lessonStepDevices}</p>
              <p className="mt-1 text-xs text-white/40">{t.lessonStepDevicesHint}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <Users className="h-5 w-5 text-accent-light" />
              <p className="mt-2 text-sm font-semibold text-white/80">{t.lessonStepGroup}</p>
              <p className="mt-1 text-xs text-white/40">{t.lessonStepGroupHint}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <MonitorUp className="h-5 w-5 text-emerald-200" />
              <p className="mt-2 text-sm font-semibold text-white/80">{t.lessonStepShare}</p>
              <p className="mt-1 text-xs text-white/40">{t.lessonStepShareHint}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-sm font-semibold text-white/75">{t.lessonRoom}</h2>
            <p className="mt-0.5 text-xs text-white/35">{academyConfig.academyName} · {roomName}</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200 sm:flex">
            <Shield className="h-3.5 w-3.5" />
            {t.cameraMicNotice}
          </div>
        </div>
        <div className="h-[72vh] min-h-[520px] bg-black">
          <iframe
            title={`${t.onlineLesson}: ${group.group_name}`}
            src={lessonUrl}
            className="h-full w-full border-0"
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  )
}
