import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import type { PublicLeadershipTeamMember } from "@/api/publicOrganizationsApi";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

function openUrl(url: string) {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  void Linking.openURL(u);
}

type Props = {
  member: PublicLeadershipTeamMember;
};

export function LeadershipMemberPublicCard({ member }: Props) {
  const img = resolveApiFileUrl(member.imageUrl ?? undefined);
  const initial = member.fullName.trim().charAt(0).toUpperCase() || "?";
  const li = member.linkedInUrl?.trim();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {img ? (
          <Image source={{ uri: img }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPh}>
            <Text style={styles.avatarPhTxt}>{initial}</Text>
          </View>
        )}
        <View style={styles.textCol}>
          <Text style={styles.name} numberOfLines={2}>
            {member.fullName}
          </Text>
          <Text style={styles.role} numberOfLines={2}>
            {member.roleTitle}
          </Text>
        </View>
      </View>
      {member.major?.trim() ? (
        <Text style={styles.major} numberOfLines={2}>
          {member.major.trim()}
        </Text>
      ) : null}
      {li ? (
        <Pressable
          style={styles.liBtn}
          onPress={() => openUrl(li)}
          accessibilityRole="link"
          accessibilityLabel={`${member.fullName} on LinkedIn`}
        >
          <Ionicons name="logo-linkedin" size={18} color={assocColors.accentDark} />
          <Text style={styles.liTxt}>LinkedIn</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: assocColors.bg,
    borderWidth: 2,
    borderColor: assocColors.accentBorder,
  },
  avatarPh: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 2,
    borderColor: assocColors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPhTxt: { fontSize: 22, fontWeight: "900", color: assocColors.accentDark },
  textCol: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: "900", color: assocColors.text, lineHeight: 22 },
  role: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: assocColors.accent,
    lineHeight: 18,
  },
  major: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: assocColors.muted,
    fontWeight: "600",
    lineHeight: 18,
  },
  liBtn: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.bg,
  },
  liTxt: { fontSize: 13, fontWeight: "800", color: assocColors.accentDark },
});
