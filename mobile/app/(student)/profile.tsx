import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Svg, { Circle, G } from "react-native-svg";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getMe, type StudentMeResponse } from "@/api/meApi";
import type { GradProject } from "@/api/gradProjectApi";
import type { ProfileStrength } from "@/api/dashboardApi";
import {
  getGraduationProjectsForStudent,
  getOrganizationMemberships,
  getProfileStrength,
  type OrganizationMembership,
} from "@/api/studentProfileApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import {
  buildCompletionSuggestions,
  displayText,
  formatGpa,
  linkHandle,
  normalizeUrl,
  PORTFOLIO_LINK_DEFS,
  projectDuration,
  projectRole,
  uniqueStrings,
  WORK_PREFERENCE_LABELS,
} from "@/lib/studentProfileHelpers";
import { studentProfileShareUrl } from "@/lib/studentProfileShareUrl";
import { STUDENT_ROUTES } from "@/lib/studentRoutes";

export default function StudentProfileScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const technicalSkills = useMemo(
    () => uniqueStrings([...(profile?.technicalSkills ?? []), ...(profile?.majorSkills ?? [])]),
    [profile],
  );
  const tools = useMemo(() => uniqueStrings(profile?.tools ?? []), [profile]);
  const roles = useMemo(
    () => uniqueStrings([...(profile?.roles ?? []), ...(profile?.generalSkills ?? [])]),
    [profile],
  );
  const tags = useMemo(
    () =>
      uniqueStrings([profile?.major, ...(profile?.roles ?? []).slice(0, 2), profile?.academicYear]),
    [profile],
  );
  const completion = strength?.score ?? 0;
  const completionSuggestions = useMemo(
    () => (profile && strength ? buildCompletionSuggestions(profile, strength, projects.length) : []),
    [profile, strength, projects.length],
  );
  const remainingCount = completionSuggestions.filter((s) => !s.done).length;

  const preferenceValues = useMemo(() => {
    const availability = profile?.availability?.trim();
    return [
      "Not specified",
      "Not specified",
      "Not specified",
      "Not specified",
      availability ? availability : "Not specified",
      "Not specified",
    ];
  }, [profile?.availability]);

  const portfolioLinks = useMemo(() => {
    if (!profile) return [];
    return PORTFOLIO_LINK_DEFS.map(({ key, label }) => {
      if (key === "website") {
        return { label, handle: "Not connected", url: null as string | null };
      }
      const url = profile[key]?.trim();
      return {
        label,
        handle: url ? linkHandle(url) : "Not connected",
        url: url ?? null,
      };
    });
  }, [profile]);

  const openLink = (url?: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    void Linking.openURL(normalizeUrl(trimmed));
  };

  const handleShare = async () => {
    if (!profile) return;
    const url = studentProfileShareUrl(profile.userId);
    try {
      await Share.share({ message: url, url });
    } catch {
      Alert.alert("Could not share", "Copy your profile link from the browser if sharing fails.");
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile…</Text>
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

  const subtitle = [profile.major, profile.academicYear].filter(Boolean).join(" · ") || "—";
  const academicInterests =
    (profile.majorSkills?.length ?? 0) > 0
      ? profile.majorSkills!.join(", ")
      : displayText(undefined);
  const personalInterests =
    (profile.languages?.length ?? 0) > 0
      ? profile.languages!.join(", ")
      : displayText(undefined);

  return (
    <StudentWorkspaceScreen
      title="My Profile"
      subtitle="Your SkillSwap student profile."
      refreshing={loading}
      onRefresh={() => void load()}
    >
      {/* Profile header */}
      <View
        style={[
          styles.heroCard,
          {
            borderRadius: layout.radius.button,
            padding: layout.space("lg"),
            gap: layout.space("md"),
          },
        ]}
      >
        <View style={styles.avatarWrap}>
          <FeedAvatar
            name={profile.name}
            size={layout.scale(96)}
            avatarBase64={
              profilePhotoUrl(profile.profilePictureBase64) ? profile.profilePictureBase64 : null
            }
            roleType="student"
          />
          <View style={styles.availableDot} accessibilityLabel="Available" />
        </View>

        <View style={styles.collabBadge}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={styles.collabText}>OPEN TO COLLABORATION</Text>
        </View>

        <Text style={[styles.heroName, { fontSize: layout.fontSize.title + 4 }]}>{profile.name}</Text>
        <Text style={[styles.heroMeta, { fontSize: layout.fontSize.body }]}>{subtitle}</Text>

        <View style={[styles.heroMetaRow, { gap: layout.space("md") }]}>
          <MetaItem icon="business-outline" text={displayText(profile.university, "—")} />
          <MetaItem icon="ribbon-outline" text={`GPA ${formatGpa(profile.gpa)}`} />
          <MetaItem icon="mail-outline" text={displayText(profile.email, "—")} />
        </View>

        <View style={[styles.tagWrap, { gap: layout.space("sm") }]}>
          {tags.length > 0 ? (
            tags.map((tag) => (
              <View key={tag} style={[styles.tagChip, { borderRadius: layout.radius.input }]}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))
          ) : (
            <View style={[styles.tagChip, { borderRadius: layout.radius.input }]}>
              <Text style={[styles.tagChipText, styles.tagPlaceholder]}>Add profile tags</Text>
            </View>
          )}
        </View>

        {strength ? (
          <View style={styles.completionRingWrap}>
            <Svg width={layout.scale(88)} height={layout.scale(88)} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="42" stroke={colors.border} strokeWidth="8" fill="none" />
              <G rotation="-90" origin="50, 50">
                <Circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={colors.primary}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(completion / 100) * 264} 264`}
                />
              </G>
            </Svg>
            <View style={styles.completionRingLabel}>
              <Text style={[styles.completionPct, { fontSize: layout.scale(22) }]}>{completion}%</Text>
              <Text style={styles.completionCaption}>Profile Complete</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.actionRow, { gap: layout.space("sm") }]}>
          <Pressable
            style={[styles.editBtn, { borderRadius: layout.radius.button, minHeight: layout.touchTarget }]}
            onPress={() => router.push(STUDENT_ROUTES.editProfile as never)}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={["#6366F1", "#0EA5E9"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.editBtnGradient, { borderRadius: layout.radius.button }]}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={[
              styles.shareBtn,
              { borderRadius: layout.radius.button, minHeight: layout.touchTarget },
            ]}
            onPress={() => void handleShare()}
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={18} color={colors.foreground} />
            <Text style={styles.shareBtnText}>Share Profile</Text>
          </Pressable>
        </View>
      </View>

      <HubSectionCard title="About Me" description="Personal narrative">
        <Text style={styles.bodyText}>{displayText(profile.bio)}</Text>
      </HubSectionCard>

      <HubSectionCard title="Career Goals">
        <Text style={styles.bodyText}>{displayText(profile.lookingFor)}</Text>
      </HubSectionCard>

      <HubSectionCard title="Academic Interests">
        <Text style={styles.bodyText}>{academicInterests}</Text>
      </HubSectionCard>

      <HubSectionCard title="Personal Interests">
        <Text style={styles.bodyText}>{personalInterests}</Text>
      </HubSectionCard>

      <HubSectionCard title="Academic Information" description="Verified university record">
        <ProfileFieldRow label="University" value={displayText(profile.university)} />
        <ProfileFieldRow label="Faculty" value={displayText(profile.faculty)} />
        <ProfileFieldRow label="Major" value={displayText(profile.major)} />
        <ProfileFieldRow label="Academic Year" value={displayText(profile.academicYear)} />
        <ProfileFieldRow label="GPA" value={formatGpa(profile.gpa)} />
        <ProfileFieldRow label="Expected Graduation" value="Not provided yet." />
        {profile.studentId ? (
          <ProfileFieldRow label="Student ID" value={profile.studentId} />
        ) : null}
      </HubSectionCard>

      <HubSectionCard title="Skills" description="Skills, tools & preferred roles">
        <Text style={styles.subheading}>Technical Skills</Text>
        <ChipList items={technicalSkills} emptyLabel="None listed yet" />
        <Text style={styles.subheading}>Tools</Text>
        <ChipList items={tools} emptyLabel="None listed yet" />
        <Text style={styles.subheading}>Preferred Roles</Text>
        <ChipList items={roles} emptyLabel="None listed yet" />
        <Text style={styles.subheading}>Languages</Text>
        <ChipList items={profile.languages ?? []} emptyLabel="None listed yet" />
      </HubSectionCard>

      <HubSectionCard title="Project Interests" description="Domains you want to explore">
        {technicalSkills.length > 0 ? (
          <View style={[styles.domainWrap, { gap: layout.space("sm") }]}>
            {technicalSkills.map((name) => (
              <View key={name} style={[styles.domainCard, { borderRadius: layout.radius.input }]}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={styles.domainText}>{name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>No project interests listed yet.</Text>
        )}
      </HubSectionCard>

      <HubSectionCard title="Work Preferences" description="How you collaborate best">
        {WORK_PREFERENCE_LABELS.map((label, index) => (
          <ProfileFieldRow key={label} label={label} value={preferenceValues[index]} />
        ))}
      </HubSectionCard>

      <HubSectionCard title="Social Links" description="Portfolio & links">
        {portfolioLinks.map(({ label, handle, url }) => (
          <View key={label} style={styles.linkRow}>
            <ProfileFieldRow label={label} value={handle} />
            {url ? (
              <Pressable onPress={() => openLink(url)}>
                <Text style={styles.linkAction}>Open {label}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </HubSectionCard>

      <HubSectionCard title="Graduation Project" description="Previous projects">
        {projects.length === 0 ? (
          <Text style={styles.muted}>No projects to show yet.</Text>
        ) : (
          projects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              <Text style={styles.projectTitle}>{project.name}</Text>
              <Text style={styles.projectRole}>
                {projectRole(project, profile.profileId, profile.userId)}
              </Text>
              <View style={styles.projectMetaRow}>
                <Text style={styles.projectMeta}>
                  <Ionicons name="people-outline" size={12} color={colors.muted} />{" "}
                  {project.currentMembers} members
                </Text>
                <Text style={styles.projectMeta}>
                  <Ionicons name="time-outline" size={12} color={colors.muted} />{" "}
                  {projectDuration(project.createdAt)}
                </Text>
              </View>
              <Text style={styles.muted}>
                {displayText(project.description ?? project.abstract, "No description provided.")}
              </Text>
              {(project.requiredSkills ?? []).length > 0 ? (
                <ChipList items={project.requiredSkills ?? []} />
              ) : (
                <Text style={styles.muted}>No skills listed</Text>
              )}
            </View>
          ))
        )}
      </HubSectionCard>

      {strength ? (
        <HubSectionCard
          title="Profile Completion"
          description="A complete profile gets 4× more matches"
        >
          <View style={styles.completionHeader}>
            <Text style={[styles.completionBig, { fontSize: layout.scale(36) }]}>{completion}%</Text>
            <Text style={styles.muted}>
              {remainingCount} of {completionSuggestions.length} remaining
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completion}%` }]} />
          </View>
          {completionSuggestions.map((item) => (
            <View
              key={item.text}
              style={[
                styles.checklistRow,
                item.done ? styles.checklistDone : styles.checklistPending,
                { borderRadius: layout.radius.input },
              ]}
            >
              <Ionicons
                name={item.done ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={item.done ? "#10B981" : colors.muted}
              />
              <Text style={[styles.checklistText, !item.done && styles.checklistTextPending]}>
                {item.text}
              </Text>
              {!item.done ? (
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              ) : null}
            </View>
          ))}
        </HubSectionCard>
      ) : null}

      <HubSectionCard title="Organizations & Activities">
        {memberships.length === 0 ? (
          <Text style={styles.muted}>No organizations or activities listed yet.</Text>
        ) : (
          memberships.map((membership) => (
            <Pressable
              key={membership.organizationMemberId}
              style={[styles.orgRow, { borderRadius: layout.radius.input }]}
              onPress={() => router.push(`/organizations/${membership.organizationId}` as never)}
            >
              <View style={styles.orgIcon}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.orgText}>
                <Text style={styles.projectTitle}>{membership.organizationName}</Text>
                <Text style={styles.muted}>
                  {membership.roleTitle || membership.membershipKind}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))
        )}
      </HubSectionCard>
    </StudentWorkspaceScreen>
  );
}

function MetaItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.muted} />
      <Text style={styles.metaText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 15,
  },
  heroCard: {
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: {
    position: "relative",
  },
  availableDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: colors.cardBg,
  },
  collabBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  collabText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  heroName: {
    fontWeight: "800",
    color: colors.foreground,
    textAlign: "center",
  },
  heroMeta: {
    color: colors.muted,
    textAlign: "center",
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
    flexShrink: 1,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  tagChip: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagChipText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 12,
  },
  tagPlaceholder: {
    color: colors.muted,
  },
  completionRingWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  completionRingLabel: {
    position: "absolute",
    alignItems: "center",
  },
  completionPct: {
    fontWeight: "800",
    color: colors.primary,
  },
  completionCaption: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 4,
  },
  editBtn: {
    flex: 1,
    overflow: "hidden",
  },
  editBtnGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  editBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 12,
  },
  shareBtnText: {
    color: colors.foreground,
    fontWeight: "700",
    fontSize: 15,
  },
  bodyText: {
    color: colors.foreground,
    lineHeight: 22,
  },
  subheading: {
    fontWeight: "700",
    color: colors.foreground,
    marginTop: 4,
  },
  muted: {
    color: colors.muted,
    lineHeight: 20,
  },
  domainWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  domainCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: "45%",
    flexGrow: 1,
  },
  domainText: {
    color: colors.foreground,
    fontWeight: "600",
    fontSize: 13,
    flexShrink: 1,
  },
  linkRow: {
    gap: 4,
  },
  linkAction: {
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  projectCard: {
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  projectTitle: {
    fontWeight: "700",
    color: colors.foreground,
  },
  projectRole: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  projectMetaRow: {
    flexDirection: "row",
    gap: 16,
  },
  projectMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  completionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  completionBig: {
    fontWeight: "800",
    color: colors.primary,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginVertical: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  checklistDone: {
    borderColor: "rgba(16, 185, 129, 0.25)",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  checklistPending: {
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
  },
  checklistText: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
  },
  checklistTextPending: {
    fontWeight: "600",
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.inputBg,
  },
  orgIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  orgText: {
    flex: 1,
    minWidth: 0,
  },
});
