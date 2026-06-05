import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { ROUTES } from "@/routes/paths";
import { mustChangePassword } from "@/lib/authSession";
import { isCompanyWorkspaceAccountRole } from "@/lib/companyAccountRole";

/** Company workspace route — company owners and invited members. */
export function CompanyRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (!token) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (mustChangePassword()) {
    return <Navigate to={ROUTES.changePassword} replace />;
  }
  if (!isCompanyWorkspaceAccountRole(role)) {
    const legacyOpportunity = location.pathname.match(/^\/company\/requests\/(\d+)$/);
    if (legacyOpportunity && (role ?? "").toLowerCase() === "student") {
      const companyId = new URLSearchParams(location.search).get("companyId");
      if (companyId) {
        return (
          <Navigate
            to={ROUTES.companyOpportunityDetail(companyId, legacyOpportunity[1])}
            replace
          />
        );
      }
    }
    return <Navigate to={ROUTES.home} replace />;
  }
  return <>{children}</>;
}
