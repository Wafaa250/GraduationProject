import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text } from "react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import { getPublicOrganizationProfile, type PublicOrganizationProfile } from "@/api/publicProfilesApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";

export default function PublicOrganizationProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicOrganizationProfile | null>(null);

  useEffect(() => {
    const orgId = Number(id);
    if (!Number.isFinite(orgId)) {
      setError("Invalid organization profile.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setProfile(await getPublicOrganizationProfile(orgId));
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <PublicProfileShell title="Organization Profile">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !profile) {
    return (
      <PublicProfileShell title="Organization Profile">
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </PublicProfileShell>
    );
  }

  const logo = profile.logoUrl ? resolveApiFileUrl(profile.logoUrl) : null;
  const openUrl = (url?: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    void Linking.openURL(href);
  };

  return (
    <PublicProfileShell title={profile.organizationName}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.logo} />
        ) : (
          <FeedAvatar name={profile.organizationName} size={88} roleType="association" />
        )}
        <Text style={styles.name}>{profile.organizationName}</Text>
        <Text style={styles.meta}>
          {[profile.category, profile.faculty].filter(Boolean).join(" · ")}
        </Text>

        <HubSectionCard title="About">
          <ProfileFieldRow label="Description" value={profile.description ?? "—"} />
          <ProfileFieldRow label="Followers" value={String(profile.followersCount ?? 0)} />
        </HubSectionCard>

        <HubSectionCard title="Social links">
          {profile.instagramUrl ? (
            <Text style={styles.link} onPress={() => openUrl(profile.instagramUrl)}>
              Instagram
            </Text>
          ) : null}
          {profile.facebookUrl ? (
            <Text style={styles.link} onPress={() => openUrl(profile.facebookUrl)}>
              Facebook
            </Text>
          ) : null}
          {profile.linkedInUrl ? (
            <Text style={styles.link} onPress={() => openUrl(profile.linkedInUrl)}>
              LinkedIn
            </Text>
          ) : null}
        </HubSectionCard>
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 16,
    alignItems: "center",
    paddingBottom: 24,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  name: {
    fontWeight: "800",
    fontSize: 24,
    color: HUB_COLORS.foreground,
    textAlign: "center",
  },
  meta: {
    color: HUB_COLORS.muted,
    textAlign: "center",
  },
  link: {
    color: HUB_COLORS.primary,
    fontWeight: "600",
    paddingVertical: 6,
  },
  error: {
    color: "#DC2626",
  },
});
