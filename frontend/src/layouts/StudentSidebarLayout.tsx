import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  Compass,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMe, type StudentMeResponse } from "@/api/meApi";
import { useNotificationsInbox } from "@/hooks/useNotificationsInbox";
import {
  NotificationBellButton,
  NotificationCenterDropdown,
} from "@/components/notifications/NotificationCenter";
import { getStudentNotificationTarget } from "@/lib/studentNotificationNavigation";
import type { GraduationNotification } from "@/api/notificationsApi";
import { ROUTES } from "@/routes/paths";
import { logout } from "@/utils/authSession";
import { cn } from "@/components/ui/utils";
import "@/styles/student-sidebar-layout.css";

type NavItemDef = {
  key: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  disabled?: boolean;
  matchPaths?: string[];
  showNotificationBadge?: boolean;
};

const WORKSPACE_NAV: NavItemDef[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    to: ROUTES.dashboard,
    matchPaths: [ROUTES.dashboard],
  },
  {
    key: "graduation-project",
    label: "My Graduation Project",
    icon: GraduationCap,
    to: ROUTES.graduationProjectWorkspace,
    matchPaths: [
      ROUTES.graduationProjectWorkspace,
      ROUTES.createGraduationProject,
    ],
  },
  {
    key: "browse",
    label: "Browse Projects",
    icon: Compass,
    to: ROUTES.browseProjects,
    matchPaths: [ROUTES.browseProjects],
  },
  {
    key: "courses",
    label: "My Courses",
    icon: BookOpen,
    to: ROUTES.studentCourses,
    matchPaths: [ROUTES.studentCourses, "/courses"],
  },
  {
    key: "messages",
    label: "Messages",
    icon: MessageCircle,
    to: ROUTES.studentMessages,
    matchPaths: [ROUTES.studentMessages, "/messages"],
  },
];

