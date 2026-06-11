import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  acceptTeamInvitation,
  getAiTeamRecommendations,
  getCourseProjectMyTeam,
  getEligibleStudentCourseProjects,
  getEligibleTeamInvitations,
  getManualTeamStudents,
  getStudentCourseDetail,
  rejectTeamInvitation,
  sendManualTeamRequest,
  type AiTeamRecommendation,
  type CourseMyTeamResponse,
  type ManualTeamStudent,
  type StudentCourseProject,
  type TeamInvitationItem,
} from "@/api/studentCoursesApi";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { parseCourseProjectDescription } from "@/lib/courseProjectDescription";
import { openCourseTeamChat } from "@/lib/openCourseTeamChat";
import {
  studentCoursePath,
  studentDirectoryProfilePath,
  studentMessageThreadPath,
} from "@/lib/studentRoutes";

function filterSentPending(students: ManualTeamStudent[]): ManualTeamStudent[] {
  return students.filter((s) => s.hasPendingRequest && s.availabilityStatus === "pending");
}

function inviteDisabledReason(student: ManualTeamStudent | AiTeamRecommendation): string | null {
  if (student.isAlreadyInTeam) return "In a team";
  if (student.hasPendingRequest) return "Pending";
  if ("availabilityStatus" in student && student.availabilityStatus === "unavailable") {
    return student.availabilityReason || "Unavailable";
  }
  return null;
}

