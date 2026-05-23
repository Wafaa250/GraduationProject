import type { CSSProperties } from "react";

/** Lovable-inspired AI-native doctor dashboard tokens (visual only). */
export const dash = {
  font: "DM Sans, ui-sans-serif, system-ui, sans-serif",
  fontDisplay: "Syne, ui-sans-serif, system-ui, sans-serif",
  bg: "#f8f7fc",
  bgDeep: "#f1eff9",
  surface: "rgba(255, 255, 255, 0.88)",
  glass: "rgba(255, 255, 255, 0.72)",
  border: "rgba(124, 58, 237, 0.14)",
  borderSoft: "rgba(148, 163, 184, 0.35)",
  text: "#0f172a",
  muted: "#64748b",
  subtle: "#94a3b8",
  accent: "#7c3aed",
  accentDeep: "#6d28d9",
  accentMuted: "rgba(124, 58, 237, 0.1)",
  accentBorder: "rgba(124, 58, 237, 0.22)",
  success: "#059669",
  successBg: "rgba(16, 185, 129, 0.12)",
  warning: "#d97706",
  warningBg: "rgba(245, 158, 11, 0.12)",
  danger: "#b91c1c",
  dangerBg: "#fef2f2",
  radiusXl: 20,
  radiusLg: 16,
  radiusMd: 12,
  radiusSm: 10,
  shadow: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(99, 102, 241, 0.08)",
  shadowLg: "0 12px 40px rgba(99, 102, 241, 0.14)",
  shadowCard: "0 4px 20px rgba(124, 58, 237, 0.1)",
  gradientPrimary: "linear-gradient(135deg, #6366f1 0%, #9333ea 55%, #c026d3 100%)",
  gradientSoft: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(192, 38, 211, 0.08))",
  headerBlur: "rgba(248, 247, 252, 0.75)",
  /** Descriptive / helper copy (≈ text-sm) */
  textDesc: 14,
  textDescSm: 13,
  textCardTitle: 16,
  textSectionTitle: 18,
  mutedOpacity: 0.92,
} as const;

export const card: CSSProperties = {
  background: dash.glass,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: dash.radiusLg,
  border: `1px solid ${dash.border}`,
  boxShadow: dash.shadow,
};

export const glassCard: CSSProperties = {
  ...card,
  boxShadow: dash.shadowCard,
};

export const gradientBtn: CSSProperties = {
  background: dash.gradientPrimary,
  color: "#fff",
  border: "none",
  borderRadius: dash.radiusSm,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: dash.font,
  boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)",
};

export const secondaryBtn: CSSProperties = {
  background: "rgba(241, 245, 249, 0.9)",
  color: dash.muted,
  border: `1px solid ${dash.borderSoft}`,
  borderRadius: dash.radiusSm,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: dash.font,
};
