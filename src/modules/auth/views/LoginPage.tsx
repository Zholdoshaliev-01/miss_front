import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { loginRequest } from '../api'
import { LoginForm } from '../components/LoginForm'
import { useAuthStore } from '../store/authStore'
import type { LoginPayload } from '../types'
import { getProfile } from '@/modules/profile/api'
import { academyConfig } from '@/core/config/academy'
import axios from 'axios'

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined
    if (data && typeof data === 'object') {
      const detail = data.detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) return String(detail[0])
    }
    return err.message || 'Sign in failed'
  }
  return 'Sign in failed'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setRole = useAuthStore((s) => s.setRole)

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: async (data) => {
      setAuth(data)

      // Fetch profile to get role (backend LoginSerializer doesn't return role)
      try {
        const profile = await getProfile()
        setRole(profile.role)
        toast.success('Welcome back')

        if (profile.role === 'student') {
          navigate('/student/dashboard', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      } catch {
        // Fallback: if profile fetch fails, go to dashboard
        toast.success('Welcome back')
        navigate('/dashboard', { replace: true })
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Sign in to {academyConfig.academyName}
        </p>
      </div>

      <LoginForm onSubmit={(data) => mutation.mutate(data)} isPending={mutation.isPending} />

      <p className="mt-8 text-center text-sm text-white/35 lg:text-left">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-accent-light transition hover:text-accent hover:underline decoration-accent/30 underline-offset-2">
          Create one
        </Link>
      </p>
    </div>
  )
}
