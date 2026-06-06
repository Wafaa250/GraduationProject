import { Link2, Share2 } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import type { StudentAssociationProfile } from "@/api/associationApi";
import { AssociationCard } from "@/components/association/AssociationCard";
import { SocialLinksList } from "@/components/association/SocialLinksList";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";

type Props = {
  profile: StudentAssociationProfile;
  followersCount?: number;
};

export function OrganizationProfileReadOnlyView({ profile, followersCount }: Props) {
  const about = profile.description?.trim();
  const hasSocial =
    !!profile.instagramUrl?.trim() ||
    !!profile.facebookUrl?.trim() ||
    !!profile.linkedInUrl?.trim();

  return (
    <View style={styles.stack}>
      {typeof followersCount === "number" ? (
        <Text style={styles.followers}>
          {followersCount} follower{followersCount === 1 ? "" : "s"}
        </Text>
      ) : null}

      <AssociationCard compact>
        <SectionHead icon={Share2} title="About" />
        <Text style={[styles.about, !about ? styles.aboutEmpty : null]}>
          {about || "No description provided yet."}
        </Text>
        <View style={styles.metaGrid}>
          <MetaItem label="Faculty" value={profile.faculty?.trim() || "—"} />
          <MetaItem label="Category" value={profile.category?.trim() || "—"} />
        </View>
      </AssociationCard>

      <AssociationCard compact>
        <SectionHead icon={Link2} title="Social links" />
        {hasSocial ? (
          <SocialLinksList
            instagramUrl={profile.instagramUrl}
            facebookUrl={profile.facebookUrl}
            linkedInUrl={profile.linkedInUrl}
          />
        ) : (
          <Text style={[styles.about, styles.aboutEmpty]}>No social links published yet.</Text>
        )}
      </AssociationCard>
    </View>
  );
}

function SectionHead({ title, icon: Icon }: { title: string; icon: typeof Share2 }) {
  return (
    <View style={associationCardStyles.sectionHead}>
      <View style={associationCardStyles.sectionIcon}>
        <Icon size={16} color={ASSOC_COLORS.accentDark} strokeWidth={2} />
      </View>
      <Text style={associationCardStyles.sectionTitle}>{title}</Text>
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={associationCardStyles.metaLabel}>{label}</Text>
      <Text style={associationCardStyles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: "100%",
    gap: 12,
  },
  followers: {
    fontSize: 14,
    color: ASSOC_COLORS.muted,
    marginBottom: -4,
  },
  about: {
    fontSize: 14,
    lineHeight: 20,
    color: ASSOC_COLORS.foreground,
    marginBottom: 12,
  },
  aboutEmpty: {
    color: ASSOC_COLORS.muted,
    fontStyle: "italic",
  },
  metaGrid: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  metaItem: {
    minWidth: "40%",
    flex: 1,
  },
});
