import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  getPublicOrganization,
  type PublicLeadershipTeamMember,
  type PublicStudentOrganizationProfile,
} from "@/api/publicOrganizationsApi";
import { OrgEventCard } from "@/components/organization/OrgEventCard";
import { LeadershipMemberPublicCard } from "@/components/organization/LeadershipMemberPublicCard";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { SocialLinksRow } from "@/components/organization/SocialLinksRow";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { StudentOrganizationEvent } from "@/api/organizationEventsApi";

function mapSummaryToOrgEvent(
  orgId: number,
  orgName: string,
  logo: string | null | undefined,
  s: PublicStudentOrganizationProfile["upcomingEvents"][0],
): StudentOrganizationEvent {
  return {
    id: s.id,
    organizationProfileId: orgId,
    title: s.title,
    description: "",
    eventType: s.eventType,
    category: s.category,
    location: s.location,
    isOnline: s.isOnline,
    eventDate: s.eventDate,
    registrationDeadline: null,
    coverImageUrl: s.coverImageUrl,
    maxParticipants: null,
    createdAt: s.eventDate,
    updatedAt: null,
    organizationName: orgName,
    organizationLogoUrl: logo,
  };
}

export default function PublicOrganizationProfileScreen() {
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const layout = useResponsiveLayout();
  const orgId = Number(organizationId);
  const [profile, setProfile] = useState<PublicStudentOrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(orgId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getPublicOrganization(orgId);
      setProfile(data);
    } catch (e) {
      console.warn(parseApiErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const leadershipTeam: PublicLeadershipTeamMember[] = profile?.leadershipTeam ?? [];
  const logo = profile ? resolveApiFileUrl(profile.logoUrl ?? undefined) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader
        title="Student Organization"
        subtitle="SkillSwap"
        onBack={() => router.back()}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={assocColors.accent} />
        </View>
      ) : !profile ? (
        <Text style={styles.err}>Organization not found.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: spacing.xxxl,
            paddingTop: spacing.md,
          }}
        >
          <View style={styles.hero}>
            <View style={styles.heroBg} />
            <View style={styles.heroInner}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logoImg} contentFit="cover" />
              ) : (
                <View style={styles.logoPh}>
                  <Text style={styles.logoPhTxt}>
                    {profile.organizationName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.orgTitle}>{profile.organizationName}</Text>
                {profile.faculty ? (
                  <Text style={styles.faculty}>{profile.faculty}</Text>
                ) : null}
                <View style={styles.badgeRow}>
                  {profile.category ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>{profile.category}</Text>
                    </View>
                  ) : null}
                  {profile.isVerified ? (
                    <View style={styles.ver}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.verTxt}>Verified</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <Text style={styles.followers}>
              {profile.followersCount} follower{profile.followersCount === 1 ? "" : "s"} · Community
              on SkillSwap
            </Text>
          </View>

          {profile.description?.trim() ? (
            <View style={styles.card}>
              <Text style={styles.cardH}>About</Text>
              <Text style={styles.body}>{profile.description.trim()}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardH}>Connect</Text>
            <SocialLinksRow
              instagramUrl={profile.instagramUrl}
              facebookUrl={profile.facebookUrl}
              linkedInUrl={profile.linkedInUrl}
            />
            {!profile.instagramUrl?.trim() &&
            !profile.facebookUrl?.trim() &&
            !profile.linkedInUrl?.trim() ? (
              <Text style={styles.muted}>No public social links yet.</Text>
            ) : null}
          </View>

          {leadershipTeam.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardH}>Leadership team</Text>
              <Text style={styles.leadSub}>
                Meet the student leaders and coordinators for this organization. Listed here for visibility only—not
                SkillSwap admin accounts.
              </Text>
              {leadershipTeam.map((m) => (
                <LeadershipMemberPublicCard key={m.id} member={m} />
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionH}>Upcoming events</Text>
          {profile.upcomingEvents.length === 0 ? (
            <Text style={styles.muted}>No upcoming events published.</Text>
          ) : (
            profile.upcomingEvents.map((s) => (
              <OrgEventCard
                key={s.id}
                event={mapSummaryToOrgEvent(
                  orgId,
                  profile.organizationName,
                  profile.logoUrl,
                  s,
                )}
                onPress={() =>
                  router.push(`/public-organizations/${orgId}/events/${s.id}` as Href)
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { textAlign: "center", marginTop: 24, color: assocColors.muted },
  hero: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  heroBg: {
    height: 72,
    backgroundColor: assocColors.accentMuted,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.accentBorder,
  },
  heroInner: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    alignItems: "center",
    marginTop: -40,
  },
  logoImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: assocColors.surface,
    backgroundColor: assocColors.bg,
  },
  logoPh: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: assocColors.surface,
    backgroundColor: assocColors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPhTxt: { fontSize: 22, fontWeight: "900", color: assocColors.accentDark },
  orgTitle: { fontSize: 22, fontWeight: "900", color: assocColors.text, lineHeight: 28 },
  faculty: { marginTop: 4, fontSize: 14, color: assocColors.muted, fontWeight: "600" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  badgeTxt: { fontSize: 12, fontWeight: "800", color: assocColors.accentDark },
  ver: {
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
  verTxt: { fontSize: 12, fontWeight: "800", color: "#047857" },
  followers: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    fontSize: 13,
    color: assocColors.muted,
    fontWeight: "600",
  },
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardH: { fontSize: 16, fontWeight: "900", color: assocColors.text, marginBottom: spacing.sm },
  leadSub: {
    fontSize: 13,
    lineHeight: 19,
    color: assocColors.muted,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  body: { fontSize: 15, lineHeight: 22, color: assocColors.text, fontWeight: "500" },
  muted: { fontSize: 14, color: assocColors.muted, fontWeight: "500", marginTop: spacing.sm },
  sectionH: {
    fontSize: 18,
    fontWeight: "900",
    color: assocColors.text,
    marginBottom: spacing.md,
  },
});
