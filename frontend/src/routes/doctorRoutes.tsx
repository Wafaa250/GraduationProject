import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ROUTES } from "@/routes/paths";
import { mustChangePassword } from "@/lib/authSession";
import { getRoleDashboardPath } from "@/utils/homeNavigation";

function isDoctorRole(role: string | null | undefined): boolean {
  return (role ?? "").toLowerCase() === "doctor";
}

/** Doctor hub routes — requires token, password change cleared, and doctor role. */
export function DoctorRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (mustChangePassword()) {
    return <Navigate to={ROUTES.changePassword} replace />;
  }
  if (!isDoctorRole(role)) {
    return <Navigate to={getRoleDashboardPath()} replace />;
  }
  return <>{children}</>;
}
