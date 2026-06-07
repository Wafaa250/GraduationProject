/**
 * Company workspace palette — mirrors web `company-workspace.css` copper theme.
 */
export const COMPANY_COLORS = {
  background: "#FAF9F7",
  cardBg: "#FFFFFF",
  surfaceMuted: "#F3F1ED",
  border: "#E8E4DE",
  foreground: "#1F1A17",
  textSecondary: "#5C554E",
  muted: "#8A827A",
  subtle: "#A39B93",

  accent: "#B45309",
  accentDark: "#92400E",
  accentMuted: "#F5EDE6",
  accentSoft: "#FBF4EF",
  accentBorder: "#E8C4A8",
  accentInk: "#7C3A12",
  navActive: "#F5EDE6",

  success: "#2E9B6B",
  successMuted: "#E8F6EF",
  successBorder: "#B5D9C5",
  warning: "#D97706",
  paused: "#D97706",
  pausedMuted: "#FEF3C7",
  closed: "#6B7280",
  closedMuted: "#F3F4F6",

  cardShadow: "rgba(31, 26, 23, 0.08)",
  overlay: "rgba(31, 26, 23, 0.45)",
  gradient: ["#B45309", "#92400E"] as const,
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#E8E4DE",
  primarySoft: "#F5EDE6",
} as const;

export const COMPANY_COLORS_DARK = {
  background: "#141210",
  cardBg: "#1E1B18",
  surfaceMuted: "#262220",
  border: "#3A3530",
  foreground: "#F5F0EB",
  textSecondary: "#C4BBB2",
  muted: "#9A928A",
  subtle: "#7A726A",

  accent: "#D97706",
  accentDark: "#B45309",
  accentMuted: "#2A2218",
  accentSoft: "#332818",
  accentBorder: "#5C4A32",
  accentInk: "#FDBA74",
  navActive: "#2A2218",

  success: "#34D399",
  successMuted: "#142A22",
  successBorder: "#1F4D3A",
  warning: "#FBBF24",
  paused: "#FBBF24",
  pausedMuted: "#2A2410",
  closed: "#9CA3AF",
  closedMuted: "#262626",

  cardShadow: "rgba(0, 0, 0, 0.35)",
  overlay: "rgba(0, 0, 0, 0.6)",
  gradient: ["#D97706", "#B45309"] as const,
  tabBarBg: "#1E1B18",
  tabBarBorder: "#3A3530",
  primarySoft: "#2A2218",
} as const;

export type CompanyColorScheme = {
  background: string;
  cardBg: string;
  surfaceMuted: string;
  border: string;
  foreground: string;
  textSecondary: string;
  muted: string;
  subtle: string;
  accent: string;
  accentDark: string;
  accentMuted: string;
  accentSoft: string;
  accentBorder: string;
  accentInk: string;
  navActive: string;
  success: string;
  successMuted: string;
  successBorder: string;
  warning: string;
  paused: string;
  pausedMuted: string;
  closed: string;
  closedMuted: string;
  cardShadow: string;
  overlay: string;
  gradient: readonly [string, string];
  tabBarBg: string;
  tabBarBorder: string;
  primarySoft: string;
};
