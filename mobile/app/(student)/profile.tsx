import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getMe, type StudentMeResponse } from "@/api/meApi";
import {
  getGraduationProjectsForStudent,
  getOrganizationMemberships,
  getProfileStrength,
  type OrganizationMembership,
} from "@/api/studentProfileApi";
import type { GradProject } from "@/api/gradProjectApi";
import type { ProfileStrength } from "@/api/dashboardApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";

export default function StudentProfileScreen() {
  const layout = useResponsiveLayout();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentMeResponse | null>(null);
  const [strength, setStrength] = useState<ProfileStrength | null>(null);
  const [projects, setProjects] = useState<GradProject[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      setProfile(me);
      const [strengthData, projectData, membershipData] = await Promise.all([
        getProfileStrength().catch(() => null),
        getGraduationProjectsForStudent(me.profileId).catch(() => []),
        getOrganizationMemberships().catch(() => []),
      ]);
      setStrength(strengthData);
      setProjects(projectData);
      setMemberships(membershipData);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={HUB_COLORS.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <StudentWorkspaceScreen title="My Profile" subtitle="Could not load your profile.">
        <Text style={styles.errorText}>{error ?? "Profile unavailable"}</Text>
      </StudentWorkspaceScreen>
    );
  }

  const openLink = (url?: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    void Linking.openURL(href);
  };

  return (
    <StudentWorkspaceScreen
      title="My Profile"
      subtitle="Your SkillSwap student profile."
      refreshing={loading}
      onRefresh={() => void load()}
    >
      <View style={[styles.hero, { gap: layout.space("md") }]}>
        <FeedAvatar
          name={profile.name}
          size={layout.scale(88)}
          avatarBase64={profilePhotoUrl(profile.profilePictureBase64) ? profile.profilePictureBase64 : null}
          roleType="student"
        />
        <View style={styles.heroText}>
          <Text style={[styles.heroName, { fontSize: layout.fontSize.title }]}>{profile.name}</Text>
          <Text style={[styles.heroMeta, { fontSize: layout.fontSize.body }]}>
            {[profile.major, profile.academicYear].filter(Boolean).join(" · ")}
          </Text>
          <Text style={[styles.heroMeta, { fontSize: layout.fontSize.footer }]}>{profile.university}</Text>
        </View>
      </View>

      {strength ? (
        <HubSectionCard title="Profile completion" description={`${strength.score}% complete`}>
          <ProfileFieldRow label="Photo" value={strength.hasProfilePicture ? "Added" : "Missing"} />
          <ProfileFieldRow label="Bio" value={strength.hasBio ? "Added" : "Missing"} />
          <ProfileFieldRow label="Skills" value={strength.hasGeneralSkills ? "Added" : "Missing"} />
          <ProfileFieldRow label="GPA" value={strength.hasGpa ? "Added" : "Missing"} />
        </HubSectionCard>
      ) : null}

      <HubSectionCard title="About">
        <ProfileFieldRow label="Bio" value={profile.bio?.trim() || "—"} />
        <ProfileFieldRow label="Career goals" value={profile.lookingFor?.trim() || "—"} />
        <ProfileFieldRow label="Availability" value={profile.availability?.trim() || "—"} />
      </HubSectionCard>

      <HubSectionCard title="Academic information">
        <ProfileFieldRow label="Student ID" value={profile.studentId ?? "—"} />
        <ProfileFieldRow label="Faculty" value={profile.faculty ?? "—"} />
        <ProfileFieldRow label="Major" value={profile.major ?? "—"} />
        <ProfileFieldRow label="Year" value={profile.academicYear ?? "—"} />
        <ProfileFieldRow
          label="GPA"
          value={profile.gpa != null ? String(profile.gpa) : "—"}
        />
      </HubSectionCard>

      <HubSectionCard title="Skills & roles">
        <Text style={styles.subheading}>Team roles</Text>
        <ChipList items={profile.roles ?? []} />
        <Text style={styles.subheading}>Technical skills</Text>
        <ChipList items={profile.technicalSkills ?? []} />
        <Text style={styles.subheading}>Tools</Text>
        <ChipList items={profile.tools ?? []} />
        <Text style={styles.subheading}>Languages</Text>
        <ChipList items={profile.languages ?? []} emptyLabel="None listed" />
      </HubSectionCard>

      <HubSectionCard title="Portfolio & links">
        <ProfileFieldRow
          label="GitHub"
          value={profile.github?.trim() || "Not connected"}
        />
        {profile.github?.trim() ? (
          <Text style={styles.linkAction} onPress={() => openLink(profile.github)}>
            Open GitHub
          </Text>
        ) : null}
        <ProfileFieldRow
          label="LinkedIn"
          value={profile.linkedin?.trim() || "Not connected"}
        />
        {profile.linkedin?.trim() ? (
          <Text style={styles.linkAction} onPress={() => openLink(profile.linkedin)}>
            Open LinkedIn
          </Text>
        ) : null}
        <ProfileFieldRow
          label="Portfolio"
          value={profile.portfolio?.trim() || "Not connected"}
        />
        {profile.portfolio?.trim() ? (
          <Text style={styles.linkAction} onPress={() => openLink(profile.portfolio)}>
            Open portfolio
          </Text>
        ) : null}
      </HubSectionCard>

      <HubSectionCard title="Previous projects">
        {projects.length === 0 ? (
          <Text style={styles.muted}>No graduation projects listed yet.</Text>
        ) : (
          projects.map((project) => (
            <View key={project.id} style={styles.projectRow}>
              <Text style={styles.projectTitle}>{project.name}</Text>
              {project.description ? (
                <Text style={styles.muted} numberOfLines={3}>
                  {project.description}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </HubSectionCard>

      <HubSectionCard title="Organizations & activities">
        {memberships.length === 0 ? (
          <Text style={styles.muted}>No organization memberships yet.</Text>
        ) : (
          memberships.map((membership) => (
            <View key={membership.organizationMemberId} style={styles.projectRow}>
              <Text style={styles.projectTitle}>{membership.organizationName}</Text>
              <Text style={styles.muted}>
                {membership.roleTitle} · {membership.membershipKind}
              </Text>
            </View>
          ))
        )}
      </HubSectionCard>
    </StudentWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HUB_COLORS.background,
  },
  hero: {
    width: "100%",
    alignItems: "center",
  },
  heroText: {
    alignItems: "center",
    width: "100%",
  },
  heroName: {
    fontWeight: "800",
    color: HUB_COLORS.foreground,
    textAlign: "center",
  },
  heroMeta: {
    color: HUB_COLORS.muted,
    textAlign: "center",
  },
  subheading: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    marginTop: 4,
  },
  muted: {
    color: HUB_COLORS.muted,
    lineHeight: 20,
  },
  linkAction: {
    color: HUB_COLORS.primary,
    fontWeight: "600",
  },
  projectRow: {
    gap: 4,
    paddingVertical: 6,
  },
  projectTitle: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 15,
  },
});