export default function StudentCourseProjectScreen() {
  const layout = useResponsiveLayout();
  const { courseId: courseIdParam, projectId: projectIdParam } = useLocalSearchParams<{
    courseId: string;
    projectId: string;
  }>();
  const courseId = Number(courseIdParam);
  const projectId = Number(projectIdParam);
  const validIds =
    Number.isFinite(courseId) && courseId > 0 && Number.isFinite(projectId) && projectId > 0;

  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState(0);
  const [project, setProject] = useState<StudentCourseProject | null>(null);
  const [myTeam, setMyTeam] = useState<CourseMyTeamResponse | null>(null);
  const [roster, setRoster] = useState<ManualTeamStudent[]>([]);
  const [sentPending, setSentPending] = useState<ManualTeamStudent[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiTeamRecommendation[]>([]);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [receivedInvites, setReceivedInvites] = useState<TeamInvitationItem[]>([]);
  const [inviteBusyId, setInviteBusyId] = useState<number | null>(null);
  const [invitationBusyId, setInvitationBusyId] = useState<number | null>(null);

  const aiMode = project?.aiMode?.trim().toLowerCase() === "student" ? "student" : "doctor";
  const isDoctorLed = aiMode === "doctor";
  const isStudentLed = aiMode === "student";
  const hasTeam = Boolean(project?.hasTeam && myTeam);
  const showMyTeam = hasTeam && myTeam != null;
  const showDoctorWaiting = isDoctorLed && !hasTeam;
  const showFindTeammates = isStudentLed && !hasTeam;

  const loadProject = useCallback(async () => {
    if (!validIds) return;
    setLoading(true);
    try {
      const [detail, allInvites] = await Promise.all([
        getStudentCourseDetail(courseId),
        getEligibleTeamInvitations(),
      ]);
      const projects = await getEligibleStudentCourseProjects(courseId, detail.mySectionId);
      const match = projects.find((p) => p.id === projectId);
      if (!match) {
        Alert.alert("Project not found", "This project is not available in your section.");
        router.replace(studentCoursePath(courseId) as never);
        return;
      }

      const parsed = parseCourseProjectDescription(match.description);
      setTitle(match.title);
      setDescription(parsed.publicDescription.trim() || "No description provided.");
      setSkills(parsed.requiredSkills);
      setTeamSize(match.teamSize);
      setProject(match);

      const team = await getCourseProjectMyTeam(projectId);
      setMyTeam(team);

      if (match.aiMode?.trim().toLowerCase() === "student" && !match.hasTeam) {
        const manual = await getManualTeamStudents(courseId, projectId);
        setRoster(manual.students);
        setSentPending(filterSentPending(manual.students));
        setReceivedInvites(
          allInvites.filter((i) => i.courseId === courseId && i.projectId === projectId),
        );
        setAiSuggestions([]);
        setAiLoaded(false);
      } else {
        setRoster([]);
        setSentPending([]);
        setReceivedInvites([]);
        setAiSuggestions([]);
        setAiLoaded(false);
      }
    } catch (err) {
      Alert.alert("Could not load project", parseApiErrorMessage(err));
      router.replace(studentCoursePath(courseId) as never);
    } finally {
      setLoading(false);
    }
  }, [courseId, projectId, validIds]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const handleOpenTeamChat = async () => {
    if (!myTeam?.teamId) return;
    setOpeningChat(true);
    try {
      await openCourseTeamChat(myTeam.teamId, (href) => router.push(href as never), studentMessageThreadPath);
    } catch (err) {
      Alert.alert(
        "Could not open team chat",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setOpeningChat(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!validIds) return;
    setAiLoading(true);
    try {
      const rows = await getAiTeamRecommendations(courseId, projectId);
      setAiSuggestions(rows);
      setAiLoaded(true);
    } catch (err) {
      Alert.alert("Could not load recommendations", parseApiErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  };

  const handleInvite = async (receiverId: number) => {
    if (!validIds) return;
    setInviteBusyId(receiverId);
    try {
      const res = await sendManualTeamRequest(courseId, projectId, receiverId);
      Alert.alert("Invitation sent", res.message?.trim() || "Your teammate invitation was sent.");
      const manual = await getManualTeamStudents(courseId, projectId);
      setRoster(manual.students);
      setSentPending(filterSentPending(manual.students));
    } catch (err) {
      Alert.alert("Invitation failed", parseApiErrorMessage(err));
    } finally {
      setInviteBusyId(null);
    }
  };

  const handleAcceptInvite = async (invitationId: number) => {
    setInvitationBusyId(invitationId);
    try {
      await acceptTeamInvitation(invitationId);
      Alert.alert("Invitation accepted", "You joined the team.");
      await loadProject();
    } catch (err) {
      Alert.alert("Could not accept", parseApiErrorMessage(err));
    } finally {
      setInvitationBusyId(null);
    }
  };

  const handleRejectInvite = async (invitationId: number) => {
    setInvitationBusyId(invitationId);
    try {
      await rejectTeamInvitation(invitationId);
      setReceivedInvites((prev) => prev.filter((i) => i.invitationId !== invitationId));
    } catch (err) {
      Alert.alert("Could not decline", parseApiErrorMessage(err));
    } finally {
      setInvitationBusyId(null);
    }
  };

  if (!validIds || loading || !project) {
    return (
      <StudentWorkspaceScreen
        title="Course Project"
        subtitle="Loading project details…"
        showBack
        fallbackHref={studentCoursePath(courseId)}
        navTitle="Project"
      >
        <ActivityIndicator color={HUB_COLORS.primary} />
      </StudentWorkspaceScreen>
    );
  }

  const teamMembers = myTeam?.members ?? [];
  const teamName = myTeam ? `Team ${myTeam.teamIndex + 1}` : null;
  const teamStatusLabel = isDoctorLed
    ? hasTeam
      ? "Assigned by instructor"
      : "Waiting for team generation"
    : hasTeam
      ? "Team formed"
      : "Form your team";

  return (
    <StudentWorkspaceScreen
      title={title}
      subtitle="Course project details"
      showBack
      fallbackHref={studentCoursePath(courseId)}
      navTitle="Project"
    >
      <HubSectionCard title="Project overview" description={description}>
        <Text style={styles.meta}>Team size: {teamSize}</Text>
        <Text style={styles.meta}>Status: {teamStatusLabel}</Text>
        {skills.length > 0 ? <ChipList items={skills} /> : null}
      </HubSectionCard>

      {receivedInvites.length > 0 ? (
        <HubSectionCard title="Team invitations">
          {receivedInvites.map((invite) => (
            <View key={invite.invitationId} style={[styles.inviteRow, { padding: layout.space("md") }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{invite.senderName}</Text>
                <Text style={styles.meta}>{invite.senderSection}</Text>
              </View>
              <View style={styles.inviteActions}>
                <Pressable
                  onPress={() => void handleAcceptInvite(invite.invitationId)}
                  disabled={invitationBusyId === invite.invitationId}
                  style={styles.acceptBtn}
                >
                  <Text style={styles.acceptBtnText}>
                    {invitationBusyId === invite.invitationId ? "…" : "Accept"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleRejectInvite(invite.invitationId)}
                  disabled={invitationBusyId === invite.invitationId}
                  style={styles.rejectBtn}
                >
                  <Text style={styles.rejectBtnText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </HubSectionCard>
      ) : null}

      {showDoctorWaiting ? (
        <HubSectionCard title="Team assignment">
          <Text style={styles.emptyText}>
            Your instructor will generate teams for this project. Check back after teams are published.
          </Text>
        </HubSectionCard>
      ) : null}

      {showFindTeammates ? (
        <>
          <HubSectionCard title="Find teammates">
            {roster.length === 0 ? (
              <Text style={styles.emptyText}>No classmates are available to invite right now.</Text>
            ) : (
              roster.map((student) => {
                const disabled = inviteDisabledReason(student);
                const busy = inviteBusyId === student.id;
                return (
                  <View key={student.id} style={[styles.memberRow, { padding: layout.space("md") }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{student.name}</Text>
                      <Text style={styles.meta}>{student.sectionName}</Text>
                      {student.skills.length > 0 ? (
                        <ChipList items={student.skills.slice(0, 4)} />
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => !disabled && void handleInvite(student.id)}
                      disabled={Boolean(disabled) || busy}
                      style={[styles.inviteBtn, (disabled || busy) && styles.inviteBtnDisabled]}
                    >
                      <Text style={styles.inviteBtnText}>
                        {busy ? "Sending…" : disabled ?? "Invite"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </HubSectionCard>

          <HubSectionCard title="AI team suggestions">
            {!aiLoaded ? (
              <Pressable
                onPress={() => void handleGenerateAi()}
                disabled={aiLoading}
                style={[styles.aiBtn, { opacity: aiLoading ? 0.7 : 1 }]}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.aiBtnText}>Load AI recommendations</Text>
                )}
              </Pressable>
            ) : aiSuggestions.length === 0 ? (
              <Text style={styles.emptyText}>No AI recommendations available for this project.</Text>
            ) : (
              aiSuggestions.map((student) => {
                const disabled = inviteDisabledReason(student);
                const busy = inviteBusyId === student.studentId;
                return (
                  <View key={student.studentId} style={[styles.memberRow, { padding: layout.space("md") }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{student.name}</Text>
                      <Text style={styles.meta}>
                        Match {Math.round(student.matchScore)}% · {student.sectionName}
                      </Text>
                      {student.matchReason ? (
                        <Text style={styles.reason}>{student.matchReason}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => !disabled && void handleInvite(student.studentId)}
                      disabled={Boolean(disabled) || busy}
                      style={[styles.inviteBtn, (disabled || busy) && styles.inviteBtnDisabled]}
                    >
                      <Text style={styles.inviteBtnText}>
                        {busy ? "Sending…" : disabled ?? "Invite"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </HubSectionCard>

          <HubSectionCard
            title="Pending invitations you sent"
            description="Waiting for classmates to respond to your team invitations."
          >
            {sentPending.length === 0 ? (
              <Text style={styles.emptyText}>
                No pending invitations. Invitations you send will appear here while you wait for a response.
              </Text>
            ) : (
              sentPending.map((student) => (
                <View key={student.id} style={[styles.memberRow, { padding: layout.space("md") }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{student.name}</Text>
                    <Text style={styles.meta}>{student.sectionName}</Text>
                    <Text style={styles.pendingBadge}>Pending</Text>
                  </View>
                </View>
              ))
            )}
          </HubSectionCard>
        </>
      ) : null}

      {showMyTeam ? (
        <HubSectionCard title="My team">
          {teamMembers.length === 0 ? (
            <Text style={styles.emptyText}>You are not assigned to a team for this project yet.</Text>
          ) : (
            <View style={{ gap: layout.space("sm") }}>
              <View style={styles.teamHeader}>
                <View style={{ flex: 1 }}>
                  {teamName ? <Text style={styles.teamLabel}>{teamName}</Text> : null}
                  <Text style={styles.meta}>
                    {teamMembers.length} / {teamSize} members
                  </Text>
                </View>
                {myTeam?.teamId ? (
                  <Pressable
                    onPress={() => void handleOpenTeamChat()}
                    disabled={openingChat}
                    style={({ pressed }) => [
                      styles.chatBtn,
                      { borderRadius: layout.radius.input, opacity: pressed || openingChat ? 0.85 : 1 },
                    ]}
                  >
                    {openingChat ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.chatBtnText}>Open team chat</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </View>

              {teamMembers.map((member) => (
                <Pressable
                  key={member.userId}
                  style={[styles.memberRow, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
                  onPress={() => router.push(studentDirectoryProfilePath(member.userId) as never)}
                >
                  <Text style={styles.memberName}>{member.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </HubSectionCard>
      ) : null}
    </StudentWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: HUB_COLORS.muted,
    fontSize: 14,
  },
  reason: {
    color: HUB_COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  teamLabel: {
    fontWeight: "800",
    color: HUB_COLORS.foreground,
    fontSize: 15,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: HUB_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  memberRow: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.background,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  inviteRow: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.background,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  memberName: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: HUB_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: HUB_COLORS.muted,
    fontWeight: "600",
    fontSize: 12,
  },
  inviteBtn: {
    backgroundColor: HUB_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteBtnDisabled: {
    opacity: 0.45,
  },
  inviteBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  aiBtn: {
    backgroundColor: HUB_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  aiBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyText: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  pendingBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
