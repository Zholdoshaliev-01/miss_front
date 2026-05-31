import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Upload, FileText } from 'lucide-react'

export default function HomeworkSubmitPage() {
  const { id } = useParams()

  return (
    <div className="relative min-h-dvh bg-navy noise-overlay">
      <div className="mesh-gradient" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <Link to="/student/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Homework Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg" style={{ boxShadow: '0 8px 24px rgba(245,158,11,0.15)' }}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
                Submit Homework #{id}
              </h1>
              <p className="mt-1 text-sm text-white/40">Upload your work and add any comments.</p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="glass-card p-6">
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] py-14 text-center transition hover:border-accent/30 hover:bg-accent/[0.02]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/[0.08]">
              <Upload className="h-7 w-7 text-accent-light" />
            </div>
            <p className="mt-4 text-sm font-medium text-white/60">Drop your file here or click to browse</p>
            <p className="mt-1 text-xs text-white/30">PDF, DOC, JPG up to 10MB</p>
          </div>

          <div className="mt-6">
            <label className="mb-1.5 block text-sm font-medium text-white/65">Comment (optional)</label>
            <textarea
              className="input-field min-h-[100px] resize-y"
              placeholder="Add any notes about your submission…"
            />
          </div>

          <button type="button" className="btn-primary mt-6 w-full !py-3">
            <Upload className="h-4 w-4" />
            Submit Homework
          </button>
        </div>
      </div>
    </div>
  )
}
