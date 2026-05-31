import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl" style={{ color: 'var(--color-text)' }}>
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
        ) : null}
        {/* Gradient underline */}
        <div className="mt-4 h-px w-20 bg-gradient-to-r from-accent/50 to-transparent" />
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
