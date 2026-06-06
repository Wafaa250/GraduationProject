import { StyleSheet } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";

/** Shared association card tokens — compact, clear borders, premium SaaS feel. */
export const ASSOC_CARD = {
  radius: 12,
  radiusLg: 14,
  padding: 14,
  paddingCompact: 12,
  gap: 10,
  borderWidth: 1,
} as const;

export const associationCardStyles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: ASSOC_COLORS.cardBg,
    borderWidth: ASSOC_CARD.borderWidth,
    borderColor: ASSOC_COLORS.border,
    borderRadius: ASSOC_CARD.radius,
    padding: ASSOC_CARD.padding,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompact: {
    padding: ASSOC_CARD.paddingCompact,
    borderRadius: ASSOC_CARD.radius,
  },
  cardFlush: {
    padding: 0,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: ASSOC_COLORS.muted,
    marginTop: 2,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ASSOC_COLORS.accentSoft,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: ASSOC_COLORS.muted,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: ASSOC_COLORS.foreground,
    marginTop: 2,
  },
});
