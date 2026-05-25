import type { NavigateFunction } from "react-router-dom";
import { COMPANY_ROUTES, ROUTES } from "@/routes/paths";

export function getHomePath(): string {
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (role === "student") {
    return ROUTES.dashboard;
  }
  if (role === "company") {
    return COMPANY_ROUTES.dashboard;
  }
  return ROUTES.home;
}

export function navigateHome(navigate: NavigateFunction): void {
  navigate(getHomePath());
}
