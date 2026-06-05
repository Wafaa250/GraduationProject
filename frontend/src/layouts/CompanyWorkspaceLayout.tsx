import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { AlertCircle, LayoutDashboard, FileText, Sparkles, MessageSquare, LogOut } from "lucide-react";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { CompanyTopbar } from "@/components/company/CompanyTopbar";
import {
  useCompanyWorkspaceBootstrap,
} from "@/layouts/useCompanyWorkspaceBootstrap";
import { COMPANY_ROUTES } from "@/routes/paths";
import { cn } from "@/lib/utils";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DashboardSkeleton } from "@/components/company/CompanySkeleton";

const mobileNav = [
  { to: COMPANY_ROUTES.dashboard, icon: LayoutDashboard, label: "Home" },
  { to: COMPANY_ROUTES.requests, icon: FileText, label: "Requests" },
  { to: COMPANY_ROUTES.matches, icon: Sparkles, label: "Matches" },
  { to: COMPANY_ROUTES.messages, icon: MessageSquare, label: "Messages" },
];

function CompanyWorkspaceLoading() {
  const { theme } = useCompanyTheme();

  return (
    <div className="company-workspace cw-shell flex w-full min-h-screen" data-cw-theme={theme}>
      <div className="cw-shell-main flex flex-col flex-1 w-full">
        <header className="cw-shell-header border-b border-border/80 px-4 py-3 flex items-center gap-3">
          <BrandLogo size="sm" variant="mark" />
          <span className="text-sm text-muted-foreground">Loading workspace…</span>
        </header>
        <main className="cw-shell-content p-6">
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  );
}

function CompanyWorkspaceError({
  message,
  errorCode,
  onSignOut,
}: {
  message: string;
  errorCode: string | null;
  onSignOut: () => void;
}) {
  const { theme } = useCompanyTheme();

  return (
    <div
      className="company-workspace cw-shell flex w-full min-h-screen items-center justify-center p-6"
      data-cw-theme={theme}
    >
      <div className="cw-card-elevated max-w-lg w-full p-8 text-center space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Company workspace unavailable</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          {errorCode ? (
            <p className="text-xs text-muted-foreground font-mono">Code: {errorCode}</p>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you were invited to a company team, ask your workspace owner to re-send the invitation to
          this email address. Company owners should complete registration or contact support.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button type="button" className="rounded-xl cw-btn-gradient border-0" onClick={onSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CompanyWorkspaceLayout() {
  const { status, errorMessage, errorCode, signOut } = useCompanyWorkspaceBootstrap();
  const { theme } = useCompanyTheme();

  if (status === "loading") {
    return <CompanyWorkspaceLoading />;
  }

  if (status === "error") {
    return (
      <CompanyWorkspaceError
        message={errorMessage ?? "Your company workspace could not be loaded."}
        errorCode={errorCode}
        onSignOut={signOut}
      />
    );
  }

  return (
    <div
      className="company-workspace cw-shell flex w-full"
      data-cw-theme={theme}
    >
      <CompanySidebar />
      <div className="cw-shell-main flex flex-col">
        <CompanyTopbar />
        <main className="cw-shell-content pb-16 md:pb-0">
          <Outlet />
        </main>
        <nav className="cw-mobile-nav-bar md:hidden fixed bottom-0 inset-x-0 flex justify-around py-2 px-2">
          {mobileNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === COMPANY_ROUTES.dashboard}
              className={({ isActive }) =>
                cn("cw-mobile-nav-link", isActive && "active")
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
