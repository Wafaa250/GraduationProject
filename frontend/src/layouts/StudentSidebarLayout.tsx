import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  User,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardSummary, getStudentAiMatchStatus, type StudentAiMatchStatus } from "@/api/dashboardApi";
import { getFollowing } from "@/api/followingApi";
import { getEnrolledCourses } from "@/api/studentCoursesApi";
import { getMe, type StudentMeResponse } from "@/api/meApi";
import { useNotificationsInbox } from "@/hooks/useNotificationsInbox";
import {
  NotificationBellButton,
  NotificationCenterDropdown,
} from "@/components/notifications/NotificationCenter";
import { StudentAiMatchStatusCard } from "@/components/student/sidebar/StudentAiMatchStatusCard";
import {
  StudentSidebarProfileCard,
  type StudentSidebarStats,
} from "@/components/student/sidebar/StudentSidebarProfileCard";
import { getStudentNotificationTarget } from "@/lib/studentNotificationNavigation";
import {
  getStudentProfilePhotoUrl,
  mergeStudentSkillLabels,
} from "@/lib/studentSidebarProfile";
import type { GraduationNotification } from "@/api/notificationsApi";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { ROUTES } from "@/routes/paths";
import { isCompanyWorkspaceAccountRole } from "@/lib/companyAccountRole";
import { getRoleDashboardPath } from "@/utils/homeNavigation";
import { logout } from "@/utils/authSession";
import { PROFILE_AVATAR_FALLBACK_CLASS, profileInitialsFromName } from "@/lib/profileAvatar";
import { isStudentProfileRoute } from "@/lib/studentNav";
import { cn } from "@/components/ui/utils";
import "@/styles/student-sidebar-layout.css";

const SIDEBAR_LG_MEDIA = "(min-width: 1024px)";

