import type { HubColorScheme } from "@/constants/hubColorSchemes";
import type { ResponsiveLayout } from "@/hooks/use-responsive-layout";

/** Shared visual tokens for all hub workspaces (student, doctor, company, association). */
export const HUB_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  button: 10,
  pill: 999,
} as const;

export const HUB_BUTTON = {
  height: 36,
  heightSm: 32,
  paddingHorizontal: 14,
  fontSize: 13,
  fontWeight: "600" as const,
  iconSize: 16,
  gap: 6,
} as const;

export const HUB_AVATAR = {
  xs: 32,
  sm: 40,
  md: 44,
  lg: 52,
  xl: 56,
} as const;

export type HubDesign = {
  colors: HubColorScheme;
  layout: ResponsiveLayout;
  radius: typeof HUB_RADIUS;
  button: typeof HUB_BUTTON;
  avatar: {
    header: number;
    feed: number;
    composer: number;
    recommended: number;
  };
  card: {
    padding: number;
    gap: number;
    radius: number;
    marginBottom: number;
  };
  shadow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  type: {
    sectionTitle: { fontSize: number; fontWeight: "700"; letterSpacing: number };
    author: { fontSize: number; fontWeight: "700" };
    body: { fontSize: number; lineHeight: number };
    caption: { fontSize: number; lineHeight: number };
    meta: { fontSize: number; lineHeight: number };
    match: { fontSize: number; fontWeight: "500" };
  };
  icon: { sm: number; md: number; lg: number };
};

export function createHubDesign(colors: HubColorScheme, layout: ResponsiveLayout): HubDesign {
  return {
    colors,
    layout,
    radius: HUB_RADIUS,
    button: HUB_BUTTON,
    avatar: {
      header: layout.scale(HUB_AVATAR.sm),
      feed: layout.scale(HUB_AVATAR.md),
      composer: layout.scale(HUB_AVATAR.sm),
      recommended: layout.scale(HUB_AVATAR.lg),
    },
    card: {
      padding: layout.space("md"),
      gap: layout.space("sm") + 4,
      radius: HUB_RADIUS.lg,
      marginBottom: layout.space("md"),
    },
    shadow: {
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 2,
    },
    type: {
      sectionTitle: {
        fontSize: layout.scale(15),
        fontWeight: "700",
        letterSpacing: 0.2,
      },
      author: { fontSize: layout.scale(15), fontWeight: "700" },
      body: { fontSize: layout.fontSize.body, lineHeight: 22 },
      caption: { fontSize: layout.scale(13), lineHeight: 18 },
      meta: { fontSize: layout.scale(12), lineHeight: 16 },
      match: { fontSize: layout.scale(11), fontWeight: "500" },
    },
    icon: {
      sm: layout.scale(16),
      md: layout.scale(18),
      lg: layout.scale(20),
    },
  };
}
