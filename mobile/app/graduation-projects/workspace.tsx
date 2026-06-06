import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileNavHeader } from "@/components/navigation/MobileNavHeader";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  deriveProjectStatus,
  getGraduationProjectsMyEnvelope,
  getRecommendedStudents,
  inviteStudentToProject,
  resolveProjectTypeLabel,
  type GradProject,
  type GradProjectRecommendedStudent,
} from "@/api/gradProjectApi";
import { getSentProjectInvitations } from "@/api/invitationsApi";
import { getMe } from "@/api/meApi";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { projectTypeLabel } from "@/lib/graduationProjectTypes";
import { profileInitialsFromName } from "@/lib/profileAvatar";
import { studentDirectoryProfilePath, STUDENT_ROUTES } from "@/lib/studentRoutes";

export default function GraduationProjectWorkspaceScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [project, setProject] = useState<GradProject | null>(null);
  const [envelopeRole, setEnvelopeRole] = useState<"owner" | "member" | null>(null);
  const [aiTeammates, setAiTeammates] = useState<GradProjectRecommendedStudent[]>([]);
  const [pendingInviteIds, setPendingInviteIds] = useState<Set<number>>(new Set());
  const [invitingStudentId, setInvitingStudentId] = useState<number | null>(null);
  const [faculty, setFaculty] = useState<string | null>(null);
  const [major, setMajor] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);

  const loadWorkspace = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [envelope, me] = await Promise.all([getGraduationProjectsMyEnvelope(), getMe()]);
      setFaculty(me.faculty ?? null);
      setMajor(me.major ?? null);
      setProfileId(me.profileId ?? null);
      setEnvelopeRole(envelope.role);

      if (!envelope.project) {
        router.replace(STUDENT_ROUTES.dashboard as never);
        return;
      }

      const proj = envelope.project;
      setProject(proj);

      const owner =
        envelope.role === "owner" ||
        proj.isOwner === true ||
        proj.ownerId === me.profileId;
      const members = proj.members ?? [];
      const leader = members.some(
        (m) => m.role === "leader" && m.studentId === me.profileId,
      );

      if (owner || leader) {
        const [matches, sent] = await Promise.all([
          getRecommendedStudents(proj.id),
          owner ? getSentProjectInvitations(proj.id) : Promise.resolve([]),
        ]);
        setAiTeammates(matches);
        setPendingInviteIds(
          new Set(sent.filter((inv) => inv.status.toLowerCase() === "pending").map((inv) => inv.receiverId)),
        );
      } else {
        setAiTeammates([]);
        setPendingInviteIds(new Set());
      }
    } catch (err) {
      Alert.alert("Could not load workspace", parseApiErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkspace(true);
    setRefreshing(false);
  }, [loadWorkspace]);

  const isOwner = useMemo(() => {
    if (!project) return envelopeRole === "owner";
    if (profileId == null) return envelopeRole === "owner" || project.isOwner === true;
    return envelopeRole === "owner" || project.isOwner === true || project.ownerId === profileId;
  }, [envelopeRole, profileId, project]);

  const canManageTeam = useMemo(() => {
    if (!project || profileId == null) return false;
    return (
      isOwner ||
      (project.members ?? []).some((m) => m.role === "leader" && m.studentId === profileId)
    );
  }, [isOwner, profileId, project]);

  const handleInvite = async (studentId: number) => {
    if (!project) return;
    setInvitingStudentId(studentId);
    try {
      await inviteStudentToProject(project.id, studentId);
      Alert.alert("Invitation sent", "The student has been invited to your project.");
      const sent = await getSentProjectInvitations(project.id);
      setPendingInviteIds(
        new Set(sent.filter((inv) => inv.status.toLowerCase() === "pending").map((inv) => inv.receiverId)),
      );
      await loadWorkspace(true);
    } catch (err) {
      Alert.alert("Invitation failed", parseApiErrorMessage(err));
    } finally {
      setInvitingStudentId(null);
    }
  };

  if (loading || !project) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading workspace…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stageLabel = projectTypeLabel(project.projectType, faculty, major);
  const statusLabel = deriveProjectStatus(project);
  const seatsLeft = Math.max(0, project.partnersCount - project.currentMembers);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <MobileNavHeader
        title="Graduation project"
        fallbackHref={STUDENT_ROUTES.dashboard}
        backColor={colors.foreground}
        titleColor={colors.foreground}
        backgroundColor={colors.background}
        borderColor={colors.border}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: layout.space("md"),
          paddingBottom: layout.space("xl"),
          gap: layout.space("md"),
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
        }
      >
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{stageLabel}</Text>
          </View>
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={[styles.badgeText, styles.badgeSuccessText]}>{statusLabel}</Text>
          </View>
          {isOwner ? (
            <View style={styles.badgeOutline}>
              <Text style={styles.badgeOutlineText}>Owner</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, { fontSize: layout.fontSize.title }]}>{project.name}</Text>
        <Text style={styles.description}>
          {(project.abstract ?? project.description ?? "").trim() || "No project abstract provided yet."}
        </Text>

        <HubSectionCard title="Required skills">
          {project.requiredSkills && project.requiredSkills.length > 0 ? (
            <ChipList items={project.requiredSkills} />
          ) : (
            <Text style={styles.muted}>No required skills listed.</Text>
          )}
        </HubSectionCard>

        <HubSectionCard title="Team" description={`${project.currentMembers} / ${project.partnersCount} members`}>
          <View style={{ gap: layout.space("sm") }}>
            {(project.members ?? []).map((member) => (
              <Pressable
                key={member.studentId}
                style={[styles.memberRow, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
                onPress={() => {
                  if (member.userId) {
                    router.push(studentDirectoryProfilePath(member.userId) as never);
                  }
                }}
                disabled={!member.userId}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{profileInitialsFromName(member.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberMeta}>
                    {[member.major, member.university].filter(Boolean).join(" · ") || member.role}
                  </Text>
                </View>
              </Pressable>
            ))}
            {seatsLeft > 0 ? (
              <Text style={styles.muted}>{seatsLeft} open seat{seatsLeft === 1 ? "" : "s"} remaining</Text>
            ) : null}
          </View>
        </HubSectionCard>

        {canManageTeam ? (
          <HubSectionCard
            title="Suggested teammates"
            description="Ranked by skill complement, availability, and project relevance."
          >
            {aiTeammates.length === 0 ? (
              <Text style={styles.muted}>No recommendations yet. Try refreshing once your project profile is complete.</Text>
            ) : (
              <View style={{ gap: layout.space("md") }}>
                {aiTeammates.map((student, index) => {
                  const invited = pendingInviteIds.has(student.studentId);
                  const busy = invitingStudentId === student.studentId;
                  return (
                    <View
                      key={student.studentId}
                      style={[styles.matchCard, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
                    >
                      <Text style={styles.matchRank}>
                        #{index + 1} {index === 0 ? "Best Match" : "Match"} · {student.matchScore}%
                      </Text>
                      <Text style={styles.memberName}>{student.name}</Text>
                      <Text style={styles.memberMeta}>
                        {[student.major, student.university].filter(Boolean).join(" · ")}
                      </Text>
                      {student.skills.length > 0 ? <ChipList items={student.skills.slice(0, 5)} /> : null}
                      {student.reason ? <Text style={styles.reason}>{student.reason}</Text> : null}
                      {isOwner ? (
                        <Pressable
                          style={[styles.inviteBtn, { borderRadius: layout.radius.input }]}
                          disabled={project.isFull || invited || busy}
                          onPress={() => void handleInvite(student.studentId)}
                        >
                          {busy ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={styles.inviteBtnText}>
                              {invited ? "Invited" : project.isFull ? "Team full" : "Invite"}
                            </Text>
                          )}
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </HubSectionCard>
        ) : null}

        {isOwner ? (
          <Pressable
            style={[styles.editBtn, { borderRadius: layout.radius.button }]}
            onPress={() =>
              router.push({
                pathname: STUDENT_ROUTES.createGraduationProject,
                params: { editProjectId: String(project.id) },
              } as never)
            }
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit Project</Text>
          </Pressable>
        ) : null}

        <Text style={styles.stageFooter}>{resolveProjectTypeLabel(project)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  badgeSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  badgeSuccessText: {
    color: colors.association,
  },
  badgeOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeOutlineText: {
    color: colors.foreground,
    fontWeight: "600",
    fontSize: 12,
  },
  title: {
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.4,
  },
  description: {
    color: colors.muted,
    lineHeight: 22,
    fontSize: 15,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  memberRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontWeight: "800",
    color: colors.primary,
    fontSize: 13,
  },
  memberName: {
    fontWeight: "700",
    color: colors.foreground,
    fontSize: 15,
  },
  memberMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  matchCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    gap: 8,
  },
  matchRank: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  reason: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  inviteBtn: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    minHeight: 40,
    marginTop: 4,
  },
  inviteBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 12,
    minHeight: 44,
  },
  editBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  stageFooter: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
});
