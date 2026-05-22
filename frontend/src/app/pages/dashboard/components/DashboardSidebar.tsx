import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  GraduationCap,
  Building2,
  MessageSquare,
  Settings,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "../../../components/ui/utils";
import { getHomePath } from "../../../../utils/homeNavigation";

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  to: string;
  badge?: number;
};

type DashboardSidebarProps = {
  messageUnread?: number;
  notificationUnread?: number;
  onOpenSettings?: () => void;
};

const mainNav: Omit<NavItem, "badge">[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: FolderKanban, label: "Projects", to: "/dashboard" },
  { icon: Users, label: "Teammates", to: "/students" },
  { icon: GraduationCap, label: "Supervisors", to: "/dashboard" },
  { icon: Building2, label: "Organizations", to: "/organizations" },
  { icon: MessageSquare, label: "Messages", to: "/dashboard" },
];

export function DashboardSidebar({
  messageUnread = 0,
  notificationUnread = 0,
  onOpenSettings,
}: DashboardSidebarProps) {
  const location = useLocation();

  const nav: NavItem[] = mainNav.map((item) => {
    if (item.label === "Messages" && messageUnread > 0) {
      return { ...item, badge: messageUnread };
    }
    return item;
  });

  const isActive = (to: string, label: string) => {
    if (label === "Dashboard" || label === "Projects" || label === "Supervisors") {
      return location.pathname === "/dashboard";
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0 px-5 py-7">
      <Link to={getHomePath()} className="flex items-center gap-2.5 mb-10 px-2 no-underline">
        <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none text-foreground">
            SkillSwap
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">AI Collaboration</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = isActive(item.to, item.label);
          const content = (
            <>
              <item.icon className={cn("size-[18px]", active && "text-primary")} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge != null && item.badge > 0 ? (
                <span className="text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </>
          );

          if (item.label === "Messages") {
            return (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all w-full",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                )}
                onClick={() => {
                  document.getElementById("sd-topbar-messages")?.querySelector("button")?.click();
                }}
              >
                {content}
              </button>
            );
          }

          if (item.label === "Projects") {
            return (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all w-full",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                )}
                onClick={() => {
                  document.getElementById("sd-browse-projects-trigger")?.click();
                }}
              >
                {content}
              </button>
            );
          }

          if (item.label === "Supervisors") {
            return (
              <a
                key={item.label}
                href="#sd-supervisors"
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all no-underline",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                )}
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all no-underline",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-sidebar-border flex flex-col gap-1">
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors w-full"
          onClick={() => {
            document.getElementById("sd-topbar-notifications")?.querySelector("button")?.click();
          }}
        >
          <Bell className="size-[18px]" />
          <span className="flex-1 text-left">Notifications</span>
          {notificationUnread > 0 ? (
            <span className="text-[10px] font-semibold bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {notificationUnread > 99 ? "99+" : notificationUnread}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors w-full"
          onClick={onOpenSettings}
        >
          <Settings className="size-[18px]" />
          <span className="flex-1 text-left">Settings</span>
        </button>
      </div>

      <div className="mt-auto pt-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <div className="absolute -right-6 -top-6 size-20 rounded-full bg-white/20 blur-2xl" />
          <Sparkles className="size-5 mb-2" />
          <div className="font-display font-semibold text-sm leading-tight">
            Upgrade your AI match engine
          </div>
          <p className="text-[11px] opacity-90 mt-1 mb-3">
            Unlock deeper teammate compatibility insights.
          </p>
          <Link
            to="/profile"
            className="inline-block text-xs font-semibold bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 text-primary-foreground no-underline"
          >
            Learn more
          </Link>
        </div>
      </div>
    </aside>
  );
}
