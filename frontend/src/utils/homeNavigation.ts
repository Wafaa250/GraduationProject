import type { NavigateFunction } from "react-router-dom";
import { ASSOCIATION_ROUTES, COMPANY_ROUTES, ROUTES } from "@/routes/paths";
import { isAssociationRole } from "@/api/associationApi";

export function getHomePath(): string {
  const role = localStorage.getItem("role");
  if (isAssociationRole(role)) {
    return ASSOCIATION_ROUTES.dashboard;
  }
  const roleLower = (role ?? "").toLowerCase();
  if (roleLower === "student") {
    return ROUTES.dashboard;
  }
  if (roleLower === "company") {
    return COMPANY_ROUTES.dashboard;
  }
  return ROUTES.home;
}

export function navigateHome(navigate: NavigateFunction): void {
  navigate(getHomePath());
}