const ACCOUNT_NAV: NavItemDef[] = [
  {
    key: "profile",
    label: "Profile",
    icon: User,
    to: ROUTES.profile,
    matchPaths: [ROUTES.profile, ROUTES.editProfile],
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    to: ROUTES.settings,
    matchPaths: [ROUTES.settings],
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isItemActive(pathname: string, item: NavItemDef): boolean {
  if (!item.matchPaths?.length) {
    return item.to ? pathname === item.to : false;
  }
  return item.matchPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function NavItemButton({
  item,
  active,
  collapsed,
  notificationCount,
  onNavigate,
}: {
  item: NavItemDef;
  active: boolean;
  collapsed: boolean;
  notificationCount: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const badge =
    item.showNotificationBadge && notificationCount > 0 ? notificationCount : null;

  const className = cn(
    "student-sidebar-layout__nav-item",
    active && "is-active",
  );

  const content = (
    <>
      <Icon className="student-sidebar-layout__nav-icon" aria-hidden />
      <span className="student-sidebar-layout__nav-label">{item.label}</span>
      {badge != null && (
        <span className="student-sidebar-layout__nav-badge" aria-label={`${badge} unread`}>
          {collapsed ? "" : badge > 9 ? "9+" : badge}
        </span>
      )}
    </>
  );

  if (item.disabled || !item.to) {
    return (
      <button type="button" className={className} disabled title={item.label}>
        {content}
      </button>
    );
  }

  return (
    <Link to={item.to} className={className} onClick={onNavigate} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  );
}

export function StudentSidebarLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [me, setMe] = useState<StudentMeResponse | null>(null);
  const inbox = useNotificationsInbox({ role: "student", showToasts: true, markAllReadOnOpen: true });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = (localStorage.getItem("role") ?? "").toLowerCase();

  const loadSidebarData = useCallback(async () => {
    try {
      const profile = await getMe();
      setMe(profile);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    void loadSidebarData();
    void inbox.refresh();
  }, [loadSidebarData, pathname, inbox.refresh]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!inbox.open && !profileMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inbox.open && notificationsRef.current && !notificationsRef.current.contains(target)) {
        inbox.setOpen(false);
      }
      if (
        profileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        inbox.setOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [inbox.open, inbox.setOpen, profileMenuOpen]);

  const displayName = me?.name?.trim() || localStorage.getItem("name") || "Student";

  const profilePhoto = useMemo(() => {
    const raw = me?.profilePictureBase64?.trim();
    if (!raw) return null;
    if (raw.startsWith("data:")) return raw;
    return `data:image/jpeg;base64,${raw}`;
  }, [me?.profilePictureBase64]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setMobileOpen(false);
    logout(navigate);
  };

  const onStudentNotificationClick = (n: GraduationNotification) => {
    const target = getStudentNotificationTarget(n);
    void inbox.handleNotificationClick(n, () => {
      if (target) navigate(target);
    });
  };

  const topActions = (
    <div className="student-sidebar-layout__top-actions">
      <div ref={notificationsRef} className="relative">
        <NotificationBellButton
          unreadCount={inbox.unreadCount}
          open={inbox.open}
          onToggle={() => {
            inbox.toggleOpen();
            setProfileMenuOpen(false);
          }}
          variant="student"
        />
        <NotificationCenterDropdown
          open={inbox.open}
          unreadCount={inbox.unreadCount}
          notifications={inbox.notifications}
          loading={inbox.loading}
          markingAllRead={inbox.markingAllRead}
          onMarkAllRead={() => void inbox.handleMarkAllRead()}
          onNotificationClick={onStudentNotificationClick}
          getTargetLabel={(n) => (getStudentNotificationTarget(n) ? "View" : null)}
          variant="student"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-lg"
        asChild
      >
        <Link
          to={ROUTES.studentMessages}
          aria-label="Messages"
          onClick={() => {
            inbox.setOpen(false);
            setProfileMenuOpen(false);
          }}
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
      </Button>
      <div ref={profileMenuRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full p-0"
          aria-expanded={profileMenuOpen}
          aria-haspopup="menu"
          aria-label="Account menu"
          onClick={() => {
            setProfileMenuOpen((open) => !open);
            inbox.setOpen(false);
          }}
        >
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            {profilePhoto && <AvatarImage src={profilePhoto} alt="" />}
            <AvatarFallback className="bg-gradient-hero text-xs font-semibold text-primary-foreground">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
        {profileMenuOpen && (
          <Card
            className="absolute right-0 top-11 z-50 w-[min(100vw-2rem,12rem)] border-border/60 shadow-elevated"
            role="menu"
            aria-label="Account"
          >
            <CardContent className="p-1">
              <Link
                to={ROUTES.profile}
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
                onClick={() => setProfileMenuOpen(false)}
              >
                <User className="h-4 w-4 text-muted-foreground" aria-hidden />
                My Profile
              </Link>
              <Link
                to={ROUTES.settings}
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
                onClick={() => setProfileMenuOpen(false)}
              >
                <Settings className="h-4 w-4 text-muted-foreground" aria-hidden />
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Logout
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const layoutClass = cn(
    "student-sidebar-layout student-hub",
    collapsed && "student-sidebar-layout--collapsed",
    mobileOpen && "student-sidebar-layout--mobile-open",
  );

  if (role !== "student") {
    return <Navigate to={ROUTES.home} replace />;
  }

  return (
    <div className={layoutClass}>
      <div
        className={cn("student-sidebar-layout__overlay", mobileOpen && "is-open")}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />

      <div className="student-sidebar-layout__shell">
        <aside className="student-sidebar-layout__sidebar" aria-label="Student navigation">
          <div className="student-sidebar-layout__sidebar-inner">
            <div className="student-sidebar-layout__brand-row">
              <Link
                to={ROUTES.dashboard}
                className="student-sidebar-layout__brand-link"
                aria-label="SkillSwap dashboard"
              >
                <BrandLogo size="sm" variant={collapsed ? "mark" : "full"} />
                {!collapsed && (
                  <span className="student-sidebar-layout__brand-sub">Student</span>
                )}
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="student-sidebar-layout__collapse-btn hidden lg:inline-flex h-8 w-8 shrink-0"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setCollapsed((c) => !c)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 lg:hidden"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav
              className="student-sidebar-layout__nav-scroll"
              aria-label="Workspace navigation"
            >
              <p className="student-sidebar-layout__section-label">Workspace</p>
              <div className="student-sidebar-layout__nav-group">
                {WORKSPACE_NAV.map((item) => (
                  <NavItemButton
                    key={item.key}
                    item={item}
                    active={isItemActive(pathname, item)}
                    collapsed={collapsed}
                    notificationCount={inbox.unreadCount}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </nav>

            <div className="student-sidebar-layout__bottom">
              <div className="student-sidebar-layout__section-divider" aria-hidden />

              <nav
                className="student-sidebar-layout__account-nav"
                aria-label="Account navigation"
              >
                <p className="student-sidebar-layout__section-label">Account</p>
                <div className="student-sidebar-layout__nav-group">
                  {ACCOUNT_NAV.map((item) => (
                    <NavItemButton
                      key={item.key}
                      item={item}
                      active={isItemActive(pathname, item)}
                      collapsed={collapsed}
                      notificationCount={inbox.unreadCount}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </nav>

              <div className="student-sidebar-layout__section-divider" aria-hidden />

              <div className="student-sidebar-layout__user-area">
                <button
                  type="button"
                  className="student-sidebar-layout__logout-btn"
                  onClick={handleLogout}
                >
                  <LogOut className="student-sidebar-layout__nav-icon" aria-hidden />
                  <span className="student-sidebar-layout__nav-label">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="student-sidebar-layout__main">
          <div className="student-sidebar-layout__mobile-bar">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <BrandLogo
              size="sm"
              variant="full"
              to={ROUTES.dashboard}
              className="min-w-0 flex-1"
            />
            {topActions}
          </div>
          <div className="student-sidebar-layout__top-actions-bar hidden lg:flex">
            {topActions}
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
