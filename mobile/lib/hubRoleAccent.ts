import { ASSOC_COLORS } from "@/constants/associationTheme";
import { COMPANY_COLORS, COMPANY_COLORS_DARK } from "@/constants/companyTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { DARK_HUB_COLORS, LIGHT_HUB_COLORS } from "@/constants/hubColorSchemes";
import type { HubRoleType } from "@/constants/studentHubTheme";

/** Role accents for Communication Hub — sourced from workspace themes, not generic hub colors. */
export type HubRoleAccent = {
  fg: string;
  bg: string;
  border: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondaryFg: string;
  buttonSecondaryBg: string;
  buttonSecondaryBorder: string;
};

function isDarkHub(colors: HubColorScheme): boolean {
  return colors.doctor === "#38BDF8";
}

function buildStudentAccent(isDark: boolean): HubRoleAccent {
  const hub = isDark ? DARK_HUB_COLORS : LIGHT_HUB_COLORS;
  return {
    fg: hub.primary,
    bg: hub.primarySoft,
    border: hub.primaryBorder,
    buttonPrimary: hub.primary,
    buttonPrimaryText: "#FFFFFF",
    buttonSecondaryFg: hub.primary,
    buttonSecondaryBg: hub.primarySoft,
    buttonSecondaryBorder: hub.primaryBorder,
  };
}

function buildDoctorAccent(isDark: boolean): HubRoleAccent {
  const primary = isDark ? "#38BDF8" : "#0EA5E9";
  const primarySoft = isDark ? "rgba(56, 189, 248, 0.18)" : "rgba(14, 165, 233, 0.12)";
  const primaryBorder = isDark ? "rgba(56, 189, 248, 0.45)" : "rgba(14, 165, 233, 0.35)";
  return {
    fg: primary,
    bg: primarySoft,
    border: primaryBorder,
    buttonPrimary: primary,
    buttonPrimaryText: "#FFFFFF",
    buttonSecondaryFg: primary,
    buttonSecondaryBg: primarySoft,
    buttonSecondaryBorder: primaryBorder,
  };
}

function buildCompanyAccent(isDark: boolean): HubRoleAccent {
  const c = isDark ? COMPANY_COLORS_DARK : COMPANY_COLORS;
  return {
    fg: c.accent,
    bg: c.accentMuted,
    border: c.accentBorder,
    buttonPrimary: c.accent,
    buttonPrimaryText: "#FFFFFF",
    buttonSecondaryFg: c.accentDark,
    buttonSecondaryBg: c.accentSoft,
    buttonSecondaryBorder: c.accentBorder,
  };
}

function buildAssociationAccent(isDark: boolean): HubRoleAccent {
  const a = ASSOC_COLORS;
  if (isDark) {
    return {
      fg: a.accentBar,
      bg: "rgba(249, 115, 22, 0.18)",
      border: "rgba(251, 146, 60, 0.45)",
      buttonPrimary: a.accent,
      buttonPrimaryText: "#FFFFFF",
      buttonSecondaryFg: a.accentBar,
      buttonSecondaryBg: "rgba(249, 115, 22, 0.18)",
      buttonSecondaryBorder: "rgba(251, 146, 60, 0.45)",
    };
  }
  return {
    fg: a.accent,
    bg: a.accentSoft,
    border: a.accentBorder,
    buttonPrimary: a.accent,
    buttonPrimaryText: "#FFFFFF",
    buttonSecondaryFg: a.accentDark,
    buttonSecondaryBg: a.accentMuted,
    buttonSecondaryBorder: a.accentBorder,
  };
}

const BUILDERS: Record<HubRoleType, (isDark: boolean) => HubRoleAccent> = {
  student: buildStudentAccent,
  doctor: buildDoctorAccent,
  company: buildCompanyAccent,
  association: buildAssociationAccent,
};

export function getHubRoleAccent(colors: HubColorScheme, role: HubRoleType): HubRoleAccent {
  return BUILDERS[role](isDarkHub(colors));
}

export function sectionKeyToRole(key: string): HubRoleType {
  if (key === "doctors") return "doctor";
  if (key === "companies") return "company";
  if (key === "associations") return "association";
  return "student";
}
