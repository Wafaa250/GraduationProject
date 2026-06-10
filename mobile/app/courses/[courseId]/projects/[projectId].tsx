import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getCourseProjectMyTeam,
  getEligibleStudentCourseProjects,
  getStudentCourseDetail,
  type CourseMyTeamResponse,
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
  const [myTeam, setMyTeam] = useState<CourseMyTeamResponse | null>(null);

  const loadProject = useCallback(async () => {
    if (!validIds) return;
    setLoading(true);
    try {
      const detail = await getStudentCourseDetail(courseId);
      const projects = await getEligibleStudentCourseProjects(courseId, detail.mySectionId);
      const project = projects.find((p) => p.id === projectId);
      if (!project) {
        Alert.alert("Project not found", "This project is not available in your section.");
        router.replace(studentCoursePath(courseId) as never);
        return;
      }

      const parsed = parseCourseProjectDescription(project.description);
      setTitle(project.title);
      setDescription(parsed.publicDescription.trim() || "No description provided.");
      setSkills(parsed.requiredSkills);
      setTeamSize(project.teamSize);

      const team = await getCourseProjectMyTeam(projectId);
      setMyTeam(team);
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

  if (!validIds || loading) {
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
        {skills.length > 0 ? <ChipList items={skills} /> : null}
      </HubSectionCard>

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
    </StudentWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: HUB_COLORS.muted,
    fontSize: 14,
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
  },
  memberName: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  emptyText: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
  },
});
