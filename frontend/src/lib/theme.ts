export const THEME_STORAGE_KEY = "skillswap-theme";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

/** @deprecated Use getStoredThemePreference — null means follow system. */
export function getStoredTheme(): Theme | null {
  const pref = getStoredThemePreference();
  return pref === "system" ? null : pref;
}

export function resolveTheme(preference: ThemePreference = getStoredThemePreference()): Theme {
  if (preference === "system") return getSystemTheme();
  return preference;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function persistThemePreference(preference: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function persistTheme(theme: Theme) {
  persistThemePreference(theme);
}
