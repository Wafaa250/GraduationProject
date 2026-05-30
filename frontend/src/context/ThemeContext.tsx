import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  getStoredThemePreference,
  persistTheme,
  persistThemePreference,
  resolveTheme,
  type Theme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  themePreference: ThemePreference;
  setTheme: (theme: Theme) => void;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() =>
    getStoredThemePreference(),
  );
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme());

  useEffect(() => {
    setThemeState(resolveTheme(themePreference));
  }, [themePreference]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (themePreference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setThemeState(media.matches ? "dark" : "light");

    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themePreference]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    persistThemePreference(preference);
    setThemePreferenceState(preference);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next);
    setThemePreferenceState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      persistTheme(next);
      setThemePreferenceState(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, themePreference, setTheme, setThemePreference, toggleTheme }),
    [theme, themePreference, setTheme, setThemePreference, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
