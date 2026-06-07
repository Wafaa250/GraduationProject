import { useMemo } from "react";

import { getCompanyThemeColors } from "@/constants/companyThemePalettes";
import type { CompanyColorScheme } from "@/constants/companyTheme";
import { useCompanyWorkspaceTheme } from "@/contexts/CompanyWorkspaceThemeContext";
import { useThemePreference } from "@/contexts/ThemePreferenceContext";

export function useCompanyTheme(): CompanyColorScheme {
  const { colorScheme } = useThemePreference();
  const { themeId } = useCompanyWorkspaceTheme();
  return useMemo(
    () => getCompanyThemeColors(themeId, colorScheme),
    [themeId, colorScheme],
  );
}
