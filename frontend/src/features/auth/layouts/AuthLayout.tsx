import { Link, Outlet, useLocation } from 'react-router-dom'
import { AppLogo } from '@/shared/components/brand'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/cn'

export function AuthLayout() {
  const { pathname } = useLocation()
  const isStudentRegistration = pathname === ROUTES.registerStudent

  return (
    <div className="relative flex min-h-[100svh] flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(245_72%_56%/_0.06),transparent)]" />
      </div>

      <header className="relative z-10 flex shrink-0 justify-center px-4 pt-7 sm:pt-9">
        <AppLogo href={ROUTES.home} />
      </header>

      <main className="relative z-10 flex flex-1 justify-center px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-7">
        <div
          className={cn(
            'w-full',
            isStudentRegistration
              ? 'max-w-6xl'
              : 'max-w-[440px] sm:max-w-[480px]',
          )}
        >
          <Outlet />
        </div>
      </main>

      <footer className="relative z-10 shrink-0 pb-6 text-center">
        <Link
          to={ROUTES.home}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>
      </footer>
    </div>
  )
}
