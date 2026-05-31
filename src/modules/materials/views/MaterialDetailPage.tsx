import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Download, Calendar, FileType, Eye } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function MaterialDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link to="/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <PageHeader
          title="Introduction to Algorithms"
          description="Computer Science 101 · Uploaded March 1, 2026"
          actions={
            <button type="button" className="btn-primary text-sm">
              <Download className="h-4 w-4" />
              Download
            </button>
          }
        />
      </div>

      {/* Material card */}
      <div className="glass-card overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg shrink-0" style={{ boxShadow: '0 8px 24px rgba(16,185,129,0.15)' }}>
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-bold text-white">Introduction to Algorithms</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                This material covers the fundamentals of algorithm design and analysis. Topics include: asymptotic notation, divide and conquer strategies, greedy algorithms, and dynamic programming basics. Read chapters 1-3 before the next lecture.
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-white/[0.06] pt-5">
            <div className="flex items-center gap-2 text-sm text-white/35">
              <Calendar className="h-4 w-4" />
              <span>March 1, 2026</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/35">
              <FileType className="h-4 w-4" />
              <span>PDF · 2.4 MB</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/35">
              <Eye className="h-4 w-4" />
              <span>Viewed by 18 students</span>
            </div>
          </div>
        </div>
      </div>

      {/* File preview placeholder */}
      <div className="glass-card p-6">
        <h3 className="mb-4 font-heading text-sm font-semibold text-white/60">File Preview</h3>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
            <FileType className="h-8 w-8 text-white/15" />
          </div>
          <p className="mt-4 text-sm font-medium text-white/40">PDF Preview</p>
          <p className="mt-1 text-xs text-white/25">File preview will render here</p>
          <button type="button" className="btn-secondary mt-5 text-sm">
            <Download className="h-4 w-4" />
            Download to View
          </button>
        </div>
      </div>

      {/* Related materials */}
      <div className="glass-card p-6">
        <h3 className="mb-4 font-heading text-sm font-semibold text-white/60">Other Materials in This Group</h3>
        <div className="space-y-2">
          {[
            { id: 2, title: 'Data Structures Overview', date: 'Mar 5, 2026' },
            { id: 3, title: 'Sorting Algorithms', date: 'Mar 10, 2026' },
          ].map((m) => (
            <Link
              key={m.id}
              to={`/materials/${m.id}`}
              className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.03]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/[0.08]">
                <BookOpen className="h-4 w-4 text-emerald-400/60" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/65">{m.title}</p>
                <p className="text-xs text-white/25">{m.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
