import { useCallback, useEffect, useState } from "react";
import {
  getCompanyTheme,
  setCompanyTheme,
  type CompanyThemeId,
} from "@/lib/companyThemes";

export function useCompanyTheme() {
  const [theme, setThemeState] = useState<CompanyThemeId>(getCompanyTheme);

  useEffect(() => {
    const sync = () => setThemeState(getCompanyTheme());
    window.addEventListener("cw-theme-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cw-theme-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const applyTheme = useCallback((id: CompanyThemeId) => {
    setCompanyTheme(id);
    setThemeState(id);
  }, []);

  return { theme, applyTheme };
}
