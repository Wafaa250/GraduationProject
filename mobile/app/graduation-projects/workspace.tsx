import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { listDoctorsDirectory, type DoctorDirectoryEntry } from "@/api/doctorDirectoryApi";
import {
  changeProjectLeader,
  deriveProjectStatus,
  getGraduationProjectAbstractFile,
  getGraduationProjectsMyEnvelope,
  getPendingSupervisorDoctorId,
  getRecommendedStudents,
  getRecommendedSupervisors,
  inviteStudentToProject,
  leaveGraduationProject,
  removeProjectMember,
  requestProjectSupervisor,
  resolveProjectTypeLabel,
  type GradProject,
  type GradProjectAbstractFile,
  type GradProjectRecommendedStudent,
  type GradProjectRecommendedSupervisor,
} from "@/api/gradProjectApi";
import {
  cancelProjectInvitation,
  getSentProjectInvitations,
  type SentProjectInvitation,
} from "@/api/invitationsApi";
import { getMe } from "@/api/meApi";
import { getAbstractDisplayText } from "@/lib/graduationProjectAbstractDocument";
import { ChipList } from "@/components/student/ChipList";
import { MySupervisorSection } from "@/components/student/MySupervisorSection";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { projectTypeLabel } from "@/lib/graduationProjectTypes";
import { profileInitialsFromName } from "@/lib/profileAvatar";
import {
  browseProjectStudentsPath,
  studentDirectoryProfilePath,
  STUDENT_ROUTES,
} from "@/lib/studentRoutes";

type SentInvitationTab = "pending" | "accepted" | "rejected";

function formatInviteDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function resolveDoctorProfileUserId(
  supervisor: GradProjectRecommendedSupervisor,
  directory: DoctorDirectoryEntry[],
): number | null {
  if (supervisor.userId != null && supervisor.userId > 0) return supervisor.userId;
  const match = directory.find((d) => d.profileId === supervisor.doctorId);
  return match?.userId ?? null;
}

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
  const [abstractFile, setAbstractFile] = useState<GradProjectAbstractFile | null>(null);
  const [supervisors, setSupervisors] = useState<GradProjectRecommendedSupervisor[]>([]);
  const [doctorDirectory, setDoctorDirectory] = useState<DoctorDirectoryEntry[]>([]);
  const [requestingDoctorId, setRequestingDoctorId] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [promotingMemberId, setPromotingMemberId] = useState<number | null>(null);
  const [leavingProject, setLeavingProject] = useState(false);
  const [sentInvitations, setSentInvitations] = useState<SentProjectInvitation[]>([]);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<number | null>(null);
  const [invitationTab, setInvitationTab] = useState<SentInvitationTab>("pending");

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

      const [abstract, sent] = await Promise.all([
        getGraduationProjectAbstractFile(proj.id, proj),
        owner ? getSentProjectInvitations(proj.id) : Promise.resolve([]),
      ]);
      setAbstractFile(abstract);
      setSentInvitations(owner ? sent : []);

      if (owner || leader) {
        const [matches, supervisorRows, directory] = await Promise.all([
          getRecommendedStudents(proj.id),
          !proj.supervisor ? getRecommendedSupervisors(proj.id).catch(() => []) : Promise.resolve([]),
          listDoctorsDirectory().catch(() => [] as DoctorDirectoryEntry[]),
        ]);
        setAiTeammates(matches);
        setSupervisors(supervisorRows);
        setDoctorDirectory(directory);
        const pendingFromSent = new Set(
          sent.filter((inv) => inv.status.toLowerCase() === "pending").map((inv) => inv.receiverId),
        );
        for (const m of matches) {
          if (m.hasPendingInvite) pendingFromSent.add(m.studentId);
        }
        setPendingInviteIds(pendingFromSent);
      } else {
        setAiTeammates([]);
        setSupervisors([]);
        setPendingInviteIds(new Set());
        if (!owner) setSentInvitations([]);
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

  const isLeader = useMemo(() => {
    if (!project || profileId == null) return false;
    return (project.members ?? []).some(
      (m) => m.role === "leader" && m.studentId === profileId,
    );
  }, [profileId, project]);

  const canManageTeam = isOwner || isLeader;
  const canManageTeamMembers = isLeader;
  const canInvite = isOwner;
  const canViewSupervisors = isOwner || isLeader;
  const pendingSupervisorDoctorId = getPendingSupervisorDoctorId(project);

  const pendingSupervisorNotice = useMemo(() => {
    if (!project || project.supervisor || pendingSupervisorDoctorId == null) return null;
    const pending = project.pendingSupervisor;
    if (!pending) return null;
    return {
      name: pending.name?.trim() || null,
      specialization: pending.specialization?.trim() || null,
    };
  }, [pendingSupervisorDoctorId, project]);

  const invitationsByStatus = useMemo(() => {
    const pending: SentProjectInvitation[] = [];
    const accepted: SentProjectInvitation[] = [];
    const rejected: SentProjectInvitation[] = [];
    for (const inv of sentInvitations) {
      const status = inv.status.toLowerCase();
      if (status === "accepted") accepted.push(inv);
      else if (status === "rejected" || status === "cancelled" || status === "expired") {
        rejected.push(inv);
      } else if (status === "pending") pending.push(inv);
    }
    return { pending, accepted, rejected };
  }, [sentInvitations]);

  const activeSentInvitations = invitationsByStatus[invitationTab];

  const abstractText = useMemo(
    () => getAbstractDisplayText(project?.abstract ?? project?.description),
    [project],
  );

  const handleInvite = async (studentId: number) => {
    if (!project || !canInvite) return;
    setInvitingStudentId(studentId);
    try {
      await inviteStudentToProject(project.id, studentId);
      Alert.alert("Invitation sent", "The student has been invited to your project.");
      const rows = await getSentProjectInvitations(project.id);
      setSentInvitations(rows);
      await loadWorkspace(true);
    } catch (err) {
      Alert.alert("Invitation failed", parseApiErrorMessage(err));
    } finally {
      setInvitingStudentId(null);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!project || !canInvite) return;
    setCancellingInvitationId(invitationId);
    try {
      await cancelProjectInvitation(invitationId);
      Alert.alert("Invitation cancelled");
      await loadWorkspace(true);
    } catch (err) {
      Alert.alert("Could not cancel invitation", parseApiErrorMessage(err));
    } finally {
      setCancellingInvitationId(null);
    }
  };

  const handleLeaveProject = () => {
    if (!project || isOwner) return;
    Alert.alert("Leave project?", "You will be removed from this graduation project team.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          setLeavingProject(true);
          void leaveGraduationProject(project.id)
            .then(() => {
              Alert.alert("Left project", "You have left the graduation project team.");
              router.replace(STUDENT_ROUTES.dashboard as never);
            })
            .catch((err) => Alert.alert("Could not leave project", parseApiErrorMessage(err)))
            .finally(() => setLeavingProject(false));
        },
      },
    ]);
  };

  const handleRemoveMember = (memberStudentId: number, memberName: string) => {
    if (!project || !canManageTeamMembers) return;
    Alert.alert("Remove member?", `Remove ${memberName} from the team?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setRemovingMemberId(memberStudentId);
          void removeProjectMember(project.id, memberStudentId)
            .then((result) => {
              setProject((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  members: prev.members.filter((m) => m.studentId !== memberStudentId),
                  currentMembers: result.currentMembers,
                  isFull: result.currentMembers >= prev.partnersCount,
                };
              });
              Alert.alert("Member removed", result.message);
            })
            .catch((err) => Alert.alert("Could not remove member", parseApiErrorMessage(err)))
            .finally(() => setRemovingMemberId(null));
        },
      },
    ]);
  };

  const handleMakeLeader = (memberStudentId: number, memberName: string) => {
    if (!project || !canManageTeamMembers) return;
    Alert.alert("Change leader?", `Make ${memberName} the team leader?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          setPromotingMemberId(memberStudentId);
          void changeProjectLeader(project.id, memberStudentId)
            .then(() => {
              setProject((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  members: prev.members.map((m) => {
                    if (m.studentId === memberStudentId) return { ...m, role: "leader" as const };
                    if (m.role === "leader") return { ...m, role: "member" as const };
                    return m;
                  }),
                };
              });
              Alert.alert("Leader updated", "Team leadership has been transferred.");
            })
            .catch((err) => Alert.alert("Could not change leader", parseApiErrorMessage(err)))
            .finally(() => setPromotingMemberId(null));
        },
      },
    ]);
  };

  const handleViewDoctorProfile = async (supervisor: GradProjectRecommendedSupervisor) => {
    let userId = resolveDoctorProfileUserId(supervisor, doctorDirectory);
    if (!userId) {
      try {
        const directory = await listDoctorsDirectory();
        setDoctorDirectory(directory);
        userId = resolveDoctorProfileUserId(supervisor, directory);
      } catch {
        /* resolved below */
      }
    }
    if (!userId) {
      Alert.alert("Profile unavailable", "Could not resolve this doctor's profile link.");
      return;
    }
    router.push(`/doctors/${userId}` as never);
  };

  const handleRequestSupervisor = async (doctorId: number) => {
    if (!project || !canViewSupervisors || project.supervisor) return;
    if (pendingSupervisorDoctorId != null && pendingSupervisorDoctorId !== doctorId) return;
    setRequestingDoctorId(doctorId);
    try {
      await requestProjectSupervisor(project.id, doctorId);
      Alert.alert("Request sent", "Your supervision request has been sent.");
      await loadWorkspace(true);
    } catch (err) {
      Alert.alert("Request failed", parseApiErrorMessage(err));
    } finally {
      setRequestingDoctorId(null);
    }
  };

  const openAbstractFile = async () => {
    if (!abstractFile?.downloadUrl) return;
    try {
      await Linking.openURL(abstractFile.downloadUrl);
    } catch {
      Alert.alert("Could not open file", "Try again from a device with a compatible viewer.");
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
          {abstractText || "No project abstract provided yet."}
        </Text>

        {abstractFile ? (
          <Pressable
            style={[styles.fileBtn, { borderRadius: layout.radius.input }]}
            onPress={() => void openAbstractFile()}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fileBtnTitle}>{abstractFile.fileName}</Text>
              <Text style={styles.muted}>Tap to open attached document</Text>
            </View>
          </Pressable>
        ) : null}

        {project.supervisor ? <MySupervisorSection supervisor={project.supervisor} /> : null}

        {pendingSupervisorNotice ? (
          <HubSectionCard title="Supervision request pending">
            <Text style={styles.muted}>
              {pendingSupervisorNotice.name
                ? `Awaiting response from ${pendingSupervisorNotice.name}`
                : "Awaiting supervisor response"}
              {pendingSupervisorNotice.specialization
                ? ` · ${pendingSupervisorNotice.specialization}`
                : ""}
            </Text>
          </HubSectionCard>
        ) : null}

        <HubSectionCard title="Required skills">
          {project.requiredSkills && project.requiredSkills.length > 0 ? (
            <ChipList items={project.requiredSkills} />
          ) : (
            <Text style={styles.muted}>No required skills listed.</Text>
          )}
        </HubSectionCard>

        <HubSectionCard title="Team" description={`${project.currentMembers} / ${project.partnersCount} members`}>
          <View style={{ gap: layout.space("sm") }}>
            {(project.members ?? []).map((member) => {
              const isSelf = profileId != null && member.studentId === profileId;
              const showManage =
                canManageTeamMembers && !isSelf && member.role !== "leader";
              return (
                <View
                  key={member.studentId}
                  style={[styles.memberRow, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
                >
                  <Pressable
                    style={{ flex: 1, flexDirection: "row", gap: 12, alignItems: "center" }}
                    onPress={() => {
                      if (member.userId) {
                        router.push(studentDirectoryProfilePath(member.userId) as never);
                      }
                    }}
                    disabled={!member.userId}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {profileInitialsFromName(member.name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>
                        {member.name}
                        {member.role === "leader" ? " · Leader" : ""}
                      </Text>
                      <Text style={styles.memberMeta}>
                        {[member.major, member.university].filter(Boolean).join(" · ") || member.role}
                      </Text>
                    </View>
                  </Pressable>
                  {showManage ? (
                    <View style={styles.memberActions}>
                      <Pressable
                        onPress={() => handleMakeLeader(member.studentId, member.name)}
                        disabled={promotingMemberId === member.studentId}
                      >
                        <Text style={styles.memberActionText}>
                          {promotingMemberId === member.studentId ? "…" : "Leader"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleRemoveMember(member.studentId, member.name)}
                        disabled={removingMemberId === member.studentId}
                      >
                        <Text style={[styles.memberActionText, styles.memberActionDanger]}>
                          {removingMemberId === member.studentId ? "…" : "Remove"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
            {seatsLeft > 0 ? (
              <Text style={styles.muted}>{seatsLeft} open seat{seatsLeft === 1 ? "" : "s"} remaining</Text>
            ) : null}
          </View>
        </HubSectionCard>

        {isOwner && !project.isFull ? (
          <Pressable
            style={[styles.editBtn, { borderRadius: layout.radius.button }]}
            onPress={() => router.push(browseProjectStudentsPath(project.id) as never)}
          >
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <Text style={styles.editBtnText}>Browse students to invite</Text>
          </Pressable>
        ) : null}

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
                  const invited =
                    pendingInviteIds.has(student.studentId) || student.hasPendingInvite === true;
                  const busy = invitingStudentId === student.studentId;
                  const cannotInvite =
                    student.isMember === true || student.canInvite === false;
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
                      {canInvite ? (
                        <Pressable
                          style={[styles.inviteBtn, { borderRadius: layout.radius.input }]}
                          disabled={project.isFull || invited || busy || cannotInvite}
                          onPress={() => void handleInvite(student.studentId)}
                        >
                          {busy ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={styles.inviteBtnText}>
                              {invited
                                ? "Invited"
                                : cannotInvite
                                  ? "Unavailable"
                                  : project.isFull
                                    ? "Team full"
                                    : "Invite"}
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
          <HubSectionCard
            title="Manage invitations"
            description="Track every invitation you've sent."
          >
            <View style={styles.invitationTabs}>
              {(
                [
                  { key: "pending" as const, label: "Pending" },
                  { key: "accepted" as const, label: "Accepted" },
                  { key: "rejected" as const, label: "Rejected" },
                ] as const
              ).map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.invitationTab,
                    invitationTab === tab.key && styles.invitationTabActive,
                  ]}
                  onPress={() => setInvitationTab(tab.key)}
                >
                  <Text
                    style={[
                      styles.invitationTabText,
                      invitationTab === tab.key && styles.invitationTabTextActive,
                    ]}
                  >
                    {tab.label} ({invitationsByStatus[tab.key].length})
                  </Text>
                </Pressable>
              ))}
            </View>
            {activeSentInvitations.length === 0 ? (
              <Text style={styles.muted}>No {invitationTab} invitations.</Text>
            ) : (
              <View style={{ gap: layout.space("sm"), marginTop: layout.space("sm") }}>
                {activeSentInvitations.map((inv) => (
                  <View
                    key={inv.invitationId}
                    style={[
                      styles.sentInviteRow,
                      { borderRadius: layout.radius.input, padding: layout.space("md") },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{inv.receiverName}</Text>
                      <Text style={styles.memberMeta}>{formatInviteDate(inv.createdAt)}</Text>
                    </View>
                    <View style={styles.sentInviteActions}>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{inv.status}</Text>
                      </View>
                      {invitationTab === "pending" && canInvite ? (
                        <Pressable
                          onPress={() => void handleCancelInvitation(inv.invitationId)}
                          disabled={cancellingInvitationId === inv.invitationId}
                        >
                          <Text style={styles.memberActionText}>
                            {cancellingInvitationId === inv.invitationId ? "…" : "Cancel"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </HubSectionCard>
        ) : null}

        {canViewSupervisors && !project.supervisor && supervisors.length > 0 ? (
          <HubSectionCard
            title="Suggested supervisors"
            description="AI-ranked doctors for your project domain."
          >
            <View style={{ gap: layout.space("md") }}>
              {supervisors.map((doc) => {
                const isPending = pendingSupervisorDoctorId === doc.doctorId;
                const blocked =
                  pendingSupervisorDoctorId != null && pendingSupervisorDoctorId !== doc.doctorId;
                const busy = requestingDoctorId === doc.doctorId;
                return (
                  <View
                    key={doc.doctorId}
                    style={[styles.matchCard, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
                  >
                    <Text style={styles.matchRank}>{doc.matchScore}% match</Text>
                    <Text style={styles.memberName}>{doc.name}</Text>
                    {doc.specialization ? (
                      <Text style={styles.memberMeta}>{doc.specialization}</Text>
                    ) : null}
                    {doc.reason ? <Text style={styles.reason}>{doc.reason}</Text> : null}
                    <View style={styles.supervisorActions}>
                      <Pressable
                        style={[styles.secondaryBtn, { borderRadius: layout.radius.input, flex: 1 }]}
                        onPress={() => void handleViewDoctorProfile(doc)}
                      >
                        <Text style={styles.secondaryBtnText}>View profile</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.inviteBtn,
                          { borderRadius: layout.radius.input, flex: 1, marginTop: 0 },
                          (blocked || isPending) && styles.inviteBtnDisabled,
                        ]}
                        disabled={blocked || busy}
                        onPress={() => void handleRequestSupervisor(doc.doctorId)}
                      >
                        {busy ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.inviteBtnText}>
                            {isPending ? "Pending" : "Request supervision"}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
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

        {!isOwner ? (
          <Pressable
            style={[styles.leaveBtn, { borderRadius: layout.radius.button }]}
            disabled={leavingProject}
            onPress={handleLeaveProject}
          >
            {leavingProject ? (
              <ActivityIndicator color={colors.foreground} size="small" />
            ) : (
              <Text style={styles.leaveBtnText}>Leave project</Text>
            )}
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
  fileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    padding: 14,
  },
  fileBtnTitle: {
    fontWeight: "700",
    color: colors.foreground,
    fontSize: 14,
  },
  memberRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  memberActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  memberActionDanger: {
    color: "#DC2626",
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
  inviteBtnDisabled: {
    opacity: 0.55,
  },
  supervisorActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    minHeight: 40,
    backgroundColor: colors.cardBg,
  },
  secondaryBtnText: {
    color: colors.foreground,
    fontWeight: "700",
    fontSize: 13,
  },
  leaveBtn: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "rgba(254, 226, 226, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    minHeight: 44,
  },
  leaveBtnText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 15,
  },
  invitationTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  invitationTab: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.cardBg,
  },
  invitationTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  invitationTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  invitationTabTextActive: {
    color: colors.primary,
  },
  sentInviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  sentInviteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primarySoft,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "capitalize",
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
