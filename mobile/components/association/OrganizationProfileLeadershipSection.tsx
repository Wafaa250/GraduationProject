import { router, type Href } from "expo-router";
import { UsersRound } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { LeadershipProfileCard } from "@/components/association/LeadershipProfileCard";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { ASSOCIATION_ROUTES } from "@/lib/associationRoutes";
import type { OrganizationProfileLeadershipMember } from "@/lib/organizationProfileData";

type Props = {
  organizationName: string;
  members: OrganizationProfileLeadershipMember[];
  loading: boolean;
};

export function OrganizationProfileLeadershipSection({
  organizationName,
  members,
  loading,
}: Props) {
  if (!loading && members.length === 0) {
    return (
      <AssociationCard compact>
        <Text style={associationCardStyles.sectionTitle}>Leadership board</Text>
        <Text style={styles.muted}>
          Add leadership members to showcase your team on your public profile.
        </Text>
        <View style={{ marginTop: 12, alignSelf: "flex-start" }}>
          <AssociationActionButton
            label="Manage leadership board"
            onPress={() => router.push(ASSOCIATION_ROUTES.leadership as Href)}
            icon={<UsersRound size={15} color="#FFFFFF" strokeWidth={2.25} />}
          />
        </View>
      </AssociationCard>
    );
  }

  return (
    <View style={{ width: "100%", gap: 10 }}>
      <View style={styles.head}>
        <Text style={styles.sectionTitleLarge}>Leadership board</Text>
        <AssociationActionButton
          label="Manage board"
          variant="outline"
          compact
          onPress={() => router.push(ASSOCIATION_ROUTES.leadership as Href)}
          icon={<UsersRound size={14} color={ASSOC_COLORS.accentDark} strokeWidth={2.25} />}
        />
      </View>

      {loading ? (
        <Text style={styles.muted}>Loading leadership…</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {members.map((member) => (
            <LeadershipProfileCard
              key={member.id}
              fullName={member.fullName}
              roleTitle={member.roleTitle}
              major={member.major}
              imageUrl={member.imageUrl}
              linkedInUrl={member.linkedInUrl}
              organizationName={organizationName}
              preview
              compact
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitleLarge: {
    fontSize: 18,
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
    letterSpacing: -0.2,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    color: ASSOC_COLORS.muted,
    marginTop: 6,
  },
});
