import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Lock, ArrowLeft } from 'lucide-react'
import { confirmPasswordReset } from '../api'

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>()
  const navigate = useNavigate()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      if (!uid || !token) throw new Error('Invalid reset link')
      return confirmPasswordReset({
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    },
    onSuccess: () => {
      toast.success('Password has been reset successfully.')
      navigate('/login', { replace: true })
    },
    onError: (err: any) => {
      const responseData = err.response?.data
      if (responseData && typeof responseData === 'object') {
        const firstErrorKey = Object.keys(responseData)[0]
        if (firstErrorKey) {
          const firstErrorMessages = responseData[firstErrorKey]
          if (Array.isArray(firstErrorMessages)) {
            toast.error(`${firstErrorKey}: ${firstErrorMessages[0]}`)
            return
          }
        }
      }
      toast.error(err.message || 'Failed to reset password. The link might be expired.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    mutation.mutate()
  }

  // If URL parameters are missing, show an error state immediately
  if (!uid || !token) {
    return (
      <div className="animate-fade-in text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white mb-4">
          Invalid Reset Link
        </h1>
        <p className="text-sm text-white/50 mb-8">
          This password reset link is missing required parameters. Please request a new link.
        </p>
        <Link 
          to="/forgot-password"
          className="btn-primary inline-flex px-6 py-2"
        >
          Request new link
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
          Create new password
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card space-y-5 p-8">
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-white/65">
            New password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="new-password"
              type="password"
              required
              className="input-field input-with-icon"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-white/65">
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="confirm-password"
              type="password"
              required
              className="input-field input-with-icon"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="mt-1.5 text-xs text-status-expelled">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !newPassword || !confirmPassword}
          className="btn-primary mt-2 w-full !py-3 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Resetting…
            </span>
          ) : (
            'Reset password'
          )}
        </button>
        
        <div className="mt-6 text-center">
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-white/40 transition hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </div>
      </form>
    </div>
  )
}
