import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type AuthAlertVariant = 'error' | 'success' | 'info'

const styles: Record<AuthAlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-primary/20 bg-accent text-accent-foreground',
}

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
}

export function AuthAlert({
  variant,
  children,
  className,
}: {
  variant: AuthAlertVariant
  children: React.ReactNode
  className?: string
}) {
  const Icon = icons[variant]
  return (
    <div
      className={cn(
        'flex gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed',
        styles[variant],
        className,
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
