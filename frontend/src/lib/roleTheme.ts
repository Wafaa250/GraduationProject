export const ROLE_STORAGE_KEY = "role";

export type RoleThemeId = "student" | "doctor" | "company" | "association";

const ROLE_CLASS_PREFIX = "role-";

const ROLE_THEME_CLASSES: RoleThemeId[] = ["student", "doctor", "company", "association"];

/** Normalize backend / localStorage role strings to a theme id. */
export function normalizeRoleTheme(role: string | null | undefined): RoleThemeId | null {
  const value = (role ?? "").toLowerCase().replace(/[\s_-]/g, "");
  if (value === "student") return "student";
  if (value === "doctor") return "doctor";
  if (value === "company") return "company";
  if (value === "studentassociation" || value === "association") return "association";
  return null;
}

export function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_STORAGE_KEY);
}

export function applyRoleTheme(role: string | null | undefined) {
  const root = document.documentElement;
  for (const id of ROLE_THEME_CLASSES) {
    root.classList.remove(`${ROLE_CLASS_PREFIX}${id}`);
  }
  const themeId = normalizeRoleTheme(role);
  if (themeId) {
    root.classList.add(`${ROLE_CLASS_PREFIX}${themeId}`);
  }
}

export function clearRoleTheme() {
  const root = document.documentElement;
  for (const id of ROLE_THEME_CLASSES) {
    root.classList.remove(`${ROLE_CLASS_PREFIX}${id}`);
  }
}

export function syncRoleThemeFromStorage() {
  applyRoleTheme(getStoredRole());
}
