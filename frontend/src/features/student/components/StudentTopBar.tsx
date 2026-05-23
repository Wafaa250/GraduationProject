import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, User } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useMe } from '@/app/providers/MeProvider'
import { Button } from '@/shared/components/ui/Button'
import { ROUTES } from '@/shared/constants/routes'
import { appTopBarClass } from '@/shared/styles/appShell'
import { useUnreadNotifications } from '../hooks/useUnreadNotifications'
import { UserAvatar } from './UserAvatar'

interface StudentTopBarProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
}

export function StudentTopBar({ title, subtitle, onMenuClick }: StudentTopBarProps) {
  const { logout } = useAuth()
  const { me } = useMe()
  const { count: unreadCount } = useUnreadNotifications()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function handleSignOut() {
    logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <header className={appTopBarClass}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : 'Notifications'
          }
          disabled
          title="Notification center coming soon"
        >
          <Bell className="size-[18px]" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {me ? (
              <UserAvatar
                name={me.name}
                imageSrc={me.profilePictureBase64}
                size="sm"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                <User className="size-4 text-muted-foreground" />
              </span>
            )}
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:inline">
              {me?.name ?? 'Account'}
            </span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card py-1 shadow-lg"
            >
              {me ? (
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-medium text-foreground">{me.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{me.email}</p>
                </div>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                onClick={handleSignOut}
              >
                <LogOut className="size-4 text-muted-foreground" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
