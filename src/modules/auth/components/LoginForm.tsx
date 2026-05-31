import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { User, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { LoginPayload } from '../types'
import { cn } from '@/shared/utils/cn'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

interface LoginFormProps {
  onSubmit: (data: LoginPayload) => void
  isPending?: boolean
  className?: string
}

export function LoginForm({ onSubmit, isPending, className }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('glass-card space-y-5 p-8', className)}
    >
      {/* Username */}
      <div>
        <label htmlFor="login-username" className="mb-1.5 block text-sm font-medium text-white/65">
          Username
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
          <input
            id="login-username"
            autoComplete="username"
            className="input-field input-with-icon"
            placeholder="your username"
            {...register('username')}
          />
        </div>
        {errors.username ? <p className="mt-1.5 text-xs text-status-expelled">{errors.username.message}</p> : null}
      </div>

      {/* Password */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-medium text-white/65">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-accent-light transition hover:text-accent hover:underline decoration-accent/30 underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="input-field input-with-icon"
            placeholder="••••••••"
            {...register('password')}
          />
        </div>
        {errors.password ? <p className="mt-1.5 text-xs text-status-expelled">{errors.password.message}</p> : null}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary mt-2 w-full !py-3"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Signing in…
          </span>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  )
}
