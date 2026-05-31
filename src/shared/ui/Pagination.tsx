import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  const canPrev = page > 1
  const canNext = page < pageCount

  if (pageCount <= 1) return null

  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => canPrev && onPageChange(page - 1)}
        className="btn-ghost rounded-lg !px-3 !py-1.5 text-sm disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      {/* Page indicator */}
      <div className="flex items-center gap-1 px-2">
        {Array.from({ length: Math.min(pageCount, 5) }).map((_, i) => {
          const pageNum = i + 1
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition',
                page === pageNum
                  ? 'bg-accent/15 text-accent-light shadow-sm'
                  : 'hover:bg-[var(--color-surface-hover)]',
              )}
              style={page !== pageNum ? { color: 'var(--color-text-faint)' } : undefined}
            >
              {pageNum}
            </button>
          )
        })}
        {pageCount > 5 && (
          <span className="px-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>…</span>
        )}
      </div>

      <button
        type="button"
        disabled={!canNext}
        onClick={() => canNext && onPageChange(page + 1)}
        className="btn-ghost rounded-lg !px-3 !py-1.5 text-sm disabled:opacity-30"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
