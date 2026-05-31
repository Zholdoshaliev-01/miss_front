import { useCallback, useId, useState } from 'react'
import { Upload, FileIcon, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface FileUploadZoneProps {
  accept?: string
  disabled?: boolean
  value: File | null
  onChange: (file: File | null) => void
  label?: string
  hint?: string
  className?: string
}

export function FileUploadZone({
  accept,
  disabled,
  value,
  onChange,
  label = 'Drop file here or browse',
  hint,
  className,
}: FileUploadZoneProps) {
  const inputId = useId()
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (list: FileList | null) => {
      const file = list?.[0] ?? null
      onChange(file)
    },
    [onChange],
  )

  return (
    <div className={cn('w-full', className)}>
      {value ? (
        /* Selected file display */
        <div className="glass-card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/[0.08]">
            <FileIcon className="h-5 w-5 text-accent-light" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{value.name}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{(value.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-faint)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <label
          htmlFor={inputId}
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (disabled) return
            handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            'glass-card flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-12 text-center transition-all duration-200',
            dragOver && 'border-accent/40 bg-accent/[0.04] shadow-[0_0_30px_rgba(99,102,241,0.08)]',
            disabled && 'cursor-not-allowed opacity-40',
          )}
        >
          <div className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
            dragOver ? 'bg-accent/15' : 'bg-[var(--input-bg)]',
          )}>
            <Upload className={cn(
              'h-7 w-7 transition-colors',
              dragOver ? 'text-accent-light' : '',
            )} style={!dragOver ? { color: 'var(--color-text-faint)' } : undefined} aria-hidden />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
          {hint ? <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{hint}</span> : null}
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
