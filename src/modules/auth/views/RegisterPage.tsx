import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { registerRequest } from '../api'
import { RegisterForm } from '../components/RegisterForm'
import type { RegisterPayload } from '../types'
import { academyConfig } from '@/core/config/academy'
import axios from 'axios'

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      const val = firstKey ? data[firstKey] : undefined
      if (typeof val === 'string') return val
      if (Array.isArray(val)) return String(val[0])
    }
    return err.message || 'Registration failed'
  }
  return 'Registration failed'
}

export default function RegisterPage() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
    onSuccess: () => {
      toast.success('Account created — sign in')
      navigate('/login', { replace: true })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
          Create student account
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Join {academyConfig.academyName} and request access to your group.
        </p>
      </div>

      <RegisterForm onSubmit={(data) => mutation.mutate(data)} isPending={mutation.isPending} />

      <p className="mt-8 text-center text-sm text-white/35 lg:text-left">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-light transition hover:text-accent hover:underline decoration-accent/30 underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  )
}
