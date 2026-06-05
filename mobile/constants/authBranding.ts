import type { SpacingKey } from "@/constants/responsiveLayout";

/** Single auth logo lockup — matches web `BrandLogo` full variant on auth screens. */
export const AUTH_BRANDING = {
  /** Orb mark size in px at baseline width (web `authMobile` / forgot-password flow). */
  logoMarkSize: 44,
  /** Gap between mark and wordmark (~`gap-1.5` / 6px). */
  logoGap: 6,
  /** Wordmark font size in px (~`text-lg`). */
  logoWordmarkSize: 18,
  logoMarginBottom: "xl" as SpacingKey,
  /** Content padding below safe area — identical on every auth screen. */
  screenPaddingTop: "xxl" as SpacingKey,
  screenPaddingTopCompact: "xl" as SpacingKey,
  screenPaddingBottom: "xxxl" as SpacingKey,
} as const;
