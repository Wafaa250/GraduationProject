import { useMemo } from "react";

import { createHubDesign } from "@/constants/hubDesignTokens";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export function useHubDesign() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  return useMemo(() => createHubDesign(colors, layout), [colors, layout]);
}
