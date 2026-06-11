import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  acceptTeamInvitation,
  getAiTeamRecommendations,
  getCourseEnrollmentStudents,
  getCourseProjectMyTeam,
  getEligibleStudentCourseProjects,
  getEligibleTeamInvitations,
  getManualTeamStudents,
  getStudentCourseDetail,
  getStudentCourseProjects,
  rejectTeamInvitation,
  sendManualTeamRequest,
  type AiTeamRecommendation,
  type CourseEnrollmentStudent,
  type CourseMyTeamResponse,
  type ManualTeamStudent,
  type StudentCourseProject,
  type TeamInvitationItem,
} from "@/api/studentCoursesApi";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { StudentLedTeamFormationPanel } from "@/components/student/team-formation/StudentLedTeamFormationPanel";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { filterEligibleCourseProjects } from "@/lib/courseProjectEligibility";
import { parseCourseProjectDescription } from "@/lib/courseProjectDescription";
import { formatAiMode } from "@/lib/courseWorkspaceUtils";
import { openCourseTeamChat } from "@/lib/openCourseTeamChat";
import { formatProjectSectionsLabel, initialsFromName } from "@/lib/studentManageCourses";
import {
  studentCoursePath,
  studentDirectoryProfilePath,
  studentMessageThreadPath,
} from "@/lib/studentRoutes";

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
  const [courseName, setCourseName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [mySectionName, setMySectionName] = useState("");
  const [project, setProject] = useState<StudentCourseProject | null>(null);
  const [myTeam, setMyTeam] = useState<CourseMyTeamResponse | null>(null);
  const [roster, setRoster] = useState<ManualTeamStudent[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiTeamRecommendation[]>([]);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [enrollmentByStudentId, setEnrollmentByStudentId] = useState<
    Record<number, CourseEnrollmentStudent>
  >({});
  const [receivedInvites, setReceivedInvites] = useState<TeamInvitationItem[]>([]);
  const [sentPending, setSentPending] = useState<ManualTeamStudent[]>([]);
  const [inviteBusyId, setInviteBusyId] = useState<number | null>(null);
  const [invitationBusyId, setInvitationBusyId] = useState<number | null>(null);

  const aiMode = project?.aiMode?.trim().toLowerCase() === "student" ? "student" : "doctor";
  const isDoctorLed = aiMode === "doctor";
  const isStudentLed = aiMode === "student";
  const hasTeam = Boolean(project?.hasTeam && myTeam);
  const showMyTeam = hasTeam && myTeam != null;
  const showDoctorWaiting = isDoctorLed && !hasTeam;
  const showFindTeammates = isStudentLed && !hasTeam;

  const parsed = useMemo(
    () => parseCourseProjectDescription(project?.description),
    [project?.description],
  );

  const teamStatusLabel = isDoctorLed
    ? hasTeam
      ? "Assigned by Doctor"
      : "Waiting for team generation"
    : hasTeam
      ? "Team formed"
      : "Form your team";

  const load = useCallback(async () => {
    if (!validIds) return;
    setLoading(true);
    try {
      const [detail, allProjects, students, team, allInvites] = await Promise.all([
        getStudentCourseDetail(courseId),
        getStudentCourseProjects(courseId),
        getCourseEnrollmentStudents(courseId),
        getCourseProjectMyTeam(projectId),
        getEligibleTeamInvitations(),
      ]);

      const eligibleProjects = filterEligibleCourseProjects(allProjects, detail.mySectionId);
      const match =
        eligibleProjects.find((p) => p.id === projectId) ??
        (await getEligibleStudentCourseProjects(courseId, detail.mySectionId)).find(
          (p) => p.id === projectId,
        );
      if (!match) {
        Alert.alert("Project not found", "This project is not available in your section.");
        router.replace(studentCoursePath(courseId) as never);
        return;
      }

      setCourseName(detail.name);
      setDoctorName(detail.doctorName);
      setMySectionName(detail.mySectionName);
      setProject(match);
      setMyTeam(team);

      const byId: Record<number, CourseEnrollmentStudent> = {};
      for (const s of students) byId[s.studentId] = s;
      setEnrollmentByStudentId(byId);

      if (match.aiMode?.trim().toLowerCase() === "student" && !match.hasTeam) {
        const manual = await getManualTeamStudents(courseId, projectId);
        setRoster(manual.students);
        setSentPending(
          manual.students.filter(
            (s) => s.hasPendingRequest && s.availabilityStatus === "pending",
          ),
        );
        setReceivedInvites(
          allInvites.filter((i) => i.courseId === courseId && i.projectId === projectId),
        );
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
    void load();
  }, [load]);

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
      setSentPending(
        manual.students.filter(
          (s) => s.hasPendingRequest && s.availabilityStatus === "pending",
        ),
      );
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
      Alert.alert("Invitation accepted", "You have joined the team.");
      await load();
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
      Alert.alert("Invitation declined", "The invitation was declined.");
      setReceivedInvites((prev) => prev.filter((i) => i.invitationId !== invitationId));
    } catch (err) {
      Alert.alert("Could not decline", parseApiErrorMessage(err));
    } finally {
      setInvitationBusyId(null);
    }
  };

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

  const publicDescription =
    parsed.publicDescription.trim() || "No description provided.";
  const teamMembers = myTeam?.members ?? [];
  const teamName = myTeam ? `Team ${myTeam.teamIndex + 1}` : null;

  return (
    <StudentWorkspaceScreen
      title={project.title}
      subtitle="Course project details"
      showBack
      fallbackHref={studentCoursePath(courseId)}
      navTitle="Project"
    >
      <ScrollView
        contentContainerStyle={{ gap: layout.space("md"), paddingBottom: layout.space("xl") }}
        keyboardShouldPersistTaps="handled"
      >
        <HubSectionCard title="Project overview" description={publicDescription}>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>{formatAiMode(aiMode)}</Text>
            <Text style={styles.badgeOutline}>{teamStatusLabel}</Text>
          </View>
          <View style={styles.metaGrid}>
            <MetaItem label="Team size" value={String(project.teamSize)} />
            <MetaItem label="AI mode" value={formatAiMode(aiMode)} />
            <MetaItem label="Instructor" value={doctorName} />
            <MetaItem label="Course" value={courseName} />
            <MetaItem label="Your section" value={mySectionName} />
            <MetaItem label="Project sections" value={formatProjectSectionsLabel(project)} />
          </View>
          {parsed.requiredSkills.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.skillsLabel}>Required skills</Text>
              <ChipList items={parsed.requiredSkills} />
            </View>
          ) : null}
        </HubSectionCard>

        {showMyTeam && myTeam ? (
          <HubSectionCard title="My team">
            <View style={styles.teamHeader}>
              <View style={{ flex: 1 }}>
                {teamName ? <Text style={styles.teamLabel}>{teamName}</Text> : null}
                <Text style={styles.meta}>
                  {teamMembers.length} / {project.teamSize} members · {teamStatusLabel}
                </Text>
              </View>
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
            </View>

            {teamMembers.map((member) => {
              const profile = enrollmentByStudentId[member.studentId];
              const major = profile?.major?.trim() || "—";
              const skills = profile?.skills ?? member.skills ?? [];
              return (
                <Pressable
                  key={member.studentId}
                  style={[styles.memberRow, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
                  onPress={() => router.push(studentDirectoryProfilePath(member.userId) as never)}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{initialsFromName(member.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberMeta}>{major}</Text>
                    {skills.length > 0 ? (
                      <View style={{ marginTop: 6 }}>
                        <ChipList items={skills.slice(0, 6)} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </HubSectionCard>
        ) : null}

        {showDoctorWaiting ? (
          <HubSectionCard
            title="Waiting for Doctor Team Generation"
            description="Your instructor will assign teams for this project. You will be notified when your team is ready."
          >
            <Text style={styles.meta}>Check back after your instructor generates teams.</Text>
          </HubSectionCard>
        ) : null}

        {showFindTeammates ? (
          <StudentLedTeamFormationPanel
            roster={roster}
            aiSuggestions={aiSuggestions}
            aiLoaded={aiLoaded}
            aiLoading={aiLoading}
            receivedInvites={receivedInvites}
            sentPending={sentPending}
            enrollmentByStudentId={enrollmentByStudentId}
            inviteBusyId={inviteBusyId}
            invitationBusyId={invitationBusyId}
            onGenerateAi={() => void handleGenerateAi()}
            onInvite={(id) => void handleInvite(id)}
            onAcceptInvite={(id) => void handleAcceptInvite(id)}
            onRejectInvite={(id) => void handleRejectInvite(id)}
          />
        ) : null}
      </ScrollView>
    </StudentWorkspaceScreen>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: HUB_COLORS.primary,
    backgroundColor: HUB_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeOutline: {
    fontSize: 11,
    fontWeight: "700",
    color: HUB_COLORS.muted,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: {
    width: "48%",
    borderRadius: 10,
    backgroundColor: HUB_COLORS.background,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: HUB_COLORS.muted,
    letterSpacing: 0.4,
  },
  metaValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: HUB_COLORS.foreground,
  },
  skillsLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: HUB_COLORS.muted,
    marginBottom: 6,
  },
  meta: {
    color: HUB_COLORS.muted,
    fontSize: 14,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
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
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.background,
    marginTop: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HUB_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  memberName: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  memberMeta: {
    color: HUB_COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
