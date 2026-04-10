import type { CSSProperties } from "react";

export const dash = {
  font: "DM Sans, ui-sans-serif, system-ui, sans-serif",
  fontDisplay: "Syne, ui-sans-serif, system-ui, sans-serif",
  bg: "#f1f5f9",
  surface: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  subtle: "#94a3b8",
  accent: "#4f46e5",
  accentHover: "#4338ca",
  accentSoft: "#eef2ff",
  danger: "#b91c1c",
  dangerSoft: "#fef2f2",
  radiusLg: 14,
  radiusMd: 10,
  shadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06)",
  shadowLg: "0 4px 24px rgba(15,23,42,0.07)",
} as const;

export const cardStyle: CSSProperties = {
  background: dash.surface,
  borderRadius: dash.radiusLg,
  border: `1px solid ${dash.border}`,
  boxShadow: dash.shadow,
};
