import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getAssociationProfile,
  type StudentAssociationProfile,
} from "@/api/associationApi";
import { AssociationAvatar } from "@/components/organization/AssociationAvatar";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { SocialLinksRow } from "@/components/organization/SocialLinksRow";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { clearSession } from "@/utils/authStorage";

export default function OrganizationProfileScreen() {
  const layout = useResponsiveLayout();
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssociationProfile();
      setProfile(data);
    } catch (e) {
      console.warn(parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await clearSession();
    router.replace("/login" as Href);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader
        title="Organization profile"
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => void logout()} hitSlop={10} accessibilityLabel="Log out">
            <Ionicons name="log-out-outline" size={22} color={assocColors.accentDark} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxxl,
        }}
      >
        {loading || !profile ? (
          <View style={styles.center}>
            <ActivityIndicator color={assocColors.accent} size="large" />
            <Text style={styles.muted}>Loading profile…</Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <AssociationAvatar name={profile.associationName} logoUrl={profile.logoUrl} size="lg" />
              <Text style={styles.name}>{profile.associationName}</Text>
              <Text style={styles.handle}>@{profile.username}</Text>
              <View style={styles.badgeRow}>
                {profile.category ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{profile.category}</Text>
                  </View>
                ) : null}
                {profile.isVerified ? (
                  <View style={styles.verified}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                ) : null}
              </View>
              {profile.faculty ? <Text style={styles.faculty}>{profile.faculty}</Text> : null}
            </View>

            {profile.description?.trim() ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>About</Text>
                <Text style={styles.body}>{profile.description.trim()}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Social</Text>
              <SocialLinksRow
                instagramUrl={profile.instagramUrl}
                facebookUrl={profile.facebookUrl}
                linkedInUrl={profile.linkedInUrl}
              />
              {!profile.instagramUrl?.trim() &&
              !profile.facebookUrl?.trim() &&
              !profile.linkedInUrl?.trim() ? (
                <Text style={styles.muted}>No social links yet. Add them when you edit your profile.</Text>
              ) : null}
            </View>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.push("/organization/team-members" as Href)}
            >
              <Ionicons name="people-outline" size={18} color={assocColors.accentDark} />
              <Text style={styles.secondaryTxt}>Leadership team showcase</Text>
            </Pressable>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push("/organization/profile/edit" as Href)}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
              <Text style={styles.primaryTxt}>Edit profile</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { paddingVertical: 40, alignItems: "center" },
  muted: { marginTop: 8, color: assocColors.muted, fontSize: 14, fontWeight: "600" },
  hero: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  name: {
    marginTop: spacing.md,
    fontSize: 22,
    fontWeight: "900",
    color: assocColors.text,
    textAlign: "center",
  },
  handle: { marginTop: 4, fontSize: 14, color: assocColors.muted, fontWeight: "600" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.md },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  badgeText: { fontSize: 12, fontWeight: "800", color: assocColors.accentDark },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  verifiedText: { fontSize: 12, fontWeight: "800", color: "#047857" },
  faculty: { marginTop: spacing.sm, fontSize: 14, color: assocColors.text, fontWeight: "600", textAlign: "center" },
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: assocColors.text, marginBottom: spacing.sm },
  body: { fontSize: 15, lineHeight: 22, color: assocColors.text, fontWeight: "500" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    shadowColor: assocColors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryTxt: { color: "#fff", fontSize: 16, fontWeight: "900" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
    marginBottom: spacing.md,
  },
  secondaryTxt: { color: assocColors.accentDark, fontSize: 15, fontWeight: "800" },
});
