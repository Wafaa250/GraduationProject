import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Compass,
  Handshake,
  MessageSquare,
  Building2,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { COMPANY_ROUTES } from "@/routes/paths";
import { cn } from "@/lib/utils";
import { useCompanySidebarCollapsed } from "@/hooks/useCompanySidebarCollapsed";

const workspaceNav = [
  { title: "Dashboard", to: COMPANY_ROUTES.dashboard, icon: LayoutDashboard },
  { title: "Requests", to: COMPANY_ROUTES.requests, icon: FileText },
];

const intelligenceNav = [
  { title: "AI Matches", to: COMPANY_ROUTES.matches, icon: Sparkles },
  { title: "Discover", to: COMPANY_ROUTES.discover, icon: Compass },
];

const manageNav = [
  { title: "Collaborations", to: COMPANY_ROUTES.collaborations, icon: Handshake },
  { title: "Messages", to: COMPANY_ROUTES.messages, icon: MessageSquare },
  { title: "Company Profile", to: COMPANY_ROUTES.profile, icon: Building2 },
  { title: "Settings", to: COMPANY_ROUTES.settings, icon: Settings },
];

type NavItemProps = {
  to: string;
  icon: typeof LayoutDashboard;
  title: string;
  collapsed: boolean;
  sublink?: boolean;
};

function SidebarNavItem({ to, icon: Icon, title, collapsed, sublink }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === COMPANY_ROUTES.dashboard}
      title={collapsed ? title : undefined}
      data-tooltip={collapsed ? title : undefined}
      className={({ isActive }) =>
        cn(
          "cw-sidebar-link",
          sublink && !collapsed && "cw-sidebar-sublink",
          collapsed && "cw-sidebar-link--collapsed",
          isActive && "active",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span
        className={cn(
          "whitespace-nowrap overflow-hidden transition-[opacity,width,margin] duration-300 ease-in-out",
          collapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100",
        )}
      >
        {title}
      </span>
    </NavLink>
  );
}

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: string }) {
  return (
    <div
      className={cn(
        "px-3 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium overflow-hidden transition-[opacity,max-height] duration-300 ease-in-out",
        collapsed ? "max-h-0 opacity-0 mb-0" : "max-h-8 opacity-100",
      )}
    >
      {children}
    </div>
  );
}

export function CompanySidebar() {
  const { collapsed, toggle } = useCompanySidebarCollapsed();

  return (
    <aside
      className={cn(
        "cw-sidebar hidden md:flex flex-col shrink-0 overflow-hidden",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "cw-sidebar--collapsed w-[4.25rem]" : "w-64",
      )}
      aria-label="Company workspace navigation"
    >
      <div
        className={cn(
          "border-b border-border shrink-0 transition-[padding] duration-300",
          collapsed ? "px-2 py-3" : "px-3 py-4",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed ? "flex-col" : "flex-row",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 min-w-0",
              collapsed ? "justify-center w-full" : "flex-1",
            )}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center shadow-md shrink-0">
              <Sparkles className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div
              className={cn(
                "leading-tight min-w-0 overflow-hidden transition-[opacity,width] duration-300 ease-in-out",
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
              )}
            >
              <div className="font-semibold text-base truncate text-foreground">SkillSwap</div>
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                Company Workspace
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggle}
            className={cn(
              "shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary",
              "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collapsed ? "h-8 w-8 grid place-items-center" : "h-8 w-8 grid place-items-center",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 transition-[padding] duration-300",
          collapsed ? "px-1.5" : "px-2",
        )}
      >
        <div>
          <SectionLabel collapsed={collapsed}>Workspace</SectionLabel>
          <div className="space-y-0.5">
            {workspaceNav.map((item) => (
              <SidebarNavItem key={item.to} collapsed={collapsed} {...item} />
            ))}
            <SidebarNavItem
              to={COMPANY_ROUTES.newRequest}
              icon={Plus}
              title="New Request"
              collapsed={collapsed}
              sublink
            />
          </div>
        </div>

        <div>
          <SectionLabel collapsed={collapsed}>AI Intelligence</SectionLabel>
          <div className="space-y-0.5">
            {intelligenceNav.map((item) => (
              <SidebarNavItem key={item.to} collapsed={collapsed} {...item} />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel collapsed={collapsed}>Manage</SectionLabel>
          <div className="space-y-0.5">
            {manageNav.map((item) => (
              <SidebarNavItem key={item.to} collapsed={collapsed} {...item} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
