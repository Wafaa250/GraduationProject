import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MeProvider, useMe } from '@/app/providers/MeProvider'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { appShellCanvasClass, appShellMainClass } from '@/shared/styles/appShell'
import { StudentSidebar } from '../components/StudentSidebar'
import { StudentTopBar } from '../components/StudentTopBar'

function LayoutInner() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { error: meError, refresh: refreshMe } = useMe()

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden lg:flex lg:shrink-0">
        <StudentSidebar />
      </div>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 shadow-xl lg:hidden">
            <StudentSidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <StudentTopBar
          title="Home"
          subtitle="Your academic workspace"
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className={appShellMainClass}>
          <div className={cn('mesh-gradient min-h-full')}>
            <div className={appShellCanvasClass}>
              {meError ? (
                <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-foreground">{meError}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void refreshMe()}>
                    Retry profile
                  </Button>
                </div>
              ) : null}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function StudentAppLayout() {
  return (
    <MeProvider>
      <LayoutInner />
    </MeProvider>
  )
}
