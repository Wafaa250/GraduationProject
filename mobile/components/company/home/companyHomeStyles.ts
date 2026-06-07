import { StyleSheet } from "react-native";

import {
  COMPANY_RADIUS,
  COMPANY_SPACE,
  companyCardShadow,
} from "@/components/company/ui/companyDesignSystem";
import type { CompanyColorScheme } from "@/constants/companyTheme";

export const HOME_SPACE = COMPANY_SPACE;

export function createCompanyHomeStyles(colors: CompanyColorScheme) {
  return StyleSheet.create({
    scroll: {
      paddingHorizontal: HOME_SPACE.lg,
      paddingTop: HOME_SPACE.lg,
      paddingBottom: HOME_SPACE.xxxl,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: HOME_SPACE.md,
      gap: HOME_SPACE.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 3,
      fontWeight: "500",
      lineHeight: 18,
    },
    seeAll: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.accent,
    },
    seeAllPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: COMPANY_RADIUS.pill,
      backgroundColor: colors.accentSoft,
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: COMPANY_RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
      ...companyCardShadow(colors),
    },
    cardShadow: companyCardShadow(colors),
    iconButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: COMPANY_RADIUS.md,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    primaryBtnCompact: {
      alignSelf: "flex-start",
      paddingVertical: 11,
      paddingHorizontal: 16,
    },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.cardBg,
      borderRadius: COMPANY_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    secondaryBtnText: {
      color: colors.foreground,
      fontSize: 15,
      fontWeight: "600",
    },
    outlineBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: COMPANY_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    outlineBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
  });
}
