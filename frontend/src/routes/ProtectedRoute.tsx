import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ROUTES } from "@/routes/paths";

/** Requires any authenticated session (token in localStorage). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to={ROUTES.login} replace />;
  }
  return <>{children}</>;
}
