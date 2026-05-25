import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  Compass,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMe, type StudentMeResponse } from "@/api/meApi";
import {
  getGraduationNotifications,
  getGraduationNotificationsUnreadCount,
  markGraduationNotificationRead,
  type GraduationNotification,
} from "@/api/notificationsApi";
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
  { key: "browse", label: "Browse Projects", icon: Compass, disabled: true },
  { key: "supervisors", label: "Supervisors", icon: Users, disabled: true },
  { key: "messages", label: "Messages", icon: MessageCircle, disabled: true },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    disabled: true,
    showNotificationBadge: true,
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
  { key: "settings", label: "Settings", icon: Settings, disabled: true },
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

function formatNotificationDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<GraduationNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = (localStorage.getItem("role") ?? "").toLowerCase();

  const loadSidebarData = useCallback(async () => {
    try {
      const [profile, unread, rows] = await Promise.all([
        getMe(),
        getGraduationNotificationsUnreadCount().catch(() => 0),
        getGraduationNotifications(30).catch(() => [] as GraduationNotification[]),
      ]);
      setMe(profile);
      setNotificationCount(unread);
      setNotifications(rows);
    } catch {
      setMe(null);
      setNotificationCount(0);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    void loadSidebarData();
  }, [loadSidebarData, pathname]);

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
    if (!notificationsOpen && !profileMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
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
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notificationsOpen, profileMenuOpen]);

  const displayName = me?.name?.trim() || localStorage.getItem("name") || "Student";
  const displayMajor = me?.major?.trim() || "—";
  const displayYear = me?.academicYear?.trim() || "";
  const displayUniversity = me?.university?.trim() || "";

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

  const topActions = (
    <div className="student-sidebar-layout__top-actions">
      <div ref={notificationsRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg"
          aria-expanded={notificationsOpen}
          aria-label="Notifications"
          onClick={() => {
            setNotificationsOpen((open) => !open);
            setProfileMenuOpen(false);
          }}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>
        {notificationsOpen && (
          <Card className="absolute right-0 top-11 z-50 w-[min(100vw-2rem,22rem)] border-border/60 shadow-elevated">
            <CardContent className="max-h-80 overflow-y-auto p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notifications
              </p>
              {notifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={`w-full rounded-lg border border-border/60 p-2.5 text-left text-sm transition hover:bg-secondary/50 ${n.readAt ? "opacity-70" : ""}`}
                        onClick={() => {
                          if (!n.readAt) {
                            void markGraduationNotificationRead(n.id).then(() => {
                              setNotifications((prev) =>
                                prev.map((row) =>
                                  row.id === n.id
                                    ? { ...row, readAt: new Date().toISOString() }
                                    : row,
                                ),
                              );
                              setNotificationCount((count) => Math.max(0, count - 1));
                            });
                          }
                        }}
                      >
                        <p className="font-medium text-foreground">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatNotificationDate(n.createdAt)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg"
        disabled
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
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
            setNotificationsOpen(false);
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
    "student-sidebar-layout",
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

            <div className="student-sidebar-layout__profile-card">
              <div className="student-sidebar-layout__profile-row">
                <div className="student-sidebar-layout__avatar" aria-hidden>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" />
                  ) : (
                    initials(displayName)
                  )}
                </div>
                <div className="student-sidebar-layout__profile-text min-w-0">
                  <p className="student-sidebar-layout__profile-name truncate">{displayName}</p>
                  <p className="student-sidebar-layout__profile-major truncate">{displayMajor}</p>
                </div>
              </div>
              {(displayYear || displayUniversity) && (
                <div className="student-sidebar-layout__profile-badges">
                  {displayYear && (
                    <span className="student-sidebar-layout__profile-badge">{displayYear}</span>
                  )}
                  {displayUniversity && (
                    <span className="student-sidebar-layout__profile-badge truncate max-w-full">
                      {displayUniversity}
                    </span>
                  )}
                </div>
              )}
            </div>

            <nav className="student-sidebar-layout__nav-scroll">
              <p className="student-sidebar-layout__section-label">Workspace</p>
              {WORKSPACE_NAV.map((item) => (
                <NavItemButton
                  key={item.key}
                  item={item}
                  active={isItemActive(pathname, item)}
                  collapsed={collapsed}
                  notificationCount={notificationCount}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}

              <p className="student-sidebar-layout__section-label mt-4">Account</p>
              {ACCOUNT_NAV.map((item) => (
                <NavItemButton
                  key={item.key}
                  item={item}
                  active={isItemActive(pathname, item)}
                  collapsed={collapsed}
                  notificationCount={notificationCount}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            <div className="student-sidebar-layout__footer">
              <button
                type="button"
                className="student-sidebar-layout__nav-item w-full text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="student-sidebar-layout__nav-icon" aria-hidden />
                <span className="student-sidebar-layout__nav-label">Logout</span>
              </button>
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
