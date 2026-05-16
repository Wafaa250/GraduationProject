import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import type { PublicRecruitmentCampaignSummary } from "@/api/organizationRecruitmentCampaignsApi";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { formatEventDate } from "@/utils/eventFormUtils";

type Props = {
  campaign: PublicRecruitmentCampaignSummary;
  onPress?: () => void;
};

export function PublicRecruitmentCampaignCard({ campaign, onPress }: Props) {
  const cover = resolveApiFileUrl(campaign.coverImageUrl ?? undefined);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.cardPressed]}
      disabled={!onPress}
    >
      <View style={styles.coverWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="megaphone-outline" size={28} color={assocColors.accent} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <Ionicons name="people-outline" size={14} color={assocColors.accentDark} />
          <Text style={styles.badgeText}>
            {campaign.openPositionsCount} open position{campaign.openPositionsCount === 1 ? "" : "s"}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {campaign.title}
        </Text>
        <Text style={styles.meta}>Apply by {formatEventDate(campaign.applicationDeadline)}</Text>
        {onPress ? (
          <View style={styles.viewRow}>
            <Ionicons name="eye-outline" size={16} color={assocColors.accentDark} />
            <Text style={styles.viewTxt}>View campaign</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
    elevation: 2,
  },
  cardPressed: { opacity: 0.96 },
  coverWrap: {},
  cover: { width: "100%", height: 110, backgroundColor: assocColors.bg },
  coverPlaceholder: {
    width: "100%",
    height: 110,
    backgroundColor: assocColors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing.md },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: assocColors.accentDark },
  title: { fontSize: 16, fontWeight: "800", color: assocColors.text, lineHeight: 22 },
  meta: { marginTop: 6, fontSize: 13, color: assocColors.muted, fontWeight: "500" },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  viewTxt: { fontSize: 13, fontWeight: "700", color: assocColors.accentDark },
});
