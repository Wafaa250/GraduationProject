import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { PublicOrganizationDiscovery } from "@/api/organizationsApi";
import { AssociationAvatar } from "@/components/organization/AssociationAvatar";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

function formatFollowers(count: number) {
  if (count === 1) return "1 follower";
  return `${count.toLocaleString()} followers`;
}

type Props = {
  org: PublicOrganizationDiscovery;
  isStudent?: boolean;
  followBusy: boolean;
  onToggleFollow?: () => void;
  onOpen: () => void;
};

export function OrganizationDiscoveryCard({
  org,
  isStudent = true,
  followBusy,
  onToggleFollow,
  onOpen,
}: Props) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.cardCover} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <AssociationAvatar name={org.organizationName} logoUrl={org.logoUrl} size="md" />
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {org.organizationName}
            </Text>
            <Text style={styles.cardUsername}>@{org.username}</Text>
            {org.category ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{org.category}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {org.shortDescription ? (
          <Text style={styles.cardDesc} numberOfLines={3}>
            {org.shortDescription}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={styles.followersRow}>
            <Ionicons name="people-outline" size={14} color={assocColors.muted} />
            <Text style={styles.followersText}>{formatFollowers(org.followersCount)}</Text>
          </View>
          {isStudent && onToggleFollow ? (
            <Pressable
              style={[styles.followBtn, org.isFollowing && styles.followBtnActive]}
              onPress={() => onToggleFollow()}
              disabled={followBusy}
            >
              {followBusy ? (
                <ActivityIndicator size="small" color={org.isFollowing ? "#fff" : assocColors.accentDark} />
              ) : (
                <>
                  <Ionicons
                    name={org.isFollowing ? "heart" : "heart-outline"}
                    size={14}
                    color={org.isFollowing ? "#fff" : assocColors.accentDark}
                  />
                  <Text style={[styles.followBtnText, org.isFollowing && styles.followBtnTextActive]}>
                    {org.isFollowing ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
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
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  cardCover: {
    height: 72,
    backgroundColor: assocColors.accentMuted,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
  },
  cardBody: { padding: spacing.lg },
  cardTop: { flexDirection: "row", gap: spacing.md },
  cardMeta: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: assocColors.text },
  cardUsername: { fontSize: 12, color: assocColors.muted, marginTop: 2 },
  categoryPill: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  categoryText: { fontSize: 11, fontWeight: "600", color: assocColors.accentDark },
  cardDesc: { marginTop: spacing.md, fontSize: 13, lineHeight: 19, color: assocColors.muted },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  followersRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  followersText: { fontSize: 12, fontWeight: "600", color: assocColors.muted },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
    minWidth: 100,
    justifyContent: "center",
  },
  followBtnActive: { backgroundColor: assocColors.accent, borderColor: assocColors.accent },
  followBtnText: { fontSize: 12, fontWeight: "700", color: assocColors.accentDark },
  followBtnTextActive: { color: "#fff" },
});
