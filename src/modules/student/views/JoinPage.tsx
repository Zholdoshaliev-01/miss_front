import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Users, KeyRound, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { joinGroup } from '../api'
import axios from 'axios'

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

export function JoinLandingView() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  return (
    <div className="glass-card p-8">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/10">
        <KeyRound className="h-7 w-7 text-accent-light" />
      </div>
      <h1 className="text-center font-heading text-2xl font-bold tracking-tight text-white">Join a Group</h1>
      <p className="mx-auto mt-2 max-w-sm text-center text-sm text-white/40">
        Enter the invite code from your teacher to join their group.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = code.trim()
          if (!trimmed) return
          navigate(`/join/${encodeURIComponent(trimmed)}`, { replace: true })
        }}
      >
        <div>
          <label htmlFor="invite-code" className="mb-1.5 block text-sm font-medium text-white/65">
            Invite Code
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
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

export default function JoinPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => joinGroup(inviteCode!),
    onSuccess: (data) => {
      toast.success(data.detail || 'Request sent!')
      navigate('/pending', { replace: true })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })

  return (
    <div className="glass-card p-8 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/10">
        <Users className="h-7 w-7 text-accent-light" />
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Join Group</h1>
      <p className="mt-2 text-sm text-white/40">
        You're about to join with invite code:
      </p>
      <div className="mt-3 inline-block rounded-lg bg-accent/[0.08] px-4 py-2 font-heading text-lg font-bold tracking-widest text-accent-light">
        {inviteCode}
      </div>
      <button
        type="button"
        className="btn-primary mt-8 w-full !py-3"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending request…
          </span>
        ) : (
          <>
            <Users className="h-4 w-4" />
            Join Group
          </>
        )}
      </button>
      <p className="mt-4 text-xs text-white/30">
        Your teacher will need to approve your request.
      </p>
    </div>
  )
}
