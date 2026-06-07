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
  getCompanyTheme,
  setCompanyTheme,
  type CompanyThemeId,
} from "@/lib/companyThemes";

type CompanyWorkspaceThemeContextValue = {
  themeId: CompanyThemeId;
  hydrated: boolean;
  applyTheme: (id: CompanyThemeId) => Promise<void>;
  refreshTheme: () => Promise<void>;
};

const CompanyWorkspaceThemeContext = createContext<CompanyWorkspaceThemeContextValue | null>(null);

export function CompanyWorkspaceThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<CompanyThemeId>("copper");
  const [hydrated, setHydrated] = useState(false);

  const refreshTheme = useCallback(async () => {
    setThemeIdState(await getCompanyTheme());
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshTheme();
      setHydrated(true);
    })();
  }, [refreshTheme]);

  const applyTheme = useCallback(async (id: CompanyThemeId) => {
    await setCompanyTheme(id);
    setThemeIdState(id);
  }, []);

  const value = useMemo(
    () => ({ themeId, hydrated, applyTheme, refreshTheme }),
    [themeId, hydrated, applyTheme, refreshTheme],
  );

  return (
    <CompanyWorkspaceThemeContext.Provider value={value}>{children}</CompanyWorkspaceThemeContext.Provider>
  );
}

export function useCompanyWorkspaceTheme(): CompanyWorkspaceThemeContextValue {
  const ctx = useContext(CompanyWorkspaceThemeContext);
  if (!ctx) {
    throw new Error("useCompanyWorkspaceTheme must be used within CompanyWorkspaceThemeProvider");
  }
  return ctx;
}
