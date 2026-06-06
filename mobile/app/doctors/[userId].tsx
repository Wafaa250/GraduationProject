import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getDoctorPublicProfile, type DoctorPublicProfile } from "@/api/doctorPublicApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";

export default function PublicDoctorProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DoctorPublicProfile | null>(null);

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
        setProfile(await getDoctorPublicProfile(id));
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <PublicProfileShell title="Doctor Profile">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !profile) {
    return (
      <PublicProfileShell title="Doctor Profile">
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </PublicProfileShell>
    );
  }

  const photo =
    profile.user.profilePictureBase64 ?? profile.doctorProfile.profilePictureBase64 ?? null;

  return (
    <PublicProfileShell title={profile.user.name}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FeedAvatar
          name={profile.user.name}
          size={88}
          avatarBase64={profilePhotoUrl(photo) ? photo : null}
          roleType="doctor"
        />
        <Text style={styles.name}>{profile.user.name}</Text>
        <Text style={styles.meta}>
          {[profile.doctorProfile.specialization, profile.doctorProfile.university]
            .filter(Boolean)
            .join(" · ")}
        </Text>

        <HubSectionCard title="Academic profile">
          <ProfileFieldRow label="Department" value={profile.doctorProfile.department} />
          <ProfileFieldRow label="Faculty" value={profile.doctorProfile.faculty ?? "—"} />
          <ProfileFieldRow label="Specialization" value={profile.doctorProfile.specialization ?? "—"} />
        </HubSectionCard>

        <HubSectionCard title="About">
          <ProfileFieldRow label="Bio" value={profile.doctorProfile.bio ?? "—"} />
        </HubSectionCard>

        <HubSectionCard title="Expertise">
          <Text style={styles.subheading}>Technical skills</Text>
          <ChipList items={profile.doctorProfile.technicalSkills} />
          <Text style={styles.subheading}>Research skills</Text>
          <ChipList items={profile.doctorProfile.researchSkills} />
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
