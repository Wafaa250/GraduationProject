import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getDoctorPublicProfile, type DoctorPublicProfile } from "@/api/doctorPublicApi";
import { PublicLinkList } from "@/components/public-profile/PublicLinkList";
import { PublicProfileHero } from "@/components/public-profile/PublicProfileHero";
import { PublicProfileStatGrid } from "@/components/public-profile/PublicProfileStatGrid";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { displayText, normalizeUrl } from "@/lib/studentProfileHelpers";

export default function PublicDoctorProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DoctorPublicProfile | null>(null);
  const numericUserId = Number(userId);

  useEffect(() => {
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      setError("Invalid profile.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setProfile(await getDoctorPublicProfile(numericUserId));
      } catch (err) {
        setProfile(null);
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [numericUserId]);

  if (loading) {
    return (
      <PublicProfileShell title="Doctor Profile" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !profile) {
    return (
      <PublicProfileShell title="Doctor Profile" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </PublicProfileShell>
    );
  }

  const dp = profile.doctorProfile;
  const photo = dp.profilePictureBase64 ?? profile.user.profilePictureBase64 ?? null;
  const linkedin = dp.linkedin?.trim();

  return (
    <PublicProfileShell title={profile.user.name} fallbackHref="/feed">
      <ScrollView contentContainerStyle={styles.scroll}>
        <PublicProfileHero
          name={profile.user.name}
          subtitle={[dp.specialization, dp.university].filter(Boolean).join(" · ") || undefined}
          metaLines={[dp.department?.trim(), dp.faculty?.trim()].filter(Boolean) as string[]}
          roleType="doctor"
          avatarBase64={photo}
        />

        {dp.bio?.trim() ? (
          <HubSectionCard title="About">
            <Text style={styles.bodyText}>{dp.bio.trim()}</Text>
          </HubSectionCard>
        ) : null}

        <HubSectionCard title="Academic information">
          <ProfileFieldRow label="Faculty" value={displayText(dp.faculty)} />
          <ProfileFieldRow label="Department" value={displayText(dp.department)} />
          <ProfileFieldRow label="Academic rank" value={displayText(dp.academicRank)} />
          <ProfileFieldRow label="Specialization" value={displayText(dp.specialization)} />
          <ProfileFieldRow label="University" value={displayText(dp.university)} />
          <ProfileFieldRow
            label="Years of experience"
            value={dp.yearsOfExperience != null ? String(dp.yearsOfExperience) : displayText(undefined)}
          />
        </HubSectionCard>

        <HubSectionCard title="Supervision summary">
          <PublicProfileStatGrid
            stats={[
              { label: "Supervised students", value: profile.supervisedStudentsCount ?? 0 },
              { label: "Active projects", value: profile.activeProjectsCount ?? 0 },
              { label: "Completed projects", value: profile.completedProjectsCount ?? 0 },
            ]}
          />
        </HubSectionCard>

        <HubSectionCard title="Expertise">
          <Text style={styles.subheading}>Technical skills</Text>
          <ChipList items={dp.technicalSkills} emptyLabel="None listed yet" />
          <Text style={styles.subheading}>Research skills</Text>
          <ChipList items={dp.researchSkills} emptyLabel="None listed yet" />
          <Text style={styles.subheading}>Research interests</Text>
          <ChipList items={dp.researchInterests ?? []} emptyLabel="None listed yet" />
          <Text style={styles.subheading}>Preferred project areas</Text>
          <ChipList items={dp.preferredProjectAreas ?? []} emptyLabel="None listed yet" />
        </HubSectionCard>

        <HubSectionCard title="Contact information">
          <ProfileFieldRow label="Email" value={displayText(profile.user.email)} />
          <ProfileFieldRow label="Office hours" value={displayText(dp.officeHours)} />
          {linkedin ? (
            <PublicLinkList
              items={[
                {
                  key: "linkedin",
                  label: "LinkedIn",
                  value: linkedin,
                  href: normalizeUrl(linkedin),
                },
              ]}
            />
          ) : (
            <ProfileFieldRow label="LinkedIn" value={displayText(undefined)} />
          )}
        </HubSectionCard>
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
  subheading: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    marginTop: 4,
  },
  error: {
    color: "#DC2626",
  },
});
