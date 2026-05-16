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
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { clearSession, getItem } from "@/utils/authStorage";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function OrganizationDashboardScreen() {
  const layout = useResponsiveLayout();
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackName, setFallbackName] = useState("");

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
    void (async () => {
      setFallbackName(((await getItem("name")) ?? "").trim());
    })();
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await clearSession();
    router.replace("/login" as Href);
  };

  const name = profile?.associationName || fallbackName || "Organization";

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader
        title="Organization hub"
        subtitle="Student Organization"
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
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={assocColors.accent} size="large" />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroRow}>
                <AssociationAvatar name={name} logoUrl={profile?.logoUrl} size="lg" />
                <View style={styles.heroText}>
                  <Text style={styles.heroKicker}>Welcome back</Text>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {name}
                  </Text>
                  {profile?.faculty ? (
                    <Text style={styles.heroMuted}>{profile.faculty}</Text>
                  ) : null}
                  <View style={styles.badgeRow}>
                    {profile?.category ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{profile.category}</Text>
                      </View>
                    ) : null}
                    {profile?.isVerified ? (
                      <View style={styles.badgeVerified}>
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                        <Text style={styles.badgeVerifiedText}>Verified</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
              <Text style={styles.heroCopy}>
                Your organization hub on SkillSwap. Keep your profile current so students can discover your
                community.
              </Text>
            </View>

            <ProfileSummary profile={profile} />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quick actions</Text>
              <Text style={styles.cardSub}>Shortcuts to key organization tools</Text>
              <QuickAction
                icon="calendar-outline"
                title="Create event"
                desc="Set up a new workshop, hackathon, or gathering"
                onPress={() => router.push("/organization/events/create" as Href)}
              />
              <QuickAction
                icon="albums-outline"
                title="My events"
                desc="View and manage your organization events"
                onPress={() => router.push("/organization/events" as Href)}
              />
              <QuickAction
                icon="people-outline"
                title="Leadership team"
                desc="Showcase coordinators on your public profile"
                onPress={() => router.push("/organization/team-members" as Href)}
              />
              <QuickAction
                icon="megaphone-outline"
                title="Recruitment campaigns"
                desc="Publish open positions with custom role titles"
                onPress={() => router.push("/organization/recruitment-campaigns" as Href)}
              />
              <QuickAction
                icon="sparkles-outline"
                title="Discovery"
                desc="Discover students based on skills and interests"
                disabled
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileSummary({ profile }: { profile: StudentAssociationProfile | null }) {
  if (!profile) {
    return (
      <View style={styles.card}>
        <Text style={styles.muted}>Complete your profile to show students who you are.</Text>
        <Pressable style={styles.linkBtn} onPress={() => router.push("/organization/profile" as Href)}>
          <Text style={styles.linkBtnText}>Go to profile →</Text>
        </Pressable>
      </View>
    );
  }

  const about = profile.description?.trim();

  return (
    <View style={styles.card}>
      <View style={styles.sumRow}>
        <AssociationAvatar name={profile.associationName} logoUrl={profile.logoUrl} size="md" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle}>Profile summary</Text>
          <Text style={styles.cardSub}>@{profile.username}</Text>
        </View>
      </View>
      <SummaryRow label="Faculty" value={profile.faculty ?? "—"} />
      <SummaryRow label="Category" value={profile.category ?? "—"} />
      <SummaryRow label="About" value={about || "Add a short description on your profile."} />
      <Pressable style={styles.linkBtn} onPress={() => router.push("/organization/profile" as Href)}>
        <Text style={styles.linkBtnText}>View profile →</Text>
      </Pressable>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumBlock}>
      <Text style={styles.sumLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.sumValue}>{value}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  desc,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.actionRow,
        disabled && { opacity: 0.55 },
        pressed && !disabled && { opacity: 0.92 },
      ]}
      disabled={disabled}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={assocColors.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { paddingVertical: spacing.xxl, alignItems: "center" },
  loadingText: { marginTop: spacing.md, color: assocColors.muted, fontWeight: "600" },
  hero: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  heroText: { flex: 1, minWidth: 0 },
  heroKicker: {
    fontSize: 12,
    fontWeight: "800",
    color: assocColors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "900",
    color: assocColors.text,
    lineHeight: 30,
  },
  heroMuted: { marginTop: 6, fontSize: 14, color: assocColors.muted, fontWeight: "500" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  badgeText: { fontSize: 12, fontWeight: "800", color: assocColors.accentDark },
  badgeVerified: {
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
  badgeVerifiedText: { fontSize: 12, fontWeight: "800", color: "#047857" },
  heroCopy: {
    marginTop: spacing.lg,
    fontSize: 14,
    lineHeight: 20,
    color: assocColors.muted,
  },
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: "900", color: assocColors.text },
  cardSub: { marginTop: 4, fontSize: 13, color: assocColors.muted, fontWeight: "500" },
  muted: { fontSize: 14, color: assocColors.muted, lineHeight: 20 },
  linkBtn: { marginTop: spacing.md, alignSelf: "flex-start", paddingVertical: 6 },
  linkBtnText: { fontSize: 14, fontWeight: "800", color: assocColors.accentDark },
  sumRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  sumBlock: { marginTop: spacing.sm },
  sumLabel: { fontSize: 11, fontWeight: "800", color: assocColors.subtle, letterSpacing: 0.4 },
  sumValue: { marginTop: 4, fontSize: 14, color: assocColors.text, lineHeight: 20, fontWeight: "500" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 15, fontWeight: "800", color: assocColors.text },
  actionDesc: { marginTop: 4, fontSize: 12, color: assocColors.muted, lineHeight: 18 },
});
