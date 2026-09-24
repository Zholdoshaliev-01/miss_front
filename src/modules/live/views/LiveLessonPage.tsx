import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { ArrowLeft, GraduationCap, Loader2, Play, RefreshCw, Video } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getGroupDetail } from '@/modules/groups/api'
import type { Group } from '@/modules/groups/types'
import { getStudentGroups } from '@/modules/student/api'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useCommonCopy } from '@/shared/i18n'
import { LiveKitLessonRoom } from '../components/LiveKitLessonRoom'
import { endLiveLesson, getActiveLiveLesson, getLiveKitCredentials, startLiveLesson, type LiveLesson } from '../api'

type StudentGroupShape = Group & {
  group_id?: number
  name?: string
  group_level?: string
}

function normalizeStudentGroup(raw: StudentGroupShape) {
  return {
    id: raw.group_id ?? raw.id,
    group_name: raw.group_name ?? raw.name ?? 'Untitled group',
    level: raw.group_level ?? raw.level ?? '',
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback
  const data = error.response?.data as { detail?: string; error?: string } | undefined
  return data?.detail || data?.error || fallback
}

export default function LiveLessonPage() {
  const { t } = useCommonCopy()
  const { groupId } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const numericGroupId = Number(groupId)
  const isStudent = location.pathname.startsWith('/student/')
  const [startedLesson, setStartedLesson] = useState<LiveLesson | null>(null)
  const [hasLeft, setHasLeft] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

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

  const studentGroups = (rawStudentGroups?.results ?? []).map(normalizeStudentGroup)
  const group = isStudent ? studentGroups.find((item) => item.id === numericGroupId) : teacherGroup
  const isGroupLoading = isStudent ? studentGroupsLoading : teacherGroupLoading
  const backTo = isStudent ? `/student/groups/${numericGroupId}` : `/groups/${numericGroupId}`

  const activeLessonQuery = useQuery({
    queryKey: ['active-live-lesson', numericGroupId, isStudent ? 'student' : 'teacher'],
    queryFn: () => getActiveLiveLesson(numericGroupId, isStudent),
    enabled: Number.isFinite(numericGroupId) && !!group,
    retry: 1,
    refetchOnWindowFocus: false,
  })
  const lesson = startedLesson ?? activeLessonQuery.data ?? null
  const credentialsQuery = useQuery({
    queryKey: ['livekit-token', lesson?.id, reconnectAttempt],
    queryFn: () => getLiveKitCredentials(lesson!.id),
    enabled: !!lesson?.id && !hasLeft,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const startMutation = useMutation({
    mutationFn: () => startLiveLesson(numericGroupId),
    onSuccess: (newLesson) => {
      setStartedLesson(newLesson)
      setHasLeft(false)
      queryClient.setQueryData(['active-live-lesson', numericGroupId, 'teacher'], newLesson)
      toast.success('Урок начат')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Не удалось начать урок.')),
  })
  const endMutation = useMutation({ mutationFn: (lessonId: number) => endLiveLesson(lessonId) })

  if (!Number.isFinite(numericGroupId)) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <Video className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">{t.groupNotFound}</h1>
        <Link to={isStudent ? '/student/groups' : '/groups'} className="btn-primary mt-6 !py-2.5">{t.backToGroups}</Link>
      </div>
    )
  }

  if (isGroupLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>

  if (!group) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <GraduationCap className="h-10 w-10 text-white/15" />
        <h1 className="mt-4 font-heading text-xl font-bold text-white">{t.groupNotFound}</h1>
        <Link to={isStudent ? '/student/groups' : '/groups'} className="btn-primary mt-6 !py-2.5">{t.backToGroups}</Link>
      </div>
    )
  }

  const pageHeader = (
    <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
      <ArrowLeft className="h-4 w-4" />{t.backToGroup}
    </Link>
  )

  if (activeLessonQuery.isLoading) {
    return <div className="space-y-5">{pageHeader}<div className="glass-card flex min-h-[440px] flex-col items-center justify-center text-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /><p className="mt-4 text-sm text-white/45">Проверяем активный урок…</p></div></div>
  }

  if (activeLessonQuery.isError) {
    return (
      <div className="space-y-5">{pageHeader}<div className="glass-card flex min-h-[440px] flex-col items-center justify-center px-5 text-center">
        <Video className="h-10 w-10 text-rose-300/50" /><h1 className="mt-4 font-heading text-xl font-bold text-white">Не удалось проверить урок</h1>
        <p className="mt-2 max-w-md text-sm text-white/45">{getErrorMessage(activeLessonQuery.error, 'Сервер временно недоступен.')}</p>
        <button type="button" className="btn-secondary mt-6" onClick={() => activeLessonQuery.refetch()}><RefreshCw className="h-4 w-4" /> Повторить</button>
      </div></div>
    )
  }

  if (!lesson || hasLeft) {
    return (
      <div className="space-y-5">
        {pageHeader}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_36%),linear-gradient(135deg,rgba(99,102,241,0.14),rgba(15,23,42,0.55))] px-6 py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-200/20"><Video className="h-8 w-8" /></div>
          <h1 className="mt-5 font-heading text-2xl font-bold text-white">{group.group_name}</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/45">
            {hasLeft ? 'Вы покинули видеоурок. Можно присоединиться снова, пока урок активен.' : isStudent ? 'Преподаватель ещё не начал урок. Попробуйте проверить снова чуть позже.' : 'Начните онлайн-урок, когда будете готовы. Студенты смогут подключиться к активной комнате.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {!isStudent && !hasLeft && (
              <button type="button" className="btn-primary" disabled={startMutation.isPending} onClick={() => startMutation.mutate()}>
                {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Начать урок
              </button>
            )}
            <button type="button" className={isStudent || hasLeft ? 'btn-primary' : 'btn-secondary'} onClick={async () => {
              setHasLeft(false)
              const result = await activeLessonQuery.refetch()
              if (!result.data && isStudent) toast.info('Активного урока пока нет')
            }}>
              <RefreshCw className="h-4 w-4" /> {hasLeft ? 'Присоединиться снова' : 'Проверить снова'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (credentialsQuery.isLoading || credentialsQuery.isFetching) {
    return <div className="space-y-5">{pageHeader}<div className="glass-card flex min-h-[520px] flex-col items-center justify-center text-center"><Loader2 className="h-9 w-9 animate-spin text-accent" /><h2 className="mt-5 font-heading text-lg font-semibold text-white">Готовим комнату урока</h2><p className="mt-2 text-sm text-white/40">Получаем безопасный ключ подключения…</p></div></div>
  }

  if (credentialsQuery.isError || !credentialsQuery.data) {
    return (
      <div className="space-y-5">{pageHeader}<div className="glass-card flex min-h-[520px] flex-col items-center justify-center px-5 text-center">
        <Video className="h-10 w-10 text-rose-300/50" /><h2 className="mt-4 font-heading text-xl font-bold text-white">Не удалось подключить видеоурок</h2>
        <p className="mt-2 max-w-md text-sm text-white/45">{getErrorMessage(credentialsQuery.error, 'Не удалось получить ключ LiveKit.')}</p>
        <button type="button" className="btn-primary mt-6" onClick={() => credentialsQuery.refetch()}><RefreshCw className="h-4 w-4" /> Повторить</button>
      </div></div>
    )
  }

  return (
    <div className="space-y-4">
      {pageHeader}
      <LiveKitLessonRoom
        credentials={credentialsQuery.data}
        lesson={lesson}
        groupName={group.group_name}
        displayName={user?.username || user?.email || 'Kunduz User'}
        isTeacher={!isStudent}
        reconnectAttempt={reconnectAttempt}
        onReconnect={async () => {
          await credentialsQuery.refetch()
          setReconnectAttempt((attempt) => attempt + 1)
        }}
        onLeave={() => setHasLeft(true)}
        onEndLesson={async () => {
          try {
            await endMutation.mutateAsync(lesson.id)
            toast.success('Урок завершён')
            setStartedLesson(null)
            setHasLeft(false)
            queryClient.setQueryData(['active-live-lesson', numericGroupId, 'teacher'], null)
          } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось завершить урок.'))
            throw error
          }
        }}
      />
    </div>
  )
}
