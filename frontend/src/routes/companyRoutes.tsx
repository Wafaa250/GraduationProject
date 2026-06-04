import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ROUTES } from "@/routes/paths";
import { mustChangePassword } from "@/lib/authSession";
import { isCompanyWorkspaceAccountRole } from "@/lib/companyAccountRole";

/** Company workspace route — company owners and invited members. */
export function CompanyRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (mustChangePassword()) {
    return <Navigate to={ROUTES.changePassword} replace />;
  }
  if (!isCompanyWorkspaceAccountRole(role)) {
    return <Navigate to={ROUTES.home} replace />;
  }
  return <>{children}</>;
}
