import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getStudentDirectoryProfile, type StudentDirectoryProfile } from "@/api/studentDirectoryApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";

export default function PublicStudentProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentDirectoryProfile | null>(null);

  useEffect(() => {
    const id = Number(userId);
    if (!Number.isFinite(id)) {
      setError("Invalid profile.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setProfile(await getStudentDirectoryProfile(id));
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <PublicProfileShell title="Student Profile">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !profile) {
    return (
      <PublicProfileShell title="Student Profile">
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </PublicProfileShell>
    );
  }

  return (
    <PublicProfileShell title={profile.name}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <FeedAvatar
          name={profile.name}
          size={88}
          avatarBase64={profilePhotoUrl(profile.profilePictureBase64) ? profile.profilePictureBase64 : null}
          roleType="student"
        />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.meta}>
          {[profile.major, profile.academicYear, profile.university].filter(Boolean).join(" · ")}
        </Text>

        <HubSectionCard title="About">
          <ProfileFieldRow label="Bio" value={profile.bio || "—"} />
          <ProfileFieldRow label="Looking for" value={profile.lookingFor || "—"} />
        </HubSectionCard>

        <HubSectionCard title="Skills">
          <Text style={styles.subheading}>Roles</Text>
          <ChipList items={profile.roles} />
          <Text style={styles.subheading}>Technical skills</Text>
          <ChipList items={profile.technicalSkills} />
          <Text style={styles.subheading}>Tools</Text>
          <ChipList items={profile.tools} />
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
    lineHeight: 20,
  },
  subheading: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    marginTop: 4,
  },
  error: {
    color: "#DC2626",
  },
});
