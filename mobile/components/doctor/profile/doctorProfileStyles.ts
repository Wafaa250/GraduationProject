import { Platform, StyleSheet } from "react-native";

import {
  DOCTOR_RADIUS,
  DOCTOR_SPACE,
  doctorCardShadow,
} from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";

/** @deprecated Use DOCTOR_SPACE */
export const PROFILE_SPACE = DOCTOR_SPACE;

export function createDoctorProfileStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingBottom: PROFILE_SPACE.xl + 12,
    },

    /* Cover + sheet (LinkedIn / Teams pattern) */
    cover: {
      height: 132,
    },
    avatarSlot: {
      alignItems: "center",
      marginTop: -54,
      zIndex: 2,
      ...Platform.select({
        android: { elevation: 6 },
        default: {},
      }),
    },
    mainSheet: {
      marginTop: 8,
      borderTopLeftRadius: DOCTOR_RADIUS.xl,
      borderTopRightRadius: DOCTOR_RADIUS.xl,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: 0,
      borderColor: colors.border,
      paddingBottom: PROFILE_SPACE.md,
      ...doctorCardShadow(colors),
    },
    sheetInner: {
      paddingHorizontal: PROFILE_SPACE.lg,
      paddingTop: PROFILE_SPACE.md,
      paddingBottom: PROFILE_SPACE.md,
    },
    avatarRing: {
      borderWidth: 4,
      borderColor: colors.cardBg,
      borderRadius: 999,
      backgroundColor: colors.cardBg,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
        default: {},
      }),
    },
    roleBadge: {
      alignSelf: "center",
      marginTop: PROFILE_SPACE.sm,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.roleBg.doctor,
    },
    roleBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.doctor,
      letterSpacing: 0.7,
    },
    name: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
      letterSpacing: -0.7,
      marginTop: PROFILE_SPACE.sm,
      lineHeight: 32,
    },
    headline: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 21,
    },
    subline: {
      fontSize: 13,
      color: colors.muted,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 18,
      fontWeight: "500",
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: PROFILE_SPACE.md,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: colors.primarySoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primaryBorder,
    },
    chipText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.foreground,
    },
    statsBar: {
      flexDirection: "row",
      marginTop: PROFILE_SPACE.lg,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: PROFILE_SPACE.md,
      paddingHorizontal: PROFILE_SPACE.xs,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: PROFILE_SPACE.sm,
    },
    statValue: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.6,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.muted,
      marginTop: 2,
      textAlign: "center",
      lineHeight: 13,
    },
    actionRow: {
      flexDirection: "row",
      gap: PROFILE_SPACE.sm,
      marginTop: PROFILE_SPACE.lg,
    },
    editBtnWrap: {
      flex: 1,
      borderRadius: DOCTOR_RADIUS.md,
      overflow: "hidden",
      minHeight: 46,
    },
    editBtnGradient: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: PROFILE_SPACE.md,
      minHeight: 46,
    },
    editBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    contactQuickBtn: {
      width: 46,
      minHeight: 46,
      borderRadius: DOCTOR_RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },

    /* Flat sections inside sheet */
    sheetDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: PROFILE_SPACE.lg,
    },
    flatSection: {
      paddingHorizontal: PROFILE_SPACE.lg,
      paddingVertical: PROFILE_SPACE.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      letterSpacing: -0.2,
      marginBottom: PROFILE_SPACE.sm,
    },
    sectionBodyText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.foreground,
    },
    expandBtn: {
      marginTop: PROFILE_SPACE.sm,
      alignSelf: "flex-start",
    },
    expandBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },

    /* Academic list rows */
    infoList: {
      gap: 2,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: PROFILE_SPACE.sm,
      paddingVertical: PROFILE_SPACE.sm,
      minHeight: 44,
    },
    infoIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    infoContent: {
      flex: 1,
      minWidth: 0,
    },
    infoLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.muted,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginTop: 1,
      lineHeight: 19,
    },
    infoEmpty: {
      fontSize: 14,
      fontStyle: "italic",
      color: colors.muted,
      marginTop: 1,
    },

    /* Expertise */
    tagGroup: {
      marginBottom: PROFILE_SPACE.md,
    },
    tagGroupTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      marginBottom: PROFILE_SPACE.sm,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    tagWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    tag: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
    },
    tagText: {
      fontSize: 12,
      fontWeight: "600",
    },
    tagEmpty: {
      fontSize: 13,
      fontStyle: "italic",
      color: colors.muted,
      lineHeight: 19,
    },

    /* Contact tiles */
    contactRow: {
      flexDirection: "row",
      gap: PROFILE_SPACE.sm,
    },
    contactTile: {
      flex: 1,
      alignItems: "center",
      paddingVertical: PROFILE_SPACE.md,
      paddingHorizontal: PROFILE_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      minHeight: 88,
      justifyContent: "center",
    },
    contactTileDisabled: {
      opacity: 0.5,
    },
    contactTileIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: PROFILE_SPACE.sm,
    },
    contactTileLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.foreground,
    },
    contactTileHint: {
      fontSize: 10,
      color: colors.muted,
      marginTop: 2,
    },
    hoursRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: PROFILE_SPACE.sm,
      marginTop: PROFILE_SPACE.sm,
      padding: PROFILE_SPACE.md,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },

    /* Edit form legacy */
    section: {
      marginHorizontal: PROFILE_SPACE.lg,
      marginTop: PROFILE_SPACE.lg,
    },
    sectionCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: PROFILE_SPACE.md,
    },
    sectionDesc: {
      fontSize: 11,
      color: colors.muted,
      marginBottom: PROFILE_SPACE.sm,
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.foreground,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    emptyInline: {
      fontSize: 13,
      fontStyle: "italic",
      color: colors.muted,
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: PROFILE_SPACE.xl,
    },
    stateTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
      marginTop: PROFILE_SPACE.md,
    },
    stateDesc: {
      fontSize: 13,
      color: colors.muted,
      textAlign: "center",
      marginTop: PROFILE_SPACE.sm,
      lineHeight: 19,
    },
    retryBtn: {
      marginTop: PROFILE_SPACE.lg,
      paddingHorizontal: PROFILE_SPACE.lg,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      minHeight: 44,
      justifyContent: "center",
    },
    retryText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
  });
}
