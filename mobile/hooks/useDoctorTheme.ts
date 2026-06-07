import { useMemo } from "react";

import { applyDoctorBrandColors } from "@/constants/doctorHubTheme";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";

/** Doctor workspace theme — blue brand identity with status-only semantic colors. */
export function useDoctorTheme() {
  const hub = useHubTheme();
  const colors = useMemo(() => applyDoctorBrandColors(hub.colors), [hub.colors]);
  return { ...hub, colors };
}
