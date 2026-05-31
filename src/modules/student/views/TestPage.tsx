import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, HelpCircle, ClipboardCheck } from 'lucide-react'

export default function TestPage() {
  const { id } = useParams()

  return (
    <div className="relative min-h-dvh bg-navy noise-overlay">
      <div className="mesh-gradient" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <Link to="/student/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Test Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg" style={{ boxShadow: '0 8px 24px rgba(139,92,246,0.15)' }}>
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
                Test #{id}
              </h1>
              <p className="mt-1 text-sm text-white/40">Answer all questions and submit when ready.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-white/35">
              <HelpCircle className="h-4 w-4" />
              <span>Questions: —</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/35">
              <Clock className="h-4 w-4" />
              <span>No time limit</span>
            </div>
          </div>
        </div>

        {/* Questions placeholder */}
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <HelpCircle className="h-10 w-10 text-white/15" />
          <p className="mt-4 font-heading text-sm font-medium text-white/50">Test questions will appear here</p>
          <p className="mt-1 text-sm text-white/30">The test content is loading…</p>
        </div>
      </div>
    </div>
  )
}
