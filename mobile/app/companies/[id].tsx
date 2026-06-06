import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getPublicCompanyProfile, type PublicCompanyProfile } from "@/api/publicProfilesApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";

export default function PublicCompanyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicCompanyProfile | null>(null);

  useEffect(() => {
    const companyId = Number(id);
    if (!Number.isFinite(companyId)) {
      setError("Invalid company profile.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setProfile(await getPublicCompanyProfile(companyId));
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <PublicProfileShell title="Company Profile">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !profile) {
    return (
      <PublicProfileShell title="Company Profile">
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </PublicProfileShell>
    );
  }

  const openUrl = (url?: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    void Linking.openURL(href);
  };

  return (
    <PublicProfileShell title={profile.companyName}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FeedAvatar name={profile.companyName} size={88} roleType="company" />
        <Text style={styles.name}>{profile.companyName}</Text>
        {profile.industry ? <Text style={styles.meta}>{profile.industry}</Text> : null}

        <HubSectionCard title="About">
          <ProfileFieldRow label="Description" value={profile.description ?? "—"} />
          <ProfileFieldRow label="Email" value={profile.email ?? "—"} />
        </HubSectionCard>

        <HubSectionCard title="Links">
          {profile.websiteUrl ? (
            <Text style={styles.link} onPress={() => openUrl(profile.websiteUrl)}>
              Visit website
            </Text>
          ) : null}
          {profile.linkedInUrl ? (
            <Text style={styles.link} onPress={() => openUrl(profile.linkedInUrl)}>
              View LinkedIn
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
