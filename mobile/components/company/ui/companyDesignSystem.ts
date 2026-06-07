import { Platform, StyleSheet, type ViewStyle } from "react-native";

import type { CompanyColorScheme } from "@/constants/companyTheme";

export const COMPANY_SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const COMPANY_RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export function companyCardShadow(colors: CompanyColorScheme): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle;
}

export function companyElevatedShadow(colors: CompanyColorScheme): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle;
}

export function companyScreenStyle(colors: CompanyColorScheme): ViewStyle {
  return {
    flex: 1,
    backgroundColor: colors.background,
  };
}

export function companyCardStyle(colors: CompanyColorScheme): ViewStyle {
  return {
    backgroundColor: colors.cardBg,
    borderRadius: COMPANY_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...companyCardShadow(colors),
  };
}