function useIsSidebarLgUp(): boolean {
  const [isLgUp, setIsLgUp] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(SIDEBAR_LG_MEDIA).matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(SIDEBAR_LG_MEDIA);
    const onChange = () => setIsLgUp(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isLgUp;
}

type NavItemDef = {
  key: string;
  label: string;
  icon: LucideIcon;
  to: string;
  matchPaths: string[];
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
    key: "profile",
    label: "My Profile",
    icon: User,
    to: ROUTES.profile,
    matchPaths: [ROUTES.profile, "/student/profile"],
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
  {
    key: "following",
    label: "Following",
    icon: UserCheck,
    to: ROUTES.following,
    matchPaths: [ROUTES.following],
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    to: ROUTES.settings,
    matchPaths: [ROUTES.settings],
  },
];

function isItemActive(pathname: string, item: NavItemDef): boolean {
  return item.matchPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function NavItemButton({
  item,
  active,
  collapsed,
  badge,
  onNavigate,
}: {
  item: NavItemDef;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const className = cn("student-sidebar-layout__nav-item", active && "is-active");
  const showBadge = (badge ?? 0) > 0;

  return (
    <Link
      to={item.to}
      className={className}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="student-sidebar-layout__nav-icon" aria-hidden />
      <span className="student-sidebar-layout__nav-label">{item.label}</span>
      {showBadge ? (
        <span className="student-sidebar-layout__nav-badge" aria-label={`${badge} unread`}>
          {badge! > 99 ? "99+" : badge}
        </span>
      ) : null}
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
  const isSidebarLgUp = useIsSidebarLgUp();
  const iconOnlySidebar = collapsed && isSidebarLgUp;
  const [sidebarStats, setSidebarStats] = useState<StudentSidebarStats>({
    connections: 0,
    projects: 0,
    courses: 0,
  });
  const [matchStatus, setMatchStatus] = useState<StudentAiMatchStatus | null>(null);
  const [matchStatusLoading, setMatchStatusLoading] = useState(true);
  const [followingCompanyCount, setFollowingCompanyCount] = useState(0);
  const [followingAssociationCount, setFollowingAssociationCount] = useState(0);
  const role = (localStorage.getItem("role") ?? "").toLowerCase();

  const isCommunicationHub =
    pathname === ROUTES.communicationHub ||
    pathname.startsWith(`${ROUTES.communicationHub}/`);

  const loadSidebarData = useCallback(async () => {
    setMatchStatusLoading(true);
    try {
      const [profile, courses, dashboard, aiMatch, following] = await Promise.all([
        getMe(),
        getEnrolledCourses().catch(() => []),
        getDashboardSummary().catch(() => null),
        getStudentAiMatchStatus().catch(() => null),
        getFollowing().catch(() => ({ companies: [], associations: [] })),
      ]);
      setMe(profile);
      setMatchStatus(aiMatch);
      setFollowingCompanyCount(following.companies.length);
      setFollowingAssociationCount(following.associations.length);
      const projectCount =
        (dashboard?.myProject ? 1 : 0) + (dashboard?.matchedGraduationProjectsCount ?? 0);
      setSidebarStats({
        courses: courses.length,
        projects: projectCount,
        connections: dashboard?.suggestedTeammatesCount ?? 0,
      });
    } catch {
      setMe(null);
      setMatchStatus(null);
      setFollowingCompanyCount(0);
      setFollowingAssociationCount(0);
      setSidebarStats({ connections: 0, projects: 0, courses: 0 });
    } finally {
      setMatchStatusLoading(false);
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

  const profilePhoto = useMemo(
    () => getStudentProfilePhotoUrl(me?.profilePictureBase64),
    [me?.profilePictureBase64],
  );

  const skills = useMemo(
    () =>
      mergeStudentSkillLabels(
        me?.roles,
        me?.technicalSkills,
        me?.tools,
        me?.generalSkills,
        me?.majorSkills,
      ),
    [me],
  );

  const sidebarProfile = useMemo(
    () => ({
      name: displayName,
      email: me?.email,
      major: me?.major,
      academicYear: me?.academicYear,
      university: me?.university,
      faculty: me?.faculty,
      bio: me?.bio,
      github: me?.github,
      linkedin: me?.linkedin,
      portfolio: me?.portfolio,
      photoUrl: profilePhoto,
    }),
    [displayName, me, profilePhoto],
  );

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

  const closeMobile = () => setMobileOpen(false);

  const headerSearch = isCommunicationHub ? <GlobalSearchBar variant="header" /> : null;

  const topActionsInner = (
    <div className="student-sidebar-layout__top-actions">
      <div className="student-sidebar-layout__top-actions-group">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "student-sidebar-layout__top-action-btn",
            pathname === ROUTES.communicationHub && "is-active",
          )}
          asChild
        >
          <Link
            to={ROUTES.communicationHub}
            aria-label="Home"
            title="Home"
            onClick={() => {
              inbox.setOpen(false);
              setProfileMenuOpen(false);
            }}
          >
            <Home className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "student-sidebar-layout__top-action-btn",
            pathname === ROUTES.studentMessages && "is-active",
          )}
          asChild
        >
          <Link
            to={ROUTES.studentMessages}
            aria-label="Messages"
            title="Messages"
            onClick={() => {
              inbox.setOpen(false);
              setProfileMenuOpen(false);
            }}
          >
            <MessageCircle className="h-4 w-4" />
          </Link>
        </Button>

        <div ref={notificationsRef} className="relative">
          <NotificationBellButton
            unreadCount={inbox.unreadCount}
            open={inbox.open}
            onToggle={() => {
              inbox.toggleOpen();
              setProfileMenuOpen(false);
            }}
            variant="student"
            className="student-sidebar-layout__top-action-btn"
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
      </div>

      <span className="student-sidebar-layout__top-actions-divider" aria-hidden />

      <div ref={profileMenuRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="student-sidebar-layout__top-profile-btn"
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
            <AvatarFallback className={cn(PROFILE_AVATAR_FALLBACK_CLASS, "text-xs")}>
              {profileInitialsFromName(displayName)}
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
              <div className="my-1 h-px w-full bg-border/60" aria-hidden />
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

  const topBar = (
    <div
      className={cn(
        "student-sidebar-layout__top-bar",
        isCommunicationHub && "student-sidebar-layout__top-bar--hub",
      )}
    >
      {headerSearch}
      {topActionsInner}
    </div>
  );

  const layoutClass = cn(
    "student-sidebar-layout student-hub",
    collapsed && "student-sidebar-layout--collapsed",
    mobileOpen && "student-sidebar-layout--mobile-open",
    isCommunicationHub && "student-sidebar-layout--communication-hub",
  );

  if (isCompanyWorkspaceAccountRole(role)) {
    return <Navigate to={getRoleDashboardPath()} replace />;
  }

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

            <div className="student-sidebar-layout__body">
              {!iconOnlySidebar ? (
                <div
                  className="student-sidebar-layout__profile-stack"
                  aria-label="Student profile"
                >
                  <StudentSidebarProfileCard
                    profile={sidebarProfile}
                    skills={skills}
                    stats={sidebarStats}
                    onNavigate={closeMobile}
                  />
                </div>
              ) : null}

              <nav
                className="student-sidebar-layout__nav-panel"
                aria-label="Workspace navigation"
              >
                <div className="student-sidebar-layout__nav-group">
                  {WORKSPACE_NAV.map((item) => (
                    <NavItemButton
                      key={item.key}
                      item={item}
                      active={
                        item.key === "profile"
                          ? isStudentProfileRoute(pathname)
                          : isItemActive(pathname, item)
                      }
                      collapsed={collapsed}
                      badge={item.key === "messages" ? inbox.unreadCount : undefined}
                      onNavigate={closeMobile}
                    />
                  ))}
                </div>
              </nav>

              {!iconOnlySidebar ? (
                <StudentAiMatchStatusCard
                  status={matchStatus}
                  loading={matchStatusLoading}
                  followingCompanyCount={followingCompanyCount}
                  followingAssociationCount={followingAssociationCount}
                  onNavigate={closeMobile}
                />
              ) : null}
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
            {isCommunicationHub ? (
              <div className="student-sidebar-layout__mobile-search">{headerSearch}</div>
            ) : (
              <BrandLogo
                size="sm"
                variant="full"
                to={ROUTES.dashboard}
                className="min-w-0 flex-1"
              />
            )}
            {topActionsInner}
          </div>
          <div className="student-sidebar-layout__top-actions-bar hidden lg:flex">{topBar}</div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
