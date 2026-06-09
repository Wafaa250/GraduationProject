import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ROUTES } from "@/routes/paths";
import { DOCTOR_NAV_ROUTES, doctorNavKeyFromPath } from "@/lib/doctorHubNav";
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  BookOpen,
  MessageCircle,
  Settings,
  Users,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { getDoctorDashboardSummary } from "@/api/doctorDashboardApi";
import { getDoctorCourses } from "@/api/doctorCoursesApi";
import { getConversations, sumConversationUnseen } from "@/api/conversationsApi";
import { cn } from "@/lib/utils";

const nav = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, badgeKey: null as string | null },
  { key: "students", label: "Students", icon: Users, badgeKey: null as string | null },
  { key: "requests", label: "Supervision Requests", icon: Inbox, badgeKey: "pendingRequests" },
  { key: "projects", label: "Active Projects", icon: FolderKanban, badgeKey: "supervised" },
  { key: "courses", label: "Courses", icon: BookOpen, badgeKey: "courses" },
  { key: "messages", label: "Messages", icon: MessageCircle, badgeKey: "messages" },
  { key: "settings", label: "Settings", icon: Settings, badgeKey: null as string | null },
];

export function DoctorHubSidebar() {
  const { pathname } = useLocation();
  const active = doctorNavKeyFromPath(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getDoctorDashboardSummary(), getDoctorCourses(), getConversations()])
      .then(([summary, courses, conversations]) => {
        if (cancelled) return;
        setBadges({
          pendingRequests: summary.pendingRequestsCount,
          supervised: summary.supervisedCount,
          courses: courses.length,
          messages: sumConversationUnseen(conversations),
        });
      })
      .catch(() => {
        if (!cancelled) setBadges({});
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <aside
      className={cn(
        "doctor-hub__sidebar hidden lg:flex h-screen max-h-screen shrink-0 flex-col overflow-hidden",
        "sticky top-0 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] border-r border-[hsl(var(--sidebar-border))] transition-smooth",
        collapsed ? "w-[78px]" : "w-[268px]",
      )}
      aria-label="Doctor navigation"
    >
      <div className="doctor-hub__sidebar-brand shrink-0 flex items-center justify-between gap-2 px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <Link
          to={ROUTES.doctorDashboard}
          className="doctor-hub__sidebar-brand-link min-w-0 flex-1"
          aria-label="SkillSwap dashboard"
        >
          <BrandLogo size="sm" variant={collapsed ? "mark" : "full"} />
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-doctor-accent transition-smooth"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="doctor-hub__sidebar-nav min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--sidebar-muted))]">
            Workspace
          </div>
        )}
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const to = DOCTOR_NAV_ROUTES[item.key];
          const badge =
            item.badgeKey && badges[item.badgeKey] != null && badges[item.badgeKey] > 0
              ? badges[item.badgeKey]
              : null;
          return (
            <Link
              key={item.key}
              to={to}
              className={cn(
                "group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth relative no-underline",
                "text-foreground/90 bg-[hsl(var(--muted))/0.55] hover:text-doctor-accent hover:bg-doctor-accent-soft/95",
                isActive && "doctor-nav-link--active",
                collapsed && "justify-center px-0",
              )}
            >
              <span className="doctor-nav-indicator" aria-hidden />
              <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-doctor-accent")} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge != null && (
                    <span
                      className={cn(
                        "min-w-[22px] px-1.5 h-5 grid place-items-center rounded-full text-[10.5px] font-semibold",
                        isActive
                          ? "bg-doctor-accent text-white"
                          : "bg-doctor-accent-soft text-doctor-accent",
                      )}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
