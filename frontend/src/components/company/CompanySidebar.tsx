import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Settings,
  Plus,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Users,
  Bookmark,
  LogOut,
} from "lucide-react";
import { companySignOut } from "@/components/company/CompanyProfileMenu";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { COMPANY_ROUTES } from "@/routes/paths";
import { cn } from "@/lib/utils";
import { useCompanySidebarCollapsed } from "@/hooks/useCompanySidebarCollapsed";
import { isCompanyOwner } from "@/lib/companyWorkspace";

const workspaceNav = [
  { title: "Dashboard", to: COMPANY_ROUTES.dashboard, icon: LayoutDashboard },
];

function isProjectRequestsPath(pathname: string) {
  return (
    pathname === COMPANY_ROUTES.requests ||
    pathname.startsWith(`${COMPANY_ROUTES.requests}/`)
  );
}

const profileNav = [{ title: "Company Profile", to: COMPANY_ROUTES.profile, icon: Building2 }];

const settingsNav = [{ title: "Settings", to: COMPANY_ROUTES.settings, icon: Settings }];

const ownerNav = [{ title: "Company Members", to: COMPANY_ROUTES.members, icon: Users }];

type NavItemProps = {
  to: string;
  icon: typeof LayoutDashboard;
  title: string;
  collapsed: boolean;
  badge?: string;
  end?: boolean;
  forceActive?: boolean;
  sublink?: boolean;
};

function SidebarNavItem({
  to,
  icon: Icon,
  title,
  collapsed,
  badge,
  end,
  forceActive,
  sublink,
}: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end ?? to === COMPANY_ROUTES.dashboard}
      title={collapsed ? title : undefined}
      data-tooltip={collapsed ? title : undefined}
      className={({ isActive }) =>
        cn(
          "cw-sidebar-link",
          sublink && !collapsed && "cw-sidebar-sublink",
          collapsed && "cw-sidebar-link--collapsed",
          (isActive || forceActive) && "active",
        )
      }
    >
      <span className="cw-sidebar-icon-wrap">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span
        className={cn(
          "whitespace-nowrap overflow-hidden transition-[opacity,width,margin] duration-300 ease-in-out flex-1",
          collapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100",
        )}
      >
        {title}
      </span>
      {badge && !collapsed ? <span className="cw-sidebar-badge">{badge}</span> : null}
    </NavLink>
  );
}

function ProjectRequestsNavGroup({ collapsed }: { collapsed: boolean }) {
  const { pathname } = useLocation();
  const inRequests = isProjectRequestsPath(pathname);
  const [open, setOpen] = useState(inRequests);

  useEffect(() => {
    if (inRequests) setOpen(true);
  }, [inRequests]);

  return (
    <div className="space-y-0.5">
      <div
        className={cn(
          "flex items-center gap-0.5 min-w-0",
          collapsed && "justify-center",
        )}
      >
        <NavLink
          to={COMPANY_ROUTES.requests}
          end={pathname === COMPANY_ROUTES.requests}
          title={collapsed ? "Project Requests" : undefined}
          data-tooltip={collapsed ? "Project Requests" : undefined}
          onClick={() => setOpen(true)}
          className={({ isActive }) =>
            cn(
              "cw-sidebar-link min-w-0 flex-1",
              collapsed && "cw-sidebar-link--collapsed",
              (isActive || inRequests) && "active",
            )
          }
        >
          <span className="cw-sidebar-icon-wrap">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden transition-[opacity,width,margin] duration-300 ease-in-out",
              collapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100",
            )}
          >
            Project Requests
          </span>
        </NavLink>
        {!collapsed ? (
          <button
            type="button"
            className={cn("cw-sidebar-requests-toggle shrink-0", open && "is-open")}
            aria-label={open ? "Hide New Request" : "Show New Request"}
            aria-expanded={open}
            onClick={(e) => {
              e.preventDefault();
              setOpen((value) => !value);
            }}
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {open && !collapsed ? (
        <SidebarNavItem
          to={COMPANY_ROUTES.newRequest}
          icon={Plus}
          title="New Request"
          collapsed={collapsed}
          sublink
          end
        />
      ) : null}
    </div>
  );
}

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: string }) {
  return (
    <div
      className={cn(
        "px-3 mb-1.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold overflow-hidden transition-[opacity,max-height] duration-300 ease-in-out",
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
  const showOwnerAccountNav = isCompanyOwner();
  return (
    <aside
      className={cn(
        "cw-sidebar hidden md:flex flex-col shrink-0 h-full min-h-0 overflow-hidden",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "cw-sidebar--collapsed w-[var(--cw-sidebar-collapsed)]" : "w-[var(--cw-sidebar-width)]",
      )}
      aria-label="Company workspace navigation"
    >
      <div
        className={cn(
          "cw-shell-header cw-sidebar-header",
          collapsed && "cw-sidebar-header--collapsed",
        )}
      >
        <div
          className={cn(
            "cw-sidebar-header-inner",
            collapsed && "cw-sidebar-header-inner--collapsed",
          )}
        >
          <BrandLogo
            to={COMPANY_ROUTES.dashboard}
            size="sm"
            variant={collapsed ? "mark" : "full"}
            className={cn("cw-sidebar-brand min-w-0", collapsed && "cw-sidebar-brand--collapsed")}
          />

          <button
            type="button"
            onClick={toggle}
            className="cw-sidebar-header-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
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
          <SectionLabel collapsed={collapsed}>Hiring</SectionLabel>
          <div className="space-y-0.5">
            {workspaceNav.map((item) => (
              <SidebarNavItem key={item.to} collapsed={collapsed} {...item} />
            ))}
            <ProjectRequestsNavGroup collapsed={collapsed} />
            <SidebarNavItem
              to={COMPANY_ROUTES.saved}
              icon={Bookmark}
              title="Saved Recommendations"
              collapsed={collapsed}
            />
          </div>
        </div>

        <div>
          <SectionLabel collapsed={collapsed}>Workspace</SectionLabel>
          <div className="space-y-0.5">
            {showOwnerAccountNav
              ? ownerNav.map((item) => (
                  <SidebarNavItem key={item.to} collapsed={collapsed} {...item} />
                ))
              : null}
            {profileNav.map((item) => (
              <SidebarNavItem key={item.to} collapsed={collapsed} {...item} />
            ))}
            {showOwnerAccountNav
              ? settingsNav.map((item) => (
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
          <span className="cw-sidebar-icon-wrap">
            <LogOut className="h-4 w-4" aria-hidden />
          </span>
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
