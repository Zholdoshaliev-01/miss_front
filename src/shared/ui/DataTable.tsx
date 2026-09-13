import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export interface DataTableColumn<T> {
  id: string
  header: ReactNode
  cell: (row: T, index: number) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T, index: number) => string
  emptySlot?: ReactNode
  className?: string
}

export function DataTable<T>({ columns, data, getRowKey, emptySlot, className }: DataTableProps<T>) {
  if (data.length === 0 && emptySlot) {
    return <div className="glass-card p-8">{emptySlot}</div>
  }

  return (
    <div className={cn('hidden overflow-x-auto rounded-2xl md:block', className)} style={{ border: '1px solid var(--border-color)', background: 'var(--color-surface)' }}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  'px-5 py-3.5 text-xs font-semibold uppercase tracking-wider',
                  col.className,
                )}
                style={{ color: 'var(--color-text-faint)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              className={cn(
                'motion-table-row transition-colors duration-150',
                'hover:bg-accent/[0.03]',
              )}
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              {columns.map((col) => (
                <td key={col.id} className={cn('px-5 py-3.5', col.className)} style={{ color: 'var(--color-text-secondary)' }}>
                  {col.cell(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
