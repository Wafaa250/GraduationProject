import type { NavigateFunction } from "react-router-dom";
import { ROUTES } from "@/routes/paths";

/** Keys written on login — keep in sync with LoginPage and mobile `authStorage` SESSION_KEYS. */
const AUTH_SESSION_KEYS = ["token", "userId", "role", "name", "email"] as const;

/** Clears the authenticated session from localStorage (inverse of login persistence). */
export function clearAuthSession(): void {
  for (const key of AUTH_SESSION_KEYS) {
    localStorage.removeItem(key);
  }
}

/** Signs the user out and redirects to the login page. */
export function logout(navigate: NavigateFunction): void {
  clearAuthSession();
  navigate(ROUTES.login, { replace: true });
}
