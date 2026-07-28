import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,500px)] -translate-x-1/2 -translate-y-1/2',
            'glass-card p-6 shadow-2xl shadow-black/40 animate-slide-up max-h-[85vh] overflow-y-auto',
          )}
        >
          <div className="flex items-start justify-between">
            <Dialog.Title className="font-heading text-lg font-bold text-white/90">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/[0.08] text-white/40 hover:text-white/80"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className="mt-2 text-sm text-white/50">
              {description}
            </Dialog.Description>
          ) : null}
          <div className="mt-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
