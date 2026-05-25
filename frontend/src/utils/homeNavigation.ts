import type { NavigateFunction } from "react-router-dom";
import { ROUTES } from "@/routes/paths";

export function getHomePath(): string {
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (role === "student") {
    return ROUTES.dashboard;
  }
  if (role === "doctor") {
    return ROUTES.doctorDashboard;
  }
  return ROUTES.home;
}

export function navigateHome(navigate: NavigateFunction): void {
  navigate(getHomePath());
}
