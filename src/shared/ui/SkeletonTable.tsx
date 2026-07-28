import { cn } from '@/shared/utils/cn'

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function SkeletonTable({ rows = 6, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn('glass-card space-y-3 p-5', className)}>
      {/* Header shimmer */}
      <div className="flex gap-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="relative h-8 flex-1 overflow-hidden rounded-lg bg-white/[0.06]"
          >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
          </div>
        ))}
      </div>
      {/* Row shimmers */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={`r-${ri}`} className="flex gap-3" style={{ opacity: 1 - ri * 0.1 }}>
          {Array.from({ length: columns }).map((_, ci) => (
            <div
              key={`c-${ci}`}
              className="relative h-10 flex-1 overflow-hidden rounded-lg bg-white/[0.03]"
            >
              <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
                style={{ animationDelay: `${ri * 0.15}s` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
