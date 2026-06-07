import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Upload, UserPlus, Users, Plus } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
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

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  removeStudentFromSection,
  type CourseEnrolledStudent,
  type CourseProjectWithTeams,
} from "@/api/doctorCoursesApi";
import { AddStudentsSheet } from "@/components/doctor/courses/AddStudentsSheet";
import { CoursesEmptyState } from "@/components/doctor/courses/CoursesEmptyState";
import { ImportStudentsSheet } from "@/components/doctor/courses/ImportStudentsSheet";
import { CourseProjectFormSheet } from "@/components/doctor/courses/CourseProjectFormSheet";
import { SectionProjectCard } from "@/components/doctor/courses/SectionProjectCard";
import { SectionStudentRow } from "@/components/doctor/courses/SectionStudentRow";
import { CourseStatsStrip } from "@/components/doctor/courses/CourseStatsStrip";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useCourseWorkspace } from "@/hooks/useCourseWorkspace";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  filterProjectsForSection,
  filterStudentsForSection,
  filterTeamsForSection,
  formatSectionSchedule,
  getStudentAssignmentContext,
} from "@/lib/courseWorkspaceUtils";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

type SectionTab = "students" | "projects";

export default function DoctorSectionDetailScreen() {
  const { courseId: courseIdParam, sectionId: sectionIdParam } = useLocalSearchParams<{
    courseId: string;
    sectionId: string;
  }>();
  const courseId = Number(courseIdParam);
  const sectionId = Number(sectionIdParam);
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { course, bundle, pageLoading, bundleLoading, error, reload } = useCourseWorkspace(courseId);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<SectionTab>("students");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editProject, setEditProject] = useState<CourseProjectWithTeams | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (Number.isFinite(courseId)) {
        void reload();
      }
    }, [courseId, reload]),
  );

  const sectionBundle = useMemo(() => {
    if (!bundle) return null;
    const section = bundle.sections.find((s) => s.id === sectionId);
    if (!section) return null;

    const courseProjects = filterProjectsForSection(bundle.courseProjects, sectionId);
    const projectIds = new Set(courseProjects.map((p) => p.id));
    const students = filterStudentsForSection(bundle.students, sectionId);
    const teams = filterTeamsForSection(bundle.teams, projectIds);

    return {
      section,
      students,
      courseProjects,
      teams,
      allSections: bundle.sections,
    };
  }, [bundle, sectionId]);

  const sectionMissing =
    !pageLoading && !bundleLoading && bundle != null && sectionBundle == null;

  const schedule = sectionBundle
    ? formatSectionSchedule(
        sectionBundle.section.days,
        sectionBundle.section.timeFrom,
        sectionBundle.section.timeTo,
      )
    : "";

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handleRemove = (student: CourseEnrolledStudent) => {
    if (!student.sectionId) return;
    Alert.alert(
      "Remove student?",
      `Remove ${student.name ?? "this student"} from this section?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await removeStudentFromSection(student.sectionId!, student.studentId);
                Alert.alert("Student removed");
                await reload();
              } catch (err) {
                Alert.alert("Could not remove student", parseApiErrorMessage(err));
              }
            })();
          },
        },
      ],
    );
  };

  const handleEnrollmentSaved = (summary: string) => {
    Alert.alert("Enrollment updated", summary);
    void reload();
  };

  if (!Number.isFinite(courseId) || !Number.isFinite(sectionId)) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Invalid section" fallbackHref={DOCTOR_ROUTES.courses} />
        <View style={styles.center}>
          <Text style={styles.mutedText}>This section link is not valid.</Text>
        </View>
      </DoctorScreen>
    );
  }

  if (pageLoading && !bundle) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Section" fallbackHref={DOCTOR_ROUTES.courses} variant="compact" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </DoctorScreen>
    );
  }

  if (sectionMissing) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Not found" fallbackHref={DOCTOR_ROUTES.courses} variant="compact" />
        <View style={styles.center}>
          <Text style={styles.mutedText}>Section not found in this course.</Text>
        </View>
      </DoctorScreen>
    );
  }

  if (error && !sectionBundle) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Section" fallbackHref={DOCTOR_ROUTES.courses} variant="compact" />
        <View style={styles.center}>
          <Text style={styles.mutedText}>{error}</Text>
        </View>
      </DoctorScreen>
    );
  }

  if (!sectionBundle) return null;

  const { students, courseProjects } = sectionBundle;
  const assignmentBundle = { teams: sectionBundle.teams };

  const listHeader = (
    <View style={styles.listHeader}>
      <Text style={[styles.schedule, { fontSize: layout.scale(12) }]} numberOfLines={2}>
        {schedule}
      </Text>

      <CourseStatsStrip
        sections={sectionBundle.section.capacity}
        students={students.length}
        projects={courseProjects.length}
        loading={bundleLoading}
        labels={["Capacity", "Students", "Projects"]}
      />

      <View style={styles.tabBar}>
        {(["students", "projects"] as SectionTab[]).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive, { fontSize: layout.scale(13) }]}>
                {key === "students" ? "Students" : "Projects"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "students" ? (
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Users size={14} color={colors.muted} strokeWidth={2} />
            <Text style={[styles.toolbarMeta, { fontSize: layout.scale(12) }]}>
              <Text style={styles.toolbarStrong}>{students.length}</Text> enrolled
            </Text>
          </View>
          <View style={styles.toolbarActions}>
            <Pressable
              onPress={() => setAddOpen(true)}
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <UserPlus size={14} color="#fff" strokeWidth={2} />
              <Text style={[styles.primaryBtnText, { fontSize: layout.scale(12) }]}>Add</Text>
            </Pressable>
            <Pressable
              onPress={() => setImportOpen(true)}
              style={({ pressed }) => [styles.outlineBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Upload size={14} color={colors.foreground} strokeWidth={2} />
              <Text style={[styles.outlineBtnText, { fontSize: layout.scale(12) }]}>Import</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.projectsToolbar}>
          <Text style={[styles.projectsMeta, { fontSize: layout.scale(12) }]}>
            <Text style={styles.toolbarStrong}>{courseProjects.length}</Text> project
            {courseProjects.length === 1 ? "" : "s"} assigned to this section
          </Text>
          <Pressable
            onPress={() => setCreateProjectOpen(true)}
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Plus size={14} color="#fff" strokeWidth={2} />
            <Text style={[styles.primaryBtnText, { fontSize: layout.scale(12) }]}>Create project</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader
        title={sectionBundle.section.name}
        subtitle={course.name}
        fallbackHref={DOCTOR_ROUTES.courses}
        variant="compact"
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: DOCTOR_SPACE.xxxl,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={colors.primary} />
        }
      >
        {listHeader}

        {bundleLoading ? (
          <View style={styles.centerInline}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : tab === "students" ? (
          students.length === 0 ? (
            <CoursesEmptyState
              title="No students in this section"
              description="Add or import students by university ID to enroll them."
            />
          ) : (
            students.map((student) => (
              <SectionStudentRow
                key={student.studentId}
                student={student}
                assignment={getStudentAssignmentContext(student, assignmentBundle)}
                onRemove={() => handleRemove(student)}
              />
            ))
          )
        ) : courseProjects.length === 0 ? (
          <CoursesEmptyState
            title="No projects for this section"
            description="Create a course project and assign it to this section for team formation."
          />
        ) : (
          courseProjects.map((project) => (
            <SectionProjectCard
              key={project.id}
              courseId={courseId}
              sectionId={sectionId}
              project={project}
              onManage={() => setEditProject(project)}
            />
          ))
        )}
      </ScrollView>

      <AddStudentsSheet
        visible={addOpen}
        sectionId={sectionId}
        onClose={() => setAddOpen(false)}
        onSaved={handleEnrollmentSaved}
      />
      <ImportStudentsSheet
        visible={importOpen}
        sectionId={sectionId}
        onClose={() => setImportOpen(false)}
        onSaved={handleEnrollmentSaved}
        onUseManualAdd={() => setAddOpen(true)}
      />
      <CourseProjectFormSheet
        visible={createProjectOpen}
        courseId={courseId}
        sections={sectionBundle.allSections}
        defaultSectionId={sectionId}
        onClose={() => setCreateProjectOpen(false)}
        onSaved={(msg) => {
          Alert.alert("Project saved", msg ?? "Course project created");
          void reload();
        }}
      />
      <CourseProjectFormSheet
        visible={editProject != null}
        courseId={courseId}
        sections={sectionBundle.allSections}
        project={editProject}
        defaultSectionId={sectionId}
        onClose={() => setEditProject(null)}
        onSaved={(msg) => {
          Alert.alert("Project saved", msg ?? "Project updated");
          setEditProject(null);
          void reload();
        }}
      />
    </DoctorScreen>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: DOCTOR_SPACE.xl,
    },
    centerInline: {
      paddingVertical: DOCTOR_SPACE.xxxl,
      alignItems: "center",
    },
    mutedText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.muted,
      textAlign: "center",
    },
    listHeader: {
      paddingTop: DOCTOR_SPACE.sm,
      paddingBottom: DOCTOR_SPACE.md,
      gap: DOCTOR_SPACE.md,
    },
    schedule: {
      fontWeight: "600",
      color: colors.muted,
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: colors.border,
      borderRadius: DOCTOR_RADIUS.sm,
      padding: 3,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm - 2,
    },
    tabActive: {
      backgroundColor: colors.cardBg,
    },
    tabText: {
      fontWeight: "700",
      color: colors.muted,
    },
    tabTextActive: {
      color: colors.primary,
    },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: DOCTOR_SPACE.sm,
    },
    toolbarLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    toolbarMeta: {
      fontWeight: "500",
      color: colors.muted,
    },
    toolbarStrong: {
      fontWeight: "800",
      color: colors.foreground,
    },
    toolbarActions: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.xs,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: DOCTOR_SPACE.sm,
      paddingVertical: 8,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primary,
    },
    primaryBtnText: {
      fontWeight: "700",
      color: "#fff",
    },
    outlineBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: DOCTOR_SPACE.sm,
      paddingVertical: 8,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    outlineBtnText: {
      fontWeight: "700",
      color: colors.foreground,
    },
    projectsToolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: DOCTOR_SPACE.sm,
    },
    projectsMeta: {
      fontWeight: "500",
      color: colors.muted,
    },
  });
}
