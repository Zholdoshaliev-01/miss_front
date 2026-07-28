import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset } from '../api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: (email: string) => requestPasswordReset({ email }),
    onSuccess: () => {
      setIsSubmitted(true)
    },
    onError: () => {
      // For security, even if the email doesn't exist, we might want to show success,
      // but let's show an error if the backend throws one.
      toast.error('Failed to request password reset. Please try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    mutation.mutate(email)
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center lg:text-left">
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      {isSubmitted ? (
        <div className="glass-card flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
            <CheckCircle2 className="h-8 w-8 text-accent-light" />
          </div>
          <h3 className="mb-2 font-heading text-xl font-semibold text-white">Check your email</h3>
          <p className="mb-6 text-sm text-white/50">
            We've sent a password reset link to <br />
            <span className="font-medium text-white">{email}</span>
          </p>
          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="text-sm font-medium text-accent-light transition hover:text-accent hover:underline decoration-accent/30 underline-offset-2"
          >
            Didn't receive the email? Click to try again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card space-y-5 p-8">
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-white/65">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                className="input-field input-with-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !email}
            className="btn-primary mt-2 w-full !py-3 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Sending link…
              </span>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      )}
    </div>
  )
}
