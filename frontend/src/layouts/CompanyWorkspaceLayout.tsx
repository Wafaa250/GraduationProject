import { Outlet } from "react-router-dom";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { CompanyTopbar } from "@/components/company/CompanyTopbar";
import { COMPANY_ROUTES } from "@/routes/paths";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Sparkles, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { to: COMPANY_ROUTES.dashboard, icon: LayoutDashboard, label: "Home" },
  { to: COMPANY_ROUTES.requests, icon: FileText, label: "Requests" },
  { to: COMPANY_ROUTES.matches, icon: Sparkles, label: "Matches" },
  { to: COMPANY_ROUTES.messages, icon: MessageSquare, label: "Messages" },
];

export function CompanyWorkspaceLayout() {
  return (
    <div className="company-workspace cw-shell flex w-full">
      <CompanySidebar />
      <div className="cw-shell-main flex flex-col">
        <CompanyTopbar />
        <main className="cw-shell-content pb-16 md:pb-0">
          <Outlet />
        </main>
        <nav className="cw-mobile-nav-bar md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around py-2 px-2">
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
