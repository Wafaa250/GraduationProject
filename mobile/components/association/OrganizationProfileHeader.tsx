import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import type { StudentAssociationProfile } from "@/api/associationApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationAvatar } from "@/components/association/AssociationAvatar";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationCategoryBadge } from "@/components/association/AssociationCategoryBadge";
import { AssociationVerifiedBadge } from "@/components/association/AssociationVerifiedBadge";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  profile: StudentAssociationProfile;
  editing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  eventCount?: number;
  leadershipCount?: number;
};

export function OrganizationProfileHeader({
  profile,
  editing = false,
  onEdit,
  onCancel,
  eventCount = 0,
  leadershipCount = 0,
}: Props) {
  const layout = useResponsiveLayout();
  const faculty = profile.faculty?.trim();
  const category = profile.category?.trim();
  const metaLine = [faculty, category].filter(Boolean).join(" • ");
  const aboutPreview = profile.description?.trim();

  return (
    <AssociationCard flush style={{ marginBottom: 0 }}>
      <LinearGradient
        colors={ASSOC_COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      />

      <View style={[styles.main, { paddingHorizontal: layout.space("md"), paddingBottom: layout.space("md") }]}>
        <View style={styles.topRow}>
          <View style={styles.avatarCol}>
            <AssociationAvatar name={profile.associationName} logoUrl={profile.logoUrl} size="md" />
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.name} numberOfLines={2}>
              {profile.associationName}
            </Text>
            <Text style={styles.handle}>@{profile.username}</Text>
            {metaLine ? <Text style={styles.meta}>{metaLine}</Text> : null}
            <View style={styles.badges}>
              {category ? <AssociationCategoryBadge category={category} /> : null}
              {profile.isVerified ? <AssociationVerifiedBadge /> : null}
            </View>
          </View>
        </View>

        {profile.email ? (
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={14} color={ASSOC_COLORS.muted} />
            <Text style={styles.email} numberOfLines={1}>
              {profile.email}
            </Text>
          </View>
        ) : null}

        {aboutPreview ? (
          <Text style={styles.aboutPreview} numberOfLines={2}>
            {aboutPreview}
          </Text>
        ) : null}

        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            {eventCount} event{eventCount === 1 ? "" : "s"}
          </Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>
            {leadershipCount} leadership
          </Text>
        </View>

        <View style={styles.actions}>
          {!editing && onEdit ? (
            <AssociationActionButton label="Edit profile" compact onPress={onEdit} />
          ) : null}
          {editing && onCancel ? (
            <AssociationActionButton label="Cancel" variant="outline" compact onPress={onCancel} />
          ) : null}
        </View>
      </View>
    </AssociationCard>
  );
}

const styles = StyleSheet.create({
  cover: {
    height: 48,
  },
  main: {
    marginTop: -28,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarCol: {
    paddingTop: 2,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    letterSpacing: -0.3,
  },
  handle: {
    fontSize: 13,
    fontWeight: "600",
    color: ASSOC_COLORS.muted,
  },
  meta: {
    fontSize: 12,
    color: ASSOC_COLORS.muted,
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  email: {
    flex: 1,
    fontSize: 12,
    color: ASSOC_COLORS.muted,
  },
  aboutPreview: {
    fontSize: 13,
    lineHeight: 18,
    color: ASSOC_COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stat: {
    fontSize: 12,
    fontWeight: "600",
    color: ASSOC_COLORS.muted,
  },
  statDot: {
    color: ASSOC_COLORS.border,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    marginTop: 4,
  },
});
