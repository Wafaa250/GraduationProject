import { Link } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { AppLogo } from '@/shared/components/brand'
import { Button } from '@/shared/components/ui/Button'
import { ROUTES } from '@/shared/constants/routes'
import { surfaceCardClass } from '@/shared/styles/layout'
import { pageSubtitleClass, pageTitleClass, sectionTitleClass } from '@/shared/styles/typography'
import { cn } from '@/shared/lib/cn'

interface RoleHomePlaceholderProps {
  title: string
  description: string
}

export function RoleHomePlaceholder({ title, description }: RoleHomePlaceholderProps) {
  const { session, logout } = useAuth()

  return (
    <div className="flex min-h-[100svh] flex-col bg-background">
      <header className="flex justify-center px-4 pt-7 sm:pt-9">
        <AppLogo href={ROUTES.home} />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className={cn(surfaceCardClass, 'w-full max-w-md p-8 text-center')}>
          <p className={sectionTitleClass}>{title}</p>
          <h1 className={cn('mt-2', pageTitleClass)}>Welcome, {session?.name}</h1>
          <p className={pageSubtitleClass}>{description}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            {session?.email} · {session?.role}
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={logout}>
              Sign out
            </Button>
            <Button variant="secondary" className="flex-1" asChild>
              <Link to={ROUTES.home}>Back to home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
