import { StyleSheet, Text, View } from "react-native";

import type { PublicOrganizationMember } from "@/api/publicProfilesApi";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { ASSOC_COLORS } from "@/constants/associationTheme";

type Props = {
  members: PublicOrganizationMember[];
  loading?: boolean;
};

/** Mirrors WEB OrganizationProfileContent MembersSection. */
export function OrganizationProfileMembersSection({ members, loading = false }: Props) {
  if (loading) {
    return (
      <AssociationCard compact>
        <Text style={styles.title}>Members</Text>
        <AssociationLoadingState message="Loading members…" />
      </AssociationCard>
    );
  }

  if (members.length === 0) return null;

  return (
    <AssociationCard compact>
      <Text style={styles.title}>Members</Text>
      <View style={styles.list}>
        {members.map((member) => (
          <Text key={`${member.studentUserId}-${member.roleTitle}`} style={styles.line}>
            <Text style={styles.name}>{member.studentName}</Text>
            {member.roleTitle ? <Text style={styles.meta}> · {member.roleTitle}</Text> : null}
            {member.major ? <Text style={styles.meta}> · {member.major}</Text> : null}
          </Text>
        ))}
      </View>
    </AssociationCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    marginBottom: 10,
  },
  list: { gap: 8 },
  line: { fontSize: 14, lineHeight: 20 },
  name: { fontWeight: "700", color: ASSOC_COLORS.foreground },
  meta: { color: ASSOC_COLORS.muted },
});
