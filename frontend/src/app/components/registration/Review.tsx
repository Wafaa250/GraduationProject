import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '../ui/utils'

export function ReviewItem({
  label,
  value,
  onEdit,
}: {
  label: string
  value?: ReactNode
  onEdit?: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0 border-border">
      <div className="text-xs uppercase tracking-wide text-muted-foreground w-36 sm:w-40 shrink-0">{label}</div>
      <div className="flex-1 text-sm text-foreground break-words">{value ?? <span className="text-muted-foreground">—</span>}</div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-primary hover:text-primary-deep font-medium inline-flex items-center gap-1 shrink-0"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      ) : null}
    </div>
  )
}

export function ReviewGroup({
  title,
  onEdit,
  children,
  className,
}: {
  title: string
  onEdit?: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card/50 p-4 sm:p-5 shadow-xs', className)}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-primary hover:text-primary-deep font-medium inline-flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" /> Edit section
          </button>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  )
}
