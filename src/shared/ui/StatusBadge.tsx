import { cn } from '@/shared/utils/cn'

export type StatusBadgeVariant = 'active' | 'pending' | 'expelled' | 'neutral' | 'rejected'

const variantStyles: Record<StatusBadgeVariant, { bg: string; text: string; dot: string }> = {
  active: {
    bg: 'bg-status-active/10 ring-status-active/20',
    text: 'text-status-active',
    dot: 'bg-status-active shadow-[0_0_6px_rgba(34,197,94,0.5)]',
  },
  pending: {
    bg: 'bg-status-pending/10 ring-status-pending/20',
    text: 'text-status-pending',
    dot: 'bg-status-pending shadow-[0_0_6px_rgba(245,158,11,0.5)]',
  },
  expelled: {
    bg: 'bg-status-expelled/10 ring-status-expelled/20',
    text: 'text-status-expelled',
    dot: 'bg-status-expelled shadow-[0_0_6px_rgba(239,68,68,0.5)]',
  },
  rejected: {
    bg: 'bg-status-expelled/10 ring-status-expelled/20',
    text: 'text-status-expelled',
    dot: 'bg-status-expelled shadow-[0_0_6px_rgba(239,68,68,0.5)]',
  },
  neutral: {
    bg: 'bg-white/[0.06] ring-white/10',
    text: 'text-white/70',
    dot: 'bg-white/40',
  },
}

interface StatusBadgeProps {
  label: string
  variant?: StatusBadgeVariant
  className?: string
}

export function StatusBadge({ label, variant = 'neutral', className }: StatusBadgeProps) {
  const styles = variantStyles[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        styles.bg,
        styles.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
      {label}
    </span>
  )
}
