import type { NavigateFunction } from "react-router-dom";

import { isAssociationRole } from "../api/associationApi";

export type AuthResponse = {
  token: string;
  role: string;
  userId: number;
  name: string;
  email: string;
  profileId?: number;
  isNewUser?: boolean;
};

/** Persist JWT session keys used across the app (matches email/password login). */
export function persistAuthSession(result: AuthResponse): void {
  localStorage.setItem("token", result.token);
  localStorage.setItem("userId", result.userId.toString());
  localStorage.setItem("role", result.role);
  localStorage.setItem("name", result.name);
  localStorage.setItem("email", result.email);
}

/** Role-based redirects aligned with LoginPage. */
export function navigateAfterAuth(
  navigate: NavigateFunction,
  role: string,
): void {
  const normalized = (role ?? "").toString().toLowerCase();

  if (normalized === "doctor") {
    navigate("/doctor-dashboard");
    return;
  }
  if (normalized === "student") {
    navigate("/dashboard");
    return;
  }
  if (normalized === "company") {
    navigate("/company/dashboard");
    return;
  }
  if (isAssociationRole(normalized)) {
    navigate("/association/dashboard");
    return;
  }

  navigate("/dashboard");
}
