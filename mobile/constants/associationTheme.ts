/**
 * Association mobile palette — hex mirrors web `association-workspace.css` / `assocDash` tokens.
 * Do not spread AUTH_COLORS; association workspace uses orange brand, not auth purple/green.
 */
export const ASSOC_COLORS = {
  /** --aw-shell-bg */
  background: "#F9FAFB",
  /** --aw-surface */
  cardBg: "#FFFFFF",
  /** --aw-border */
  border: "#E5E7EB",
  /** --aw-text */
  foreground: "#0F172A",
  /** --aw-text-secondary */
  textSecondary: "#4B5563",
  /** --aw-muted */
  muted: "#6B7280",
  /** --aw-subtle */
  subtle: "#8B9199",
  /** --aw-label */
  label: "#626A78",
  /** --aw-input-bg */
  inputBg: "#FFFFFF",

  /** --aw-accent */
  accent: "#F97316",
  /** --aw-accent-dark */
  accentDark: "#EA580C",
  /** --aw-accent-muted */
  accentMuted: "#FFF7ED",
  /** --aw-accent-soft */
  accentSoft: "#FFEDD5",
  /** --aw-accent-border */
  accentBorder: "#FDBA74",
  /** --aw-accent-ink */
  accentInk: "#9A3412",
  /** --aw-accent-bar */
  accentBar: "#FB923C",
  /** --aw-nav-active */
  navActive: "#FFF7ED",

  /** --aw-success (semantic — verified badge, not brand accent) */
  success: "#2C9B6B",
  /** --aw-success-muted */
  successMuted: "#E9F7F0",
  /** --aw-success-border */
  successBorder: "#B5D9C5",

  /** --aw-shadow */
  cardShadow: "rgba(15, 23, 42, 0.06)",
  /** --aw-overlay */
  overlay: "rgba(15, 23, 42, 0.42)",

  /** --aw-gradient */
  gradient: ["#F97316", "#EA580C"] as const,
} as const;
