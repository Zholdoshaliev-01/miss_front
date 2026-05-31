import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { User, Mail, Lock, Phone } from 'lucide-react'
import type { RegisterPayload } from '../types'
import { cn } from '@/shared/utils/cn'

const schema = z.object({
  username: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  full_name: z.string().min(1, 'Required'),
  phone_number: z.string().min(1, 'Required'),
})

interface RegisterFormProps {
  onSubmit: (data: RegisterPayload) => void
  isPending?: boolean
  className?: string
}

function FormField({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string
  label: string
  icon?: typeof User
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white/65">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />}
        {children}
      </div>
      {error ? <p className="mt-1.5 text-xs text-status-expelled">{error}</p> : null}
    </div>
  )
}

export function RegisterForm({ onSubmit, isPending, className }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      full_name: '',
      phone_number: '',
    },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('glass-card max-h-[min(72vh,680px)] space-y-4 overflow-y-auto p-8', className)}
    >
      {/* Full name */}
      <FormField id="reg-fullname" label="Full name" icon={User} error={errors.full_name?.message}>
        <input id="reg-fullname" className="input-field input-with-icon" placeholder="John Doe" {...register('full_name')} />
      </FormField>

      {/* Name row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="reg-first" label="First name" icon={User} error={errors.first_name?.message}>
          <input id="reg-first" className="input-field input-with-icon" placeholder="John" {...register('first_name')} />
        </FormField>
        <FormField id="reg-last" label="Last name" error={errors.last_name?.message}>
          <input id="reg-last" className="input-field" placeholder="Doe" {...register('last_name')} />
        </FormField>
      </div>

      <FormField id="reg-user" label="Username" icon={User} error={errors.username?.message}>
        <input id="reg-user" autoComplete="username" className="input-field input-with-icon" placeholder="johndoe" {...register('username')} />
      </FormField>

      <FormField id="reg-email" label="Email" icon={Mail} error={errors.email?.message}>
        <input id="reg-email" type="email" autoComplete="email" className="input-field input-with-icon" placeholder="john@example.com" {...register('email')} />
      </FormField>

      <FormField id="reg-phone" label="Phone" icon={Phone} error={errors.phone_number?.message}>
        <input id="reg-phone" autoComplete="tel" className="input-field input-with-icon" placeholder="+7 (777) 000-0000" {...register('phone_number')} />
      </FormField>

      <FormField id="reg-pass" label="Password" icon={Lock} error={errors.password?.message}>
        <input id="reg-pass" type="password" autoComplete="new-password" className="input-field input-with-icon" placeholder="Min. 8 characters" {...register('password')} />
      </FormField>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary mt-2 w-full !py-3"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Creating account…
          </span>
        ) : (
          'Create account'
        )}
      </button>
    </form>
  )
}
