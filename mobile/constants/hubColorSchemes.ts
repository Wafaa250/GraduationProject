import { ASSOC_COLORS } from "@/constants/associationTheme";
import { COMPANY_COLORS, COMPANY_COLORS_DARK } from "@/constants/companyTheme";
import type { HubRoleType } from "@/constants/studentHubTheme";

export type HubColorScheme = {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  inputBg: string;
  cardBg: string;
  link: string;
  primary: string;
  primarySoft: string;
  primaryBorder: string;
  gradient: readonly [string, string, string];
  cardShadow: string;
  student: string;
  doctor: string;
  company: string;
  association: string;
  tabBarBg: string;
  tabBarBorder: string;
  roleBg: Record<HubRoleType, string>;
};

export const LIGHT_HUB_COLORS: HubColorScheme = {
  background: "#FAF8FF",
  foreground: "#0F172A",
  muted: "#64748B",
  border: "#E8E4F5",
  inputBg: "#FFFFFF",
  cardBg: "#FFFFFF",
  link: "#6366F1",
  primary: "#7C3AED",
  primarySoft: "rgba(99, 102, 241, 0.12)",
  primaryBorder: "rgba(99, 102, 241, 0.35)",
  gradient: ["#6366F1", "#7C3AED", "#A855F7"],
  cardShadow: "rgba(15, 23, 42, 0.06)",
  student: "#6366F1",
  doctor: "#0EA5E9",
  company: COMPANY_COLORS.accent,
  association: ASSOC_COLORS.accent,
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#E8E4F5",
  roleBg: {
    student: "rgba(99, 102, 241, 0.12)",
    doctor: "rgba(14, 165, 233, 0.12)",
    company: COMPANY_COLORS.accentMuted,
    association: ASSOC_COLORS.accentSoft,
  },
};

export const DARK_HUB_COLORS: HubColorScheme = {
  background: "#0B0F17",
  foreground: "#F1F5F9",
  muted: "#94A3B8",
  border: "#2A3140",
  inputBg: "#151A24",
  cardBg: "#121826",
  link: "#A5B4FC",
  primary: "#8B5CF6",
  primarySoft: "rgba(139, 92, 246, 0.2)",
  primaryBorder: "rgba(139, 92, 246, 0.45)",
  gradient: ["#6366F1", "#7C3AED", "#A855F7"],
  cardShadow: "rgba(0, 0, 0, 0.35)",
  student: "#818CF8",
  doctor: "#38BDF8",
  company: COMPANY_COLORS_DARK.accent,
  association: ASSOC_COLORS.accentBar,
  tabBarBg: "#121826",
  tabBarBorder: "#2A3140",
  roleBg: {
    student: "rgba(129, 140, 248, 0.18)",
    doctor: "rgba(56, 189, 248, 0.18)",
    company: COMPANY_COLORS_DARK.accentMuted,
    association: "rgba(249, 115, 22, 0.18)",
  },
};

export function getHubColors(scheme: "light" | "dark"): HubColorScheme {
  return scheme === "dark" ? DARK_HUB_COLORS : LIGHT_HUB_COLORS;
}
