import { useLocation } from "react-router-dom";
import { CompanyNotificationBell } from "@/components/company/CompanyNotificationBell";
import { CompanyProfileMenu } from "@/components/company/CompanyProfileMenu";
import { WorkspaceThemeToggle } from "@/components/theme/WorkspaceThemeToggle";
import { getStoredCompanyDisplayName } from "@/layouts/useCompanyWorkspaceBootstrap";
import { getCompanyPageMeta } from "@/lib/companyPageMeta";
import { COMPANY_ROUTES } from "@/routes/paths";

function workspaceInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CompanyTopbar() {
  const { pathname } = useLocation();
  const companyName = getStoredCompanyDisplayName();
  const pageMeta = getCompanyPageMeta(pathname);
  const isDashboard = pathname === COMPANY_ROUTES.dashboard;

  return (
    <header className="cw-shell-header cw-topbar z-30 flex min-h-[var(--cw-header-height)] items-center gap-4 px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="cw-workspace-chip hidden sm:inline-flex" title={companyName}>
          <span className="cw-workspace-chip-mark" aria-hidden>
            {workspaceInitials(companyName)}
          </span>
          <span className="truncate">{companyName}</span>
        </div>

        {!isDashboard && pageMeta ? (
          <>
            <span className="cw-topbar-divider hidden sm:block" aria-hidden />
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-semibold tracking-tight truncate leading-tight">
                {pageMeta.title}
              </p>
              {pageMeta.subtitle ? (
                <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                  {pageMeta.subtitle}
                </p>
              ) : null}
            </div>
          </>
        ) : isDashboard ? (
          <p className="hidden sm:block text-xs text-muted-foreground">Executive overview</p>
        ) : null}
      </div>

      <div className="flex-1" />

      <div className="cw-workspace-header-actions flex items-center gap-1.5">
        <CompanyNotificationBell />
        <WorkspaceThemeToggle />
        <span className="cw-topbar-divider mx-0.5 hidden sm:block" aria-hidden />
        <CompanyProfileMenu />
      </div>
    </header>
  );
}
