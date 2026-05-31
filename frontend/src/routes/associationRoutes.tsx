import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { mustChangePassword } from "@/lib/authSession";
import { isAssociationRole } from "@/api/associationApi";

/** Student association–only route — requires token and association role. */
export function AssociationRoute() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (mustChangePassword()) {
    return <Navigate to={ROUTES.changePassword} replace />;
  }
  if (!isAssociationRole(role)) {
    return <Navigate to={ROUTES.home} replace />;
  }
  return <Outlet />;
}
