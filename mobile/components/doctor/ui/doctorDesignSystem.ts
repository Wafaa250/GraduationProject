import { Platform, StyleSheet, type ViewStyle } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";

/** Shared spacing for all doctor hub screens. */
export const DOCTOR_SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Consistent corner radii across doctor UI. */
export const DOCTOR_RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export function doctorCardShadow(colors: HubColorScheme): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 10,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle;
}

export function doctorElevatedShadow(colors: HubColorScheme): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle;
}

export function doctorScreenStyle(colors: HubColorScheme): ViewStyle {
  return {
    flex: 1,
    backgroundColor: colors.background,
  };
}

export function doctorCardStyle(colors: HubColorScheme): ViewStyle {
  return {
    backgroundColor: colors.cardBg,
    borderRadius: DOCTOR_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...doctorCardShadow(colors),
  };
}

export function doctorInsetCardStyle(colors: HubColorScheme): ViewStyle {
  return {
    backgroundColor: colors.cardBg,
    borderRadius: DOCTOR_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  };
}

export function doctorTypography(colors: HubColorScheme) {
  return {
    screenTitle: {
      fontSize: 28,
      fontWeight: "800" as const,
      letterSpacing: -0.6,
      color: colors.foreground,
    },
    screenSubtitle: {
      fontSize: 14,
      fontWeight: "500" as const,
      lineHeight: 20,
      color: colors.muted,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "700" as const,
      letterSpacing: -0.2,
      color: colors.foreground,
    },
    sectionSubtitle: {
      fontSize: 13,
      fontWeight: "500" as const,
      color: colors.muted,
      marginTop: 2,
    },
    body: {
      fontSize: 15,
      fontWeight: "400" as const,
      lineHeight: 22,
      color: colors.foreground,
    },
    caption: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.muted,
    },
  };
}
