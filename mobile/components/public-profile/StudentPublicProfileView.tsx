import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { GradProject } from "@/api/gradProjectApi";
import type { StudentMeResponse } from "@/api/meApi";
import type { OrganizationMembership } from "@/api/studentProfileApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { ProfileAccordionSection } from "@/components/public-profile/ProfileAccordionSection";
import { ChipList } from "@/components/student/ChipList";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { studentProfileShareUrl } from "@/lib/studentProfileShareUrl";
import {
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

const WORK_PREFERENCE_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "people-outline",
  "speedometer-outline",
  "ribbon-outline",
  "chatbubble-outline",
  "time-outline",
  "layers-outline",
];

type Props = {
  profile: StudentMeResponse;
  projects: GradProject[];
  memberships?: OrganizationMembership[];
  showShare?: boolean;
  onMessage?: () => void;
  messaging?: boolean;
};

export function StudentPublicProfileView({
  profile,
  projects,
  memberships = [],
  showShare = true,
  onMessage,
  messaging = false,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<number>>(new Set());

  const technicalSkills = useMemo(
    () => uniqueStrings([...(profile.technicalSkills ?? []), ...(profile.majorSkills ?? [])]),
    [profile],
  );
  const tools = useMemo(() => uniqueStrings(profile.tools ?? []), [profile]);
  const roles = useMemo(
    () => uniqueStrings([...(profile.roles ?? []), ...(profile.generalSkills ?? [])]),
    [profile],
  );
  const skillPreview = useMemo(
    () => uniqueStrings([...technicalSkills.slice(0, 4), ...roles.slice(0, 2)]).slice(0, 6),
    [technicalSkills, roles],
  );

  const preferenceValues = useMemo(() => {
    const availability = profile.availability?.trim();
    return [
      "Not specified",
      "Not specified",
      "Not specified",
      "Not specified",
      availability || "Not specified",
      "Not specified",
    ];
  }, [profile.availability]);

  const portfolioLinks = useMemo(
    () =>
      PORTFOLIO_LINK_DEFS.map(({ key, label }) => {
        if (key === "website") {
          return { key, label, handle: "Not connected", url: null as string | null };
        }
        const url = profile[key]?.trim();
        return {
          key,
          label,
          handle: url ? linkHandle(url) : "Not connected",
          url: url ?? null,
        };
      }),
    [profile],
  );

  const connectedLinksCount = portfolioLinks.filter((l) => l.url).length;
  const academicInterests =
    (profile.majorSkills?.length ?? 0) > 0
      ? profile.majorSkills!.join(", ")
      : displayText(undefined);
  const personalInterests =
    (profile.languages?.length ?? 0) > 0
      ? profile.languages!.join(", ")
      : displayText(undefined);

  const aboutPreview = profile.bio?.trim() || profile.lookingFor?.trim() || "No bio provided yet.";
  const academicPreview = [profile.major, `GPA ${formatGpa(profile.gpa)}`].filter(Boolean).join(" · ");
  const projectInterestsPreview =
    technicalSkills.length > 0
      ? technicalSkills.slice(0, 4).join(", ") +
        (technicalSkills.length > 4 ? ` +${technicalSkills.length - 4} more` : "")
      : "No interests listed";
  const workPreview = preferenceValues[4];
  const portfolioPreview =
    connectedLinksCount === 0
      ? "No links connected"
      : `${connectedLinksCount} link${connectedLinksCount === 1 ? "" : "s"} connected`;
  const projectsPreview =
    projects.length === 0
      ? "No projects yet"
      : `${projects.length} project${projects.length === 1 ? "" : "s"}`;
  const orgPreview =
    memberships.length === 0
      ? "No organizations listed"
      : memberships.length === 1
        ? memberships[0].organizationName
        : `${memberships.length} organizations`;

  const openLink = (url?: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    void Linking.openURL(normalizeUrl(trimmed));
  };

  const handleShare = async () => {
    const url = studentProfileShareUrl(profile.userId);
    try {
      await Share.share({ message: url, url });
    } catch {
      Alert.alert("Could not share", "Copy the profile link from your browser if sharing fails.");
    }
  };

  const toggleProject = (projectId: number) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  return (
    <View style={{ gap: layout.space("sm"), width: "100%" }}>
      {/* Compact profile header — always visible */}
      <View style={[styles.heroCard, { borderRadius: layout.radius.button, padding: layout.space("md") }]}>
        <LinearGradient
          colors={[`${colors.primary}12`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: layout.radius.button }]}
        />

        <View style={styles.heroRow}>
          <View style={styles.avatarWrap}>
            <FeedAvatar
              name={profile.name}
              size={layout.scale(72)}
              avatarBase64={
                profilePhotoUrl(profile.profilePictureBase64) ? profile.profilePictureBase64 : null
              }
              roleType="student"
            />
            <View style={styles.availableDot} />
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.collabBadge}>
              <Ionicons name="sparkles" size={10} color={colors.primary} />
              <Text style={styles.collabText}>OPEN TO COLLABORATION</Text>
            </View>
            <Text style={styles.heroName} numberOfLines={2}>
              {profile.name}
            </Text>
            <Text style={styles.heroLine} numberOfLines={2}>
              {displayText(profile.university, "—")}
            </Text>
            <Text style={styles.heroLine}>
              {[profile.major, profile.academicYear].filter(Boolean).join(" · ") || "—"}
            </Text>
          </View>
        </View>

        {skillPreview.length > 0 ? (
          <View style={styles.previewChips}>
            <ChipList items={skillPreview} />
          </View>
        ) : null}

        {onMessage || showShare ? (
          <View style={styles.heroActions}>
            {onMessage ? (
              <Pressable
                style={[styles.messageBtn, { borderRadius: layout.radius.input }]}
                onPress={onMessage}
                disabled={messaging}
                accessibilityRole="button"
              >
                <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                <Text style={styles.messageBtnText}>{messaging ? "Opening…" : "Message"}</Text>
              </Pressable>
            ) : null}
            {showShare ? (
              <Pressable
                style={[styles.shareBtn, { borderRadius: layout.radius.input }]}
                onPress={() => void handleShare()}
                accessibilityRole="button"
              >
                <Ionicons name="share-outline" size={16} color={colors.foreground} />
                <Text style={styles.shareBtnText}>Share Profile</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <ProfileAccordionSection
        title="About Me"
        icon="book-outline"
        summary={aboutPreview}
        defaultExpanded={false}
      >
        <Text style={styles.bodyText}>{displayText(profile.bio)}</Text>
        <CompactLabelBlock label="Career Goals" value={displayText(profile.lookingFor)} />
        <CompactLabelBlock label="Academic Interests" value={academicInterests} />
        <CompactLabelBlock label="Personal Interests" value={personalInterests} />
        <CompactLabelBlock label="Email" value={displayText(profile.email)} />
      </ProfileAccordionSection>

      <ProfileAccordionSection
        title="Academic Information"
        icon="school-outline"
        summary={academicPreview}
        defaultExpanded={false}
      >
        <View style={styles.compactGrid}>
          <CompactField label="University" value={displayText(profile.university)} />
          <CompactField label="Faculty" value={displayText(profile.faculty)} />
          <CompactField label="Major" value={displayText(profile.major)} />
          <CompactField label="Academic Year" value={displayText(profile.academicYear)} />
          <CompactField label="GPA" value={formatGpa(profile.gpa)} />
          <CompactField label="Expected Graduation" value="Not provided yet." />
        </View>
      </ProfileAccordionSection>

      <ProfileAccordionSection
        title="Skills, Tools & Roles"
        icon="sparkles-outline"
        summary={
          technicalSkills.length + tools.length + roles.length > 0
            ? `${technicalSkills.length} skills · ${tools.length} tools · ${roles.length} roles`
            : "None listed yet"
        }
        defaultExpanded
      >
        <SkillGroup label="Technical Skills" items={technicalSkills} />
        <SkillGroup label="Tools" items={tools} />
        <SkillGroup label="Preferred Roles" items={roles} />
      </ProfileAccordionSection>

      <ProfileAccordionSection
        title="Project Interests"
        icon="flag-outline"
        summary={projectInterestsPreview}
        defaultExpanded={false}
      >
        {technicalSkills.length > 0 ? (
          <ChipList items={technicalSkills} />
        ) : (
          <Text style={styles.muted}>No project interests listed yet.</Text>
        )}
      </ProfileAccordionSection>

      <ProfileAccordionSection
        title="Work Preferences"
        icon="speedometer-outline"
        summary={workPreview}
        defaultExpanded={false}
      >
        <View style={styles.compactGrid}>
          {WORK_PREFERENCE_LABELS.map((label, index) => (
            <CompactField
              key={label}
              label={label}
              value={preferenceValues[index]}
              icon={WORK_PREFERENCE_ICONS[index]}
            />
          ))}
        </View>
      </ProfileAccordionSection>

      <ProfileAccordionSection
        title="Portfolio & Links"
        icon="link-outline"
        summary={portfolioPreview}
        defaultExpanded={false}
      >
        <View style={styles.linkGrid}>
          {portfolioLinks.map(({ key, label, url }) => (
            <Pressable
              key={key}
              style={[styles.linkIconCard, !url && styles.linkIconCardMuted]}
              onPress={() => openLink(url)}
              disabled={!url}
            >
              <Ionicons
                name={linkIconFor(key)}
                size={20}
                color={url ? colors.primary : colors.muted}
              />
              <Text style={[styles.linkIconLabel, !url && styles.linkIconLabelMuted]}>{label}</Text>
              <Text style={styles.linkIconStatus}>{url ? "Connected" : "Not connected"}</Text>
            </Pressable>
          ))}
        </View>
      </ProfileAccordionSection>

      <ProfileAccordionSection
        title="Previous Projects"
        icon="briefcase-outline"
        summary={projectsPreview}
        defaultExpanded={false}
      >
        {projects.length === 0 ? (
          <Text style={styles.muted}>No projects to show yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {projects.map((project) => {
              const expanded = expandedProjectIds.has(project.id);
              const techs = project.requiredSkills ?? project.technologies ?? [];
              return (
                <Pressable
                  key={project.id}
                  style={styles.projectSummary}
                  onPress={() => toggleProject(project.id)}
                >
                  <View style={styles.projectSummaryHead}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.projectTitle}>{project.name}</Text>
                      <Text style={styles.projectRole}>
                        {projectRole(project, profile.profileId, profile.userId)}
                      </Text>
                    </View>
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.muted}
                    />
                  </View>
                  {techs.length > 0 ? (
                    <ChipList items={expanded ? techs : techs.slice(0, 4)} />
                  ) : (
                    <Text style={styles.muted}>No technologies listed</Text>
                  )}
                  {expanded ? (
                    <View style={styles.projectDetails}>
                      <Text style={styles.projectMeta}>
                        {project.currentMembers} members · {projectDuration(project.createdAt)}
                      </Text>
                      <Text style={styles.bodyText}>
                        {displayText(
                          project.description ?? project.abstract,
                          "No description provided.",
                        )}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ProfileAccordionSection>

      <ProfileAccordionSection
        title="Organizations & Activities"
        icon="people-outline"
        summary={orgPreview}
        defaultExpanded={false}
      >
        {memberships.length === 0 ? (
          <Text style={styles.muted}>No organizations or activities listed yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {memberships.map((membership) => (
              <Pressable
                key={membership.organizationMemberId}
                style={styles.orgRow}
                onPress={() => router.push(`/organizations/${membership.organizationId}` as Href)}
              >
                <Ionicons name="people-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.orgName}>{membership.organizationName}</Text>
                  <Text style={styles.muted}>
                    {membership.roleTitle || membership.membershipKind}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}
      </ProfileAccordionSection>
    </View>
  );
}

function linkIconFor(key: string): keyof typeof Ionicons.glyphMap {
  switch (key) {
    case "github":
      return "logo-github";
    case "linkedin":
      return "logo-linkedin";
    case "portfolio":
      return "globe-outline";
    default:
      return "link-outline";
  }
}

function SkillGroup({ label, items }: { label: string; items: string[] }) {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.skillGroup}>
      <Text style={styles.skillGroupLabel}>{label}</Text>
      <ChipList items={items} emptyLabel="None listed yet" />
    </View>
  );
}

function CompactField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.compactField}>
      <View style={styles.compactFieldLabelRow}>
        {icon ? <Ionicons name={icon} size={11} color={colors.muted} /> : null}
        <Text style={styles.compactFieldLabel}>{label}</Text>
      </View>
      <Text style={styles.compactFieldValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

function CompactLabelBlock({ label, value }: { label: string; value: string }) {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.labelBlock}>
      <Text style={styles.labelBlockTitle}>{label}</Text>
      <Text style={styles.labelBlockValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    heroCard: {
      width: "100%",
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      gap: 10,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    avatarWrap: {
      position: "relative",
    },
    availableDot: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#10B981",
      borderWidth: 2,
      borderColor: colors.cardBg,
    },
    heroInfo: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    collabBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 2,
    },
    collabText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 9,
      letterSpacing: 0.5,
    },
    heroName: {
      fontWeight: "800",
      fontSize: 20,
      color: colors.foreground,
      lineHeight: 24,
    },
    heroLine: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 18,
    },
    previewChips: {
      marginTop: 2,
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    messageBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: colors.primary,
      minWidth: 120,
    },
    messageBtnText: {
      fontWeight: "700",
      fontSize: 14,
      color: "#FFFFFF",
    },
    shareBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: colors.inputBg,
    },
    shareBtnText: {
      fontWeight: "700",
      fontSize: 14,
      color: colors.foreground,
    },
    bodyText: {
      color: colors.foreground,
      fontSize: 14,
      lineHeight: 20,
    },
    muted: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    compactGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    compactField: {
      width: "48%",
      flexGrow: 1,
      minWidth: "46%",
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 3,
    },
    compactFieldLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    compactFieldLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    compactFieldValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
      lineHeight: 17,
    },
    skillGroup: {
      gap: 6,
    },
    skillGroupLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    labelBlock: {
      gap: 2,
      paddingTop: 4,
    },
    labelBlockTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.foreground,
    },
    labelBlockValue: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 18,
    },
    linkGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    linkIconCard: {
      width: "22%",
      minWidth: 72,
      flexGrow: 1,
      alignItems: "center",
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primarySoft,
    },
    linkIconCardMuted: {
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
    },
    linkIconLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
    },
    linkIconLabelMuted: {
      color: colors.muted,
    },
    linkIconStatus: {
      fontSize: 9,
      color: colors.muted,
      textAlign: "center",
    },
    projectSummary: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      gap: 8,
      backgroundColor: colors.inputBg,
    },
    projectSummaryHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    projectTitle: {
      fontWeight: "800",
      fontSize: 15,
      color: colors.foreground,
    },
    projectRole: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    projectDetails: {
      gap: 8,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    projectMeta: {
      fontSize: 12,
      color: colors.muted,
    },
    orgRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
    },
    orgName: {
      fontWeight: "700",
      fontSize: 14,
      color: colors.foreground,
    },
  });
