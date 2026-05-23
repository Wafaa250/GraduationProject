import type { ReactNode } from 'react'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/components/ui/utils'

export function AlertError({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-red-50 p-4">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div>
        <div className="text-sm font-semibold text-destructive">{title}</div>
        {children ? <div className="text-xs text-destructive/90 mt-0.5">{children}</div> : null}
      </div>
    </div>
  )
}

export function AlertSuccess({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
      <div>
        <div className="text-sm font-semibold text-success">{title}</div>
        {children ? <div className="text-xs text-foreground/80 mt-0.5">{children}</div> : null}
      </div>
    </div>
  )
}

export function PrimaryButton({
  loading,
  className,
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-card transition',
        'hover:opacity-95 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
}

export function GhostButton({ className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted/50 transition',
        className
      )}
    />
  )
}
