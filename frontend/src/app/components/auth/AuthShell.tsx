import type { ReactNode } from 'react'
import { BrandLogo } from '../brand/BrandLogo'
import { cn } from '../ui/utils'
import '../../pages/auth/login-page.css'

type AuthShellProps = {
  children: ReactNode
  /** Wider max-width for role selection (step 1). */
  wide?: boolean
  topRight?: ReactNode
  className?: string
}

export function AuthShell({ children, wide = false, topRight, className }: AuthShellProps) {
  return (
    <main
      className={cn(
        'login-page auth-shell relative flex min-h-screen flex-col overflow-hidden bg-gradient-soft',
        className
      )}
    >
      <div aria-hidden className="auth-shell-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full bg-primary-glow/15 blur-3xl"
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <BrandLogo to="/" size="md" />
        {topRight ? <div className="text-right text-sm">{topRight}</div> : null}
      </header>

      <div
        className={cn(
          'relative z-10 mx-auto w-full flex-1 px-5 pb-8 sm:px-8 lg:px-12',
          wide ? 'max-w-[1180px]' : 'max-w-lg'
        )}
      >
        {children}
      </div>

      <footer className="relative z-10 shrink-0 px-5 pb-6 text-center text-xs text-muted-foreground sm:px-8">
        © 2026 SkillSwap · AI-powered university collaboration platform
      </footer>
    </main>
  )
}
