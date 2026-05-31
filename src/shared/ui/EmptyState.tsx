import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'glass-card relative flex flex-col items-center justify-center gap-4 overflow-hidden py-16 text-center',
        className,
      )}
    >
      {/* Decorative background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.04] blur-[60px]" />
      </div>

      {icon ? (
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--input-bg)', color: 'var(--color-text-faint)' }}>
          {icon}
        </div>
      ) : null}
      <div className="relative">
        <p className="font-heading text-base font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
        {description ? (
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--color-text-faint)' }}>{description}</p>
        ) : null}
      </div>
      {action ? <div className="relative mt-2">{action}</div> : null}
    </div>
  )
}
