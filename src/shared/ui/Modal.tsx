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
        <Dialog.Overlay className="modal-overlay-motion fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px]" />
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 sm:p-6">
          <Dialog.Content
            className={cn(
              'pointer-events-auto relative w-full max-w-[560px]',
              'modal-content-motion glass-card max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 shadow-2xl shadow-black/40 sm:max-h-[calc(100dvh-3rem)] sm:p-6',
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
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
