/**
 * SkillSwap Lovable design tokens (aligned with web design-tokens.css).
 * Visual constants only — use in auth/landing screens.
 */
export const SS = {
  background: "#faf9fc",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e8eaef",
  card: "#ffffff",
  primary: "#3d3280",
  primaryBright: "#7c5ce8",
  primaryForeground: "#ffffff",
  ai: "#9d4edd",
  aiSoft: "#f3e8ff",
  aiSoftBorder: "rgba(157, 78, 221, 0.3)",
  destructive: "#dc2626",
  destructiveBg: "#fef2f2",
  destructiveBorder: "#fecaca",
  gradientPrimary: ["#3d3280", "#8b5cf6"] as const,
  gradientHero: ["#3d3280", "#7c5ce8", "#38bdf8"] as const,
  gradientSurface: ["#eef0fc", "#f8f6ff", "#e8f4fc"] as const,
  shadowGlow: {
    shadowColor: "#3d3280",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  shadowPop: {
    shadowColor: "#1e293b",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  shadowSoft: {
    shadowColor: "#1e293b",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;
