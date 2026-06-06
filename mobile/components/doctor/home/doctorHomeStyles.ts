import { Platform, StyleSheet } from "react-native";

import {
  DOCTOR_RADIUS,
  DOCTOR_SPACE,
  doctorCardShadow,
} from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";

/** @deprecated Use DOCTOR_SPACE from doctorDesignSystem */
export const HOME_SPACE = DOCTOR_SPACE;

export const STAT_CHIP_WIDTH = 120;

export function createDoctorHomeStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: HOME_SPACE.lg,
      paddingTop: HOME_SPACE.sm,
      paddingBottom: HOME_SPACE.xl,
    },
    hero: {
      borderRadius: DOCTOR_RADIUS.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primaryBorder,
      overflow: "hidden",
      marginBottom: HOME_SPACE.lg,
      ...doctorCardShadow(colors),
    },
    heroInner: {
      padding: HOME_SPACE.lg,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarRing: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.cardBg,
      alignItems: "center",
      justifyContent: "center",
    },
    rolePill: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.roleBg.doctor,
      marginTop: 6,
    },
    rolePillText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.doctor,
      letterSpacing: 0.6,
    },
    iconButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
      fontWeight: "500",
    },
    seeAll: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },
    seeAllPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: colors.primarySoft,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: HOME_SPACE.sm,
      gap: HOME_SPACE.sm,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: HOME_SPACE.sm,
      flex: 1,
    },
    sectionIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    countBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySoft,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.primary,
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
    },
    cardShadow: doctorCardShadow(colors),
    statChip: {
      width: STAT_CHIP_WIDTH,
      minHeight: 118,
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: HOME_SPACE.md,
      paddingHorizontal: HOME_SPACE.md,
    },
    statIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 56,
    },
    inlineEmpty: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: "500",
      paddingVertical: HOME_SPACE.sm,
    },
    alertBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(245, 158, 11, 0.12)",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(245, 158, 11, 0.25)",
      paddingVertical: HOME_SPACE.md,
      paddingHorizontal: HOME_SPACE.md,
      marginBottom: HOME_SPACE.lg,
      gap: HOME_SPACE.sm,
    },
    alertText: {
      flex: 1,
      fontSize: 13,
      color: colors.foreground,
      lineHeight: 18,
    },
    alertBold: {
      fontWeight: "800",
      color: "#D97706",
    },
    alertAction: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: HOME_SPACE.xl,
      paddingHorizontal: HOME_SPACE.lg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    emptyIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: HOME_SPACE.md,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
    },
    emptyDesc: {
      fontSize: 13,
      color: colors.muted,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 18,
    },
    emptyAction: {
      marginTop: HOME_SPACE.md,
      paddingHorizontal: HOME_SPACE.lg,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
    },
    emptyActionText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },
    pill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: "flex-start",
    },
    pillText: {
      fontSize: 11,
      fontWeight: "600",
    },
  });
}
