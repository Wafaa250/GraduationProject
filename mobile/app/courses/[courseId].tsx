import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getMe } from "@/api/meApi";
import {
  getCourseEnrollmentStudents,
  getCourseProjectMyTeam,
  getEligibleStudentCourseProjects,
  getEnrolledCourses,
  getManualTeamStudents,
  getStudentCourseAnnouncements,
  getStudentCourseDetail,
} from "@/api/studentCoursesApi";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  buildClassmateTeamStatusMap,
  buildCourseOverviewSummary,
  countSectionStudents,
  mapClassmates,
  mapDetailToModel,
  mapEnrolledToCard,
  mapProjects,
  type ManageClassmateModel,
  type ManageCourseDetailModel,
  type ManageProjectModel,
} from "@/lib/studentManageCourses";
import { studentCourseProjectPath, studentDirectoryProfilePath, STUDENT_ROUTES } from "@/lib/studentRoutes";

type TabKey = "overview" | "projects" | "classmates" | "announcements";

export default function StudentCourseDetailScreen() {
  const layout = useResponsiveLayout();
  const { courseId: courseIdParam } = useLocalSearchParams<{ courseId: string }>();
  const courseId = Number(courseIdParam);
  const validId = Number.isFinite(courseId) && courseId > 0;

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");
  const [course, setCourse] = useState<ManageCourseDetailModel | null>(null);
  const [projects, setProjects] = useState<ManageProjectModel[]>([]);
  const [classmates, setClassmates] = useState<ManageClassmateModel[]>([]);
  const [announcements, setAnnouncements] = useState<
    { id: number; title: string; message: string; doctor: string; date: string }[]
  >([]);

  const overview = useMemo(
    () => (course ? buildCourseOverviewSummary(classmates, projects, announcements) : null),
    [course, classmates, projects, announcements],
  );

  const loadDetail = useCallback(async () => {
    if (!validId) return;
    setLoading(true);
    try {
      const [enrolled, me, detail, students] = await Promise.all([
        getEnrolledCourses(),
        getMe(),
        getStudentCourseDetail(courseId),
        getCourseEnrollmentStudents(courseId),
      ]);

      const enrollment = enrolled.find((c) => c.courseId === courseId);
      if (!enrollment) {
        router.replace(STUDENT_ROUTES.studentCourses as never);
        return;
      }

      const projectsEligible = await getEligibleStudentCourseProjects(courseId, detail.mySectionId);
      const index = enrolled.findIndex((c) => c.courseId === courseId);
      const baseCard = mapEnrolledToCard(
        enrollment,
        index >= 0 ? index : 0,
        {
          students: countSectionStudents(students, detail.mySectionId),
          projects: projectsEligible.length,
        },
        detail,
      );
      const model = mapDetailToModel(baseCard, detail, "");
      model.students = countSectionStudents(students, detail.mySectionId);
      model.projects = projectsEligible.length;

      const projectIds = projectsEligible.map((p) => p.id);
      const announcementRows = await getStudentCourseAnnouncements(projectIds, detail.doctorName);

      const sectionPeers = students.filter(
        (s) => s.sectionId === detail.mySectionId && s.studentId !== me.profileId,
      );
      const teamStatusByStudentId = await buildClassmateTeamStatusMap(
        courseId,
        projectsEligible,
        sectionPeers.map((s) => s.studentId),
        me.profileId ?? null,
        {
          getMyTeam: getCourseProjectMyTeam,
          getManualStudents: getManualTeamStudents,
        },
      );

      setCourse(model);
      setProjects(mapProjects(courseId, projectsEligible));
      setClassmates(
        mapClassmates(courseId, students, detail.mySectionId, me.profileId, teamStatusByStudentId),
      );
      setAnnouncements(announcementRows);
    } catch (err) {
      Alert.alert("Could not load course", parseApiErrorMessage(err));
      router.replace(STUDENT_ROUTES.studentCourses as never);
    } finally {
      setLoading(false);
    }
  }, [courseId, validId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (!validId || loading || !course) {
    return (
      <StudentWorkspaceScreen title="Course" subtitle="Loading course details…">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </StudentWorkspaceScreen>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "projects", label: "Projects" },
    { key: "classmates", label: "Classmates" },
    { key: "announcements", label: "Announcements" },
  ];

  return (
    <StudentWorkspaceScreen title={course.name} subtitle={`${course.code} · Section ${course.section}`}>
      <Pressable style={styles.backBtn} onPress={() => router.replace(STUDENT_ROUTES.studentCourses as never)}>
        <Ionicons name="arrow-back" size={16} color={HUB_COLORS.muted} />
        <Text style={styles.backText}>Back to My Courses</Text>
      </Pressable>

      <HubSectionCard title={course.doctor} description={course.description}>
        <Text style={styles.metaLine}>Schedule: {course.schedule}</Text>
        <Text style={styles.metaLine}>{course.students} students in your section</Text>
      </HubSectionCard>

      <View style={[styles.tabs, { gap: layout.space("sm") }]}>
        {tabs.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.tabBtn, tab === item.key && styles.tabBtnActive]}
            onPress={() => setTab(item.key)}
          >
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "overview" && overview ? (
        <HubSectionCard title="Overview">
          <Text style={styles.overviewLine}>Classmates in section: {overview.classmatesInSection}</Text>
          <Text style={styles.overviewLine}>Available projects: {overview.availableProjects}</Text>
          <Text style={styles.overviewLine}>Team status: {overview.teamStatusSummary}</Text>
          <Text style={styles.overviewLine}>Latest announcement: {overview.latestAnnouncementLabel}</Text>
        </HubSectionCard>
      ) : null}

      {tab === "projects" ? (
        <HubSectionCard title="Course projects">
          {projects.length === 0 ? (
            <Text style={styles.emptyText}>No projects available in your section yet.</Text>
          ) : (
            <View style={{ gap: layout.space("md") }}>
              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  style={[styles.projectRow, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
                  onPress={() =>
                    router.push(studentCourseProjectPath(courseId, Number(project.id)) as never)
                  }
                >
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectMeta}>{project.teamStatus}</Text>
                  <Text style={styles.projectMeta}>{project.type}</Text>
                  {project.skills.length > 0 ? <ChipList items={project.skills.slice(0, 4)} /> : null}
                </Pressable>
              ))}
            </View>
          )}
        </HubSectionCard>
      ) : null}

      {tab === "classmates" ? (
        <HubSectionCard title="Classmates">
          {classmates.length === 0 ? (
            <Text style={styles.emptyText}>No classmates found in your section.</Text>
          ) : (
            <View style={{ gap: layout.space("sm") }}>
              {classmates.map((mate) => (
                <Pressable
                  key={mate.id}
                  style={[styles.classmateRow, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
                  onPress={() => {
                    if (mate.userId) {
                      router.push(studentDirectoryProfilePath(mate.userId) as never);
                    }
                  }}
                  disabled={!mate.userId}
                >
                  <Text style={styles.classmateName}>{mate.name}</Text>
                  <Text style={styles.classmateMeta}>{mate.major}</Text>
                  <Text style={styles.classmateMeta}>{mate.teamStatus}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </HubSectionCard>
      ) : null}

      {tab === "announcements" ? (
        <HubSectionCard title="Announcements">
          {announcements.length === 0 ? (
            <Text style={styles.emptyText}>No announcements yet.</Text>
          ) : (
            <View style={{ gap: layout.space("md") }}>
              {announcements.map((item) => (
                <View key={item.id} style={styles.announcementRow}>
                  <Text style={styles.announcementTitle}>{item.title}</Text>
                  <Text style={styles.announcementMeta}>
                    {item.doctor} · {item.date}
                  </Text>
                  <Text style={styles.announcementBody}>{item.message}</Text>
                </View>
              ))}
            </View>
          )}
        </HubSectionCard>
      ) : null}
    </StudentWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -8,
  },
  backText: {
    color: HUB_COLORS.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  metaLine: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: HUB_COLORS.inputBg,
  },
  tabBtnActive: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
  },
  tabText: {
    color: HUB_COLORS.muted,
    fontWeight: "600",
    fontSize: 13,
  },
  tabTextActive: {
    color: HUB_COLORS.foreground,
  },
  overviewLine: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  projectRow: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.background,
    gap: 4,
  },
  projectTitle: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    fontSize: 15,
  },
  projectMeta: {
    color: HUB_COLORS.muted,
    fontSize: 13,
  },
  classmateRow: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.background,
    gap: 2,
  },
  classmateName: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  classmateMeta: {
    color: HUB_COLORS.muted,
    fontSize: 13,
  },
  announcementRow: {
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HUB_COLORS.border,
    paddingBottom: 12,
  },
  announcementTitle: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  announcementMeta: {
    color: HUB_COLORS.muted,
    fontSize: 12,
  },
  announcementBody: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
  },
});
