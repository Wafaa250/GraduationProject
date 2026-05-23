import { NavLink } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Search,
  Users,
} from 'lucide-react'
import { AppLogo } from '@/shared/components/brand/AppLogo'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/cn'
import { navItemActiveClass, navItemInactiveClass, sidebarWidthClass } from '@/shared/styles/appShell'
import { useMe } from '@/app/providers/MeProvider'
import { UserAvatar } from './UserAvatar'

interface NavItem {
  label: string
  to?: string
  icon: typeof LayoutDashboard
  disabled?: boolean
}

const primaryNav: NavItem[] = [
  { label: 'Home', to: ROUTES.app, icon: LayoutDashboard },
]

const upcomingNav: NavItem[] = [
  { label: 'Graduation project', icon: GraduationCap, disabled: true },
  { label: 'Discover students', icon: Search, disabled: true },
  { label: 'Courses', icon: BookOpen, disabled: true },
  { label: 'Communities', icon: Users, disabled: true },
  { label: 'Messages', icon: MessageSquare, disabled: true },
  { label: 'Notifications', icon: Bell, disabled: true },
]

function NavItemRow({ item }: { item: NavItem }) {
  const Icon = item.icon
  const base =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors'

  if (item.disabled || !item.to) {
    return (
      <span
        className={cn(base, 'cursor-not-allowed text-muted-foreground/60')}
        aria-disabled="true"
        title="Coming soon"
      >
        <Icon className="size-4 shrink-0 opacity-50" strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      </span>
    )
  }

  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        cn(base, isActive ? navItemActiveClass : navItemInactiveClass)
      }
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {item.label}
    </NavLink>
  )
}

interface StudentSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function StudentSidebar({ className, onNavigate }: StudentSidebarProps) {
  const { me } = useMe()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-card',
        sidebarWidthClass,
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border px-5 sm:h-16">
        <div onClick={onNavigate} className="min-w-0">
          <AppLogo href={ROUTES.app} showWordmark className="min-w-0" />
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main">
        <div className="space-y-0.5">
          {primaryNav.map((item) => (
            <div key={item.label} onClick={onNavigate}>
              <NavItemRow item={item} />
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Workspace
          </p>
          <div className="space-y-0.5">
            {upcomingNav.map((item) => (
              <div key={item.label}>
                <NavItemRow item={item} />
              </div>
            ))}
          </div>
        </div>
      </nav>

      {me && (
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <UserAvatar
              name={me.name}
              imageSrc={me.profilePictureBase64}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{me.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {me.major || 'Student'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
