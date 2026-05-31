import { Clock, Loader2 } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="glass-card p-10 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-400/10 shadow-lg" style={{ boxShadow: '0 8px 24px rgba(245,158,11,0.1)' }}>
        <Clock className="h-8 w-8 text-amber-400" />
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-white">Pending Approval</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
        Your request to join the group has been submitted. You'll receive access once your teacher approves your enrollment.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-amber-400/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        Waiting for approval…
      </div>
    </div>
  )
}
