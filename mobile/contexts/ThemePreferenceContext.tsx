import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import { getHubColors, type HubColorScheme } from "@/constants/hubColorSchemes";
import { getItem, setItem } from "@/utils/authStorage";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "themeMode";

type ThemePreferenceContextValue = {
  themeMode: ThemeMode;
  colorScheme: "light" | "dark";
  colors: HubColorScheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  hydrated: boolean;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeModeState(stored);
      }
      setHydrated(true);
    })();
  }, []);

  const colorScheme: "light" | "dark" =
    themeMode === "system" ? (systemScheme === "dark" ? "dark" : "light") : themeMode;

  const colors = useMemo(() => getHubColors(colorScheme), [colorScheme]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await setItem(STORAGE_KEY, mode);
  }, []);

  const value = useMemo(
    () => ({ themeMode, colorScheme, colors, setThemeMode, hydrated }),
    [themeMode, colorScheme, colors, setThemeMode, hydrated],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error("useThemePreference must be used within ThemePreferenceProvider");
  }
  return ctx;
}

/** Alias for components that only need resolved hub colors. */
export function useHubTheme() {
  const { colors, colorScheme, themeMode, setThemeMode, hydrated } = useThemePreference();
  return { colors, colorScheme, themeMode, setThemeMode, hydrated };
}
