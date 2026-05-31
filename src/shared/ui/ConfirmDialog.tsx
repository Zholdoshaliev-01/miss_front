import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  children?: ReactNode
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  children,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,440px)] -translate-x-1/2 -translate-y-1/2',
            'glass-card p-6 shadow-2xl shadow-black/40 animate-slide-up',
          )}
        >
          <div className="flex items-start justify-between">
            <Dialog.Title className="font-heading text-lg font-bold" style={{ color: 'var(--color-text)' }}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-hover)]"
                style={{ color: 'var(--color-text-faint)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {description}
            </Dialog.Description>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button type="button" className="btn-secondary text-sm">
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              className={cn(
                'text-sm',
                variant === 'danger' ? 'btn-danger' : 'btn-primary',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
