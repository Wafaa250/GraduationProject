import type { HubColorScheme } from "@/constants/hubColorSchemes";

/** Semantic status colors — use only for success, warning, and error states. */
export const DOCTOR_STATUS = {
  success: { fg: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  warning: { fg: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" },
  error: { fg: "#EF4444", bg: "rgba(239, 68, 68, 0.12)" },
} as const;

const LIGHT_DOCTOR_BRAND = {
  background: "#FAFBFC",
  border: "#E0F2FE",
  link: "#0284C7",
  primary: "#0EA5E9",
  primarySoft: "rgba(14, 165, 233, 0.12)",
  primaryBorder: "rgba(14, 165, 233, 0.35)",
  gradient: ["#0EA5E9", "#0284C7", "#F0F9FF"] as const,
};

const DARK_DOCTOR_BRAND = {
  background: "#0A1018",
  border: "#1E3A5F",
  link: "#38BDF8",
  primary: "#38BDF8",
  primarySoft: "rgba(56, 189, 248, 0.18)",
  primaryBorder: "rgba(56, 189, 248, 0.45)",
  gradient: ["#0EA5E9", "#0284C7", "#121826"] as const,
};

/** Applies doctor-blue branding over the shared hub palette. */
export function applyDoctorBrandColors(base: HubColorScheme): HubColorScheme {
  const brand = base.doctor === "#38BDF8" ? DARK_DOCTOR_BRAND : LIGHT_DOCTOR_BRAND;

  return {
    ...base,
    background: brand.background,
    border: brand.border,
    link: brand.link,
    primary: brand.primary,
    primarySoft: brand.primarySoft,
    primaryBorder: brand.primaryBorder,
    gradient: brand.gradient,
  };
}

export function doctorBrandAccent(colors: HubColorScheme) {
  return { fg: colors.primary, bg: colors.primarySoft };
}

export function doctorMetricToneColors(
  tone: "primary" | "info" | "accent" | "success" | "warning" | "danger",
  colors: HubColorScheme,
) {
  switch (tone) {
    case "success":
      return { fg: DOCTOR_STATUS.success.fg, bg: DOCTOR_STATUS.success.bg };
    case "warning":
      return { fg: DOCTOR_STATUS.warning.fg, bg: DOCTOR_STATUS.warning.bg };
    case "danger":
      return { fg: DOCTOR_STATUS.error.fg, bg: DOCTOR_STATUS.error.bg };
    default:
      return doctorBrandAccent(colors);
  }
}
