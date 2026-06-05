/** Reference width (iPhone 14 / 15). Values scale relative to this baseline. */
export const BASE_WIDTH = 390;

/** Minimum readable scale on very small devices (e.g. iPhone SE). */
export const MIN_SCALE = 0.88;

/** Maximum scale on large phones and small tablets in portrait. */
export const MAX_SCALE = 1.12;

export const TABLET_MIN_WIDTH = 768;

export const CONTENT_MAX_WIDTH = 480;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export type DeviceSize = "small" | "medium" | "large" | "tablet";

export type SpacingKey = keyof typeof SPACING;

export function getDeviceSize(width: number): DeviceSize {
  if (width >= TABLET_MIN_WIDTH) return "tablet";
  if (width < 360) return "small";
  if (width < 414) return "medium";
  return "large";
}

export function clampScale(width: number): number {
  const raw = width / BASE_WIDTH;
  return Math.min(Math.max(raw, MIN_SCALE), MAX_SCALE);
}

export function scaleSize(base: number, width: number): number {
  return Math.round(base * clampScale(width));
}

export function horizontalPaddingForWidth(width: number): number {
  const deviceSize = getDeviceSize(width);

  if (deviceSize === "tablet") {
    return Math.max(SPACING.xxl, width * 0.08);
  }

  if (deviceSize === "small") {
    return Math.max(SPACING.lg, width * 0.05);
  }

  return Math.max(SPACING.xl, width * 0.06);
}
