import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Users,
  Bookmark,
  LogOut,
} from "lucide-react";
import { COMPANY_ROUTES } from "@/routes/paths";
import { cn } from "@/lib/utils";
import { useCompanySidebarCollapsed } from "@/hooks/useCompanySidebarCollapsed";
import { isCompanyOwner } from "@/lib/companyWorkspace";
import { companySignOut } from "@/components/company/CompanyProfileMenu";

const workspaceNav = [
  { title: "Dashboard", to: COMPANY_ROUTES.dashboard, icon: LayoutDashboard },
  { title: "Project Requests", to: COMPANY_ROUTES.requests, icon: FileText },
];

const accountNav = [
  { title: "Company Profile", to: COMPANY_ROUTES.profile, icon: Building2 },
  { title: "Settings", to: COMPANY_ROUTES.settings, icon: Settings },
];

const ownerNav = [{ title: "Company Members", to: COMPANY_ROUTES.members, icon: Users }];

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
  const navigate = useNavigate();
  const { collapsed, toggle } = useCompanySidebarCollapsed();
  const showMembers = isCompanyOwner();

  return (
    <aside
      className={cn(
        "cw-sidebar hidden md:flex flex-col shrink-0 h-full min-h-0 overflow-hidden",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "cw-sidebar--collapsed w-[4.25rem]" : "w-64",
      )}
      aria-label="Company workspace navigation"
    >
      <div className="cw-shell-header cw-sidebar-header">
        <div
          className={cn(
            "cw-sidebar-header-inner",
            collapsed ? "cw-sidebar-header-inner--collapsed" : "cw-sidebar-header-inner--expanded",
          )}
        >
          <div className="cw-sidebar-brand">
            <div className="cw-sidebar-brand-mark cw-avatar-gradient shadow-md" aria-hidden>
              <Sparkles className="h-[1.125rem] w-[1.125rem] text-white" />
            </div>
            <div
              className={cn(
                "cw-sidebar-brand-text",
                collapsed && "cw-sidebar-brand-text--hidden",
              )}
            >
              <span className="cw-sidebar-brand-title truncate">SkillSwap</span>
              <span className="cw-sidebar-brand-subtitle truncate">AI Talent Discovery</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggle}
            className="cw-sidebar-header-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
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
          <SectionLabel collapsed={collapsed}>Discovery</SectionLabel>
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
            <SidebarNavItem
              to={COMPANY_ROUTES.saved}
              icon={Bookmark}
              title="Saved Recommendations"
              collapsed={collapsed}
            />
          </div>
        </div>

        <div>
          <SectionLabel collapsed={collapsed}>Account</SectionLabel>
          <div className="space-y-0.5">
            {accountNav.map((item) => (
              <SidebarNavItem key={item.to} collapsed={collapsed} {...item} />
            ))}
            {showMembers
              ? ownerNav.map((item) => (
                  <SidebarNavItem key={item.to} collapsed={collapsed} {...item} />
                ))
              : null}
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "cw-sidebar-footer shrink-0 border-t border-border/80 mt-auto transition-[padding] duration-300",
          collapsed ? "px-1.5 py-2" : "px-2 py-2",
        )}
      >
        <button
          type="button"
          title={collapsed ? "Logout" : undefined}
          data-tooltip={collapsed ? "Logout" : undefined}
          className={cn(
            "cw-sidebar-link w-full",
            collapsed && "cw-sidebar-link--collapsed",
          )}
          onClick={() => companySignOut(navigate)}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden transition-[opacity,width,margin] duration-300 ease-in-out",
              collapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100",
            )}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
