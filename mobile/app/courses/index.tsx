import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getCourseEnrollmentStudents,
  getEnrolledCourses,
  getEligibleStudentCourseProjects,
  getStudentCourseAnnouncements,
  getStudentCourseDetail,
  type EnrolledCourse,
} from "@/api/studentCoursesApi";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  countSectionStudents,
  mapEnrolledToCard,
  type ManageCourseCardModel,
} from "@/lib/studentManageCourses";
import { studentCoursePath, STUDENT_ROUTES } from "@/lib/studentRoutes";

type CourseListStats = Record<number, { students: number; projects: number; announcements: number }>;

function MetricTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const layout = useResponsiveLayout();
  return (
    <View style={[styles.metricTile, { borderRadius: layout.radius.input, padding: layout.space("md"), flex: 1 }]}>
      <Ionicons name={icon} size={18} color={HUB_COLORS.primary} />
      <Text style={[styles.metricValue, { fontSize: layout.scale(26), marginTop: layout.space("sm") }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </View>
  );
}

function CourseCardRow({ course, onOpen }: { course: ManageCourseCardModel; onOpen: () => void }) {
  const layout = useResponsiveLayout();
  return (
    <Pressable
      style={[styles.courseCard, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
      onPress={onOpen}
    >
      <View style={styles.courseCardTop}>
        <Text style={styles.courseCode}>{course.code}</Text>
        <Text style={styles.courseSection}>Section {course.section}</Text>
      </View>
      <Text style={styles.courseName}>{course.name}</Text>
      <Text style={styles.courseDoctor}>{course.doctor}</Text>
      <View style={styles.courseStats}>
        <Text style={styles.courseStatText}>{course.students} students</Text>
        <Text style={styles.courseStatText}>{course.projects} projects</Text>
      </View>
      <View style={styles.openRow}>
        <Text style={styles.openText}>Open course</Text>
        <Ionicons name="arrow-forward" size={16} color={HUB_COLORS.primary} />
      </View>
    </Pressable>
  );
}

export default function StudentCoursesScreen() {
  const layout = useResponsiveLayout();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [cards, setCards] = useState<ManageCourseCardModel[]>([]);
  const [listStats, setListStats] = useState<CourseListStats>({});
  const [semesterHint, setSemesterHint] = useState("");

  const loadList = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const courses = await getEnrolledCourses();
      setEnrolled(courses);

      const semesters = [
        ...new Set(courses.map((c) => c.semester?.trim()).filter(Boolean) as string[]),
      ];
      setSemesterHint(semesters.length === 1 ? semesters[0] : semesters.length > 1 ? "Current term" : "");

      const stats: CourseListStats = {};
      const cardModels = await Promise.all(
        courses.map(async (course, index) => {
          try {
            const detail = await getStudentCourseDetail(course.courseId);
            const [students, allProjects] = await Promise.all([
              getCourseEnrollmentStudents(course.courseId),
              getEligibleStudentCourseProjects(course.courseId, detail.mySectionId),
            ]);
            const projects = allProjects;
            const sectionStudents = countSectionStudents(students, detail.mySectionId);
            const projectIds = projects.map((p) => p.id);
            const announcements = await getStudentCourseAnnouncements(projectIds, course.doctorName);
            stats[course.courseId] = {
              students: sectionStudents,
              projects: projects.length,
              announcements: announcements.length,
            };
            return mapEnrolledToCard(course, index, stats[course.courseId], detail);
          } catch {
            stats[course.courseId] = { students: 0, projects: 0, announcements: 0 };
            return mapEnrolledToCard(course, index, stats[course.courseId]);
          }
        }),
      );

      setListStats(stats);
      setCards(cardModels);
    } catch (err) {
      Alert.alert("Could not load courses", parseApiErrorMessage(err));
      setEnrolled([]);
      setCards([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadList(true);
    setRefreshing(false);
  }, [loadList]);

  const totals = useMemo(() => {
    let projects = 0;
    let announcements = 0;
    for (const course of enrolled) {
      const s = listStats[course.courseId];
      if (s) {
        projects += s.projects;
        announcements += s.announcements;
      }
    }
    return {
      courses: enrolled.length,
      projects,
      classmates: cards.reduce((sum, c) => sum + c.students, 0),
      announcements,
    };
  }, [enrolled, listStats, cards]);

  if (loading) {
    return (
      <StudentWorkspaceScreen
        title="Manage My Courses"
        subtitle="Loading your enrolled courses…"
        showBack
        fallbackHref={STUDENT_ROUTES.dashboard}
        navTitle="Courses"
      >
        <ActivityIndicator color={HUB_COLORS.primary} />
      </StudentWorkspaceScreen>
    );
  }

  return (
    <StudentWorkspaceScreen
      title="Manage My Courses"
      subtitle="View your enrolled courses, sections, classmates, projects, and course updates."
      showBack
      fallbackHref={STUDENT_ROUTES.dashboard}
      navTitle="Courses"
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      <View style={[styles.metricsRow, { gap: layout.space("md") }]}>
        <MetricTile label="Enrolled Courses" value={totals.courses} hint={semesterHint || undefined} icon="book-outline" />
        <MetricTile label="Active Projects" value={totals.projects} hint="Across all courses" icon="folder-open-outline" />
      </View>
      <View style={[styles.metricsRow, { gap: layout.space("md") }]}>
        <MetricTile label="Classmates" value={totals.classmates} hint="In your sections" icon="people-outline" />
        <MetricTile label="Announcements" value={totals.announcements} hint="Course updates" icon="megaphone-outline" />
      </View>

      <HubSectionCard title="Your courses" description="All courses you're enrolled in this semester.">
        {cards.length === 0 ? (
          <Text style={styles.emptyText}>
            You aren&apos;t enrolled in any courses for this semester. Once registration is complete, your courses will
            show up here.
          </Text>
        ) : (
          <View style={{ gap: layout.space("md") }}>
            {cards.map((course) => (
              <CourseCardRow
                key={course.id}
                course={course}
                onOpen={() => router.push(studentCoursePath(course.courseId) as never)}
              />
            ))}
          </View>
        )}
      </HubSectionCard>
    </StudentWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    width: "100%",
  },
  metricTile: {
    backgroundColor: HUB_COLORS.background,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
  },
  metricValue: {
    fontWeight: "800",
    color: HUB_COLORS.foreground,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: HUB_COLORS.muted,
    marginTop: 2,
  },
  metricHint: {
    fontSize: 11,
    color: HUB_COLORS.muted,
    marginTop: 2,
  },
  courseCard: {
    backgroundColor: HUB_COLORS.background,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    gap: 6,
  },
  courseCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseCode: {
    fontSize: 12,
    fontWeight: "700",
    color: HUB_COLORS.primary,
  },
  courseSection: {
    fontSize: 12,
    color: HUB_COLORS.muted,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  courseDoctor: {
    fontSize: 13,
    color: HUB_COLORS.muted,
  },
  courseStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  courseStatText: {
    fontSize: 12,
    color: HUB_COLORS.muted,
    fontWeight: "600",
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  openText: {
    color: HUB_COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  emptyText: {
    color: HUB_COLORS.muted,
    lineHeight: 22,
    fontSize: 14,
  },
});
