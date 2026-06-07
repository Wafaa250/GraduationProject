import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import type { StudentAssociationProfile } from "@/api/associationApi";
import type { PublicRecruitmentCampaignSummary } from "@/api/recruitmentCampaignsApi";
import { listPublicRecruitmentCampaigns } from "@/api/recruitmentCampaignsApi";
import { OrganizationVisitorSections } from "@/components/public-profile/OrganizationVisitorSections";
import { PublicProfileHero } from "@/components/public-profile/PublicProfileHero";
import { SocialLinksList } from "@/components/association/SocialLinksList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import {
  loadVisitorOrganizationProfile,
  type OrganizationProfileExtras,
} from "@/lib/organizationProfileData";

export default function PublicOrganizationProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null);
  const [extras, setExtras] = useState<OrganizationProfileExtras | null>(null);
  const [campaigns, setCampaigns] = useState<PublicRecruitmentCampaignSummary[]>([]);
  const organizationId = Number(id);

  useEffect(() => {
    if (!Number.isFinite(organizationId) || organizationId <= 0) {
      setError("Invalid organization profile.");
      setLoading(false);
      setLoadingCampaigns(false);
      return;
    }
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const bundle = await loadVisitorOrganizationProfile(organizationId);
        setProfile(bundle.profile);
        setExtras(bundle.extras);
      } catch (err) {
        setProfile(null);
        setExtras(null);
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();

    void (async () => {
      setLoadingCampaigns(true);
      try {
        setCampaigns(await listPublicRecruitmentCampaigns(organizationId));
      } catch {
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    })();
  }, [organizationId]);

  if (loading) {
    return (
      <PublicProfileShell title="Organization Profile" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !profile || !extras) {
    return (
      <PublicProfileShell title="Organization Profile" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </PublicProfileShell>
    );
  }

  const hasSocial =
    !!profile.instagramUrl?.trim() ||
    !!profile.facebookUrl?.trim() ||
    !!profile.linkedInUrl?.trim();

  return (
    <PublicProfileShell title={profile.associationName} fallbackHref="/feed">
      <ScrollView contentContainerStyle={styles.scroll}>
        <PublicProfileHero
          name={profile.associationName}
          subtitle={[profile.category, profile.faculty].filter(Boolean).join(" · ") || undefined}
          metaLines={
            typeof extras.followersCount === "number"
              ? [`${extras.followersCount} follower${extras.followersCount === 1 ? "" : "s"}`]
              : []
          }
          roleType="association"
          avatarUrl={profile.logoUrl}
          badge={profile.isVerified ? "Verified organization" : undefined}
        />

        <HubSectionCard title="About">
          <Text style={styles.bodyText}>
            {profile.description?.trim() || "No description provided yet."}
          </Text>
          <ProfileFieldRow label="Faculty" value={profile.faculty?.trim() || "—"} />
          <ProfileFieldRow label="Category" value={profile.category?.trim() || "—"} />
        </HubSectionCard>

        <HubSectionCard title="Social links">
          {hasSocial ? (
            <SocialLinksList
              instagramUrl={profile.instagramUrl}
              facebookUrl={profile.facebookUrl}
              linkedInUrl={profile.linkedInUrl}
            />
          ) : (
            <Text style={styles.muted}>No social links published yet.</Text>
          )}
        </HubSectionCard>

        <OrganizationVisitorSections
          organizationId={organizationId}
          organizationName={profile.associationName}
          extras={extras}
          campaigns={campaigns}
          loadingCampaigns={loadingCampaigns}
        />
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 16,
    alignItems: "stretch",
    paddingBottom: 24,
  },
  bodyText: {
    color: HUB_COLORS.foreground,
    fontSize: 14,
    lineHeight: 22,
  },
  muted: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: "#DC2626",
  },
});
