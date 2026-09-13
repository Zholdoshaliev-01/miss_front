import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Users, KeyRound, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getStudentGroups, joinGroup } from '../api'
import axios from 'axios'
import { useCommonCopy } from '@/shared/i18n'

function extractInviteCode(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const decoded = decodeURIComponent(trimmed)
    const joinMatch = decoded.match(/\/join\/([^/?#]+)/)
    if (joinMatch?.[1]) return joinMatch[1]

    const url = new URL(decoded)
    const pathCode = url.pathname.split('/').filter(Boolean).pop()
    return pathCode || decoded
  } catch {
    const joinMatch = trimmed.match(/\/join\/([^/?#]+)/)
    if (joinMatch?.[1]) return joinMatch[1]
    return trimmed
  }
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined
    if (data && typeof data === 'object') {
      const detail = data.detail
      if (typeof detail === 'string') return detail
    }
    return err.message || 'Failed to join group'
  }
  return 'Failed to join group'
}

type Membership = {
  groupId: number
  status: string
}

function getMemberships(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (!data || typeof data !== 'object') return []

  const results = (data as { results?: unknown }).results
  return Array.isArray(results) ? results as Record<string, unknown>[] : []
}

function findMembership(data: unknown, inviteCode: string): Membership | undefined {
  for (const membership of getMemberships(data)) {
    const nestedGroup = membership.group && typeof membership.group === 'object'
      ? membership.group as Record<string, unknown>
      : undefined
    const membershipInviteCode = membership.invite_code ?? nestedGroup?.invite_code

    if (String(membershipInviteCode ?? '') !== inviteCode) continue

    const groupId = Number(membership.group_id ?? nestedGroup?.id ?? membership.group ?? membership.id)
    if (!Number.isFinite(groupId)) continue

    return {
      groupId,
      status: String(membership.status ?? '').toLowerCase(),
    }
  }

  return undefined
}

function isDuplicateMembershipError(err: unknown): boolean {
  const message = getErrorMessage(err).toLowerCase()
  return message.includes('already') || message.includes('уже')
}

export function JoinLandingView() {
  const { t } = useCommonCopy()
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  return (
    <div className="glass-card p-8">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/10">
        <KeyRound className="h-7 w-7 text-accent-light" />
      </div>
      <h1 className="text-center font-heading text-2xl font-bold tracking-tight text-white">{t.joinGroup}</h1>
      <p className="mx-auto mt-2 max-w-sm text-center text-sm text-white/40">
        {t.enterInviteCode}
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const inviteCode = extractInviteCode(code)
          if (!inviteCode) return
          navigate(`/join/${encodeURIComponent(inviteCode)}`, { replace: true })
        }}
      >
        <div>
          <label htmlFor="invite-code" className="mb-1.5 block text-sm font-medium text-white/65">
            {t.inviteCode}
          </label>
          <input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. abc12345-6789-..."
            className="input-field text-center font-heading text-lg tracking-widest"
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full !py-3"
        >
          {t.continue}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

export default function JoinPage() {
  const { t } = useCommonCopy()
  const params = useParams()
  const navigate = useNavigate()
  const inviteCode = extractInviteCode(params.inviteCode ?? params['*'] ?? '')

  const membershipQuery = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => getStudentGroups(),
    enabled: Boolean(inviteCode),
  })

  const activeMembership = findMembership(membershipQuery.data, inviteCode)
  const activeGroupId = activeMembership?.status === 'active'
    ? activeMembership.groupId
    : undefined

  useEffect(() => {
    if (activeGroupId !== undefined) {
      navigate(`/student/groups/${activeGroupId}`, { replace: true })
    }
  }, [activeGroupId, navigate])

  const mutation = useMutation({
    mutationFn: () => joinGroup(inviteCode),
    onSuccess: async (data) => {
      const refreshed = await membershipQuery.refetch()
      const membership = findMembership(refreshed.data, inviteCode)

      if (membership?.status === 'active') {
        toast.success(data.detail || t.requestSent)
        navigate(`/student/groups/${membership.groupId}`, { replace: true })
        return
      }

      toast.success(data.detail || t.requestSent)
      navigate('/pending', { replace: true })
    },
    onError: async (err) => {
      if (isDuplicateMembershipError(err)) {
        const refreshed = await membershipQuery.refetch()
        if (refreshed.isError) return

        const membership = findMembership(refreshed.data, inviteCode)

        if (membership?.status === 'active') {
          navigate(`/student/groups/${membership.groupId}`, { replace: true })
          return
        }

        navigate('/pending', { replace: true })
        return
      }

      toast.error(getErrorMessage(err))
    },
  })

  if (membershipQuery.isFetching || activeGroupId !== undefined) {
    return (
      <div className="glass-card flex items-center justify-center gap-3 p-8 text-sm text-white/55">
        <Loader2 className="h-5 w-5 animate-spin text-accent-light" />
        {t.checkingMembership}
      </div>
    )
  }

  if (membershipQuery.isError) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-white/55">{t.membershipCheckFailed}</p>
        <button
          type="button"
          className="btn-primary mt-6 !py-2.5"
          onClick={() => membershipQuery.refetch()}
        >
          {t.retry}
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card p-8 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/10">
        <Users className="h-7 w-7 text-accent-light" />
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-white">{t.joinGroup}</h1>
      <p className="mt-2 text-sm text-white/40">
        {t.aboutToJoin}
      </p>
      <div className="mt-3 inline-block rounded-lg bg-accent/[0.08] px-4 py-2 font-heading text-lg font-bold tracking-widest text-accent-light">
        {inviteCode}
      </div>
      <button
        type="button"
        className="btn-primary mt-8 w-full !py-3"
        disabled={mutation.isPending || !inviteCode}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.sendingRequest}
          </span>
        ) : (
          <>
            <Users className="h-4 w-4" />
            {t.joinGroup}
          </>
        )}
      </button>
      <p className="mt-4 text-xs text-white/30">
        {t.approvalNeeded}
      </p>
    </div>
  )
}
