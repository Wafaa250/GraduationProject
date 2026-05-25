import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ROUTES } from "@/routes/paths";

/** Company-only route — requires token and role === company. */
export function CompanyRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (!token) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (role !== "company") {
    return <Navigate to={ROUTES.home} replace />;
  }
  return <>{children}</>;
}
