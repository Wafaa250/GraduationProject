import type { NavigateFunction } from "react-router-dom";

/**
 * Home route after login / “back to dashboard” (uses `localStorage.role` from login).
 */
export function getHomePath(): "/doctor-dashboard" | "/dashboard" {
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (role === "doctor") return "/doctor-dashboard";
  return "/dashboard";
}

export function navigateHome(navigate: NavigateFunction): void {
  navigate(getHomePath());
}
