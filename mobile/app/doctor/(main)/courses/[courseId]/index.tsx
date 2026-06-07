import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { Plus } from "lucide-react-native";
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
import { deleteCourseSection, type CourseSection } from "@/api/doctorCoursesApi";
import { CourseSectionCard } from "@/components/doctor/courses/CourseSectionCard";
import { CourseStatsStrip } from "@/components/doctor/courses/CourseStatsStrip";
import { CoursesEmptyState } from "@/components/doctor/courses/CoursesEmptyState";
import { SectionFormSheet } from "@/components/doctor/courses/SectionFormSheet";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useCourseWorkspace } from "@/hooks/useCourseWorkspace";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { courseSubtitle } from "@/lib/doctorCourseUi";
import { DOCTOR_ROUTES, doctorSectionPath } from "@/lib/doctorRoutes";

export default function DoctorCourseDetailScreen() {
  const { courseId: idParam } = useLocalSearchParams<{ courseId: string }>();
  const courseId = Number(idParam);
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { course, bundle, pageLoading, bundleLoading, error, reload } = useCourseWorkspace(courseId);
  const [refreshing, setRefreshing] = useState(false);
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (Number.isFinite(courseId)) {
        void reload();
      }
    }, [courseId, reload]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionFormOpen(true);
  };

  const openEditSection = (section: CourseSection) => {
    setEditingSection(section);
    setSectionFormOpen(true);
  };

  const handleDeleteSection = (section: CourseSection) => {
    Alert.alert(`Delete "${section.name}"?`, "Students and section data will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteCourseSection(section.id);
              Alert.alert("Section deleted");
              await reload();
            } catch (err) {
              Alert.alert("Could not delete section", parseApiErrorMessage(err));
            }
          })();
        },
      },
    ]);
  };

  if (!Number.isFinite(courseId)) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Invalid course" fallbackHref={DOCTOR_ROUTES.courses} />
        <View style={styles.center}>
          <Text style={styles.mutedText}>This course link is not valid.</Text>
        </View>
      </DoctorScreen>
    );
  }

  if (pageLoading && !bundle) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Course" fallbackHref={DOCTOR_ROUTES.courses} variant="compact" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </DoctorScreen>
    );
  }

  if (error && !bundle) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Course" fallbackHref={DOCTOR_ROUTES.courses} variant="compact" />
        <View style={styles.center}>
          <Text style={styles.mutedText}>{error}</Text>
        </View>
      </DoctorScreen>
    );
  }

  const sections = bundle?.sections ?? [];
  const headerRight = (
    <Pressable
      onPress={openCreateSection}
      hitSlop={8}
      style={({ pressed }) => [styles.headerAction, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel="Create section"
    >
      <Plus size={22} color={colors.primary} strokeWidth={2.2} />
    </Pressable>
  );

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader
        title={course.name || "Course"}
        subtitle={courseSubtitle({ code: course.code, semester: course.semester })}
        fallbackHref={DOCTOR_ROUTES.courses}
        variant="compact"
        rightSlot={headerRight}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: DOCTOR_SPACE.xxxl,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={colors.primary} />
        }
      >
        <CourseStatsStrip
          sections={course.sections}
          students={course.students}
          projects={course.projects}
          loading={bundleLoading}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { fontSize: layout.scale(16) }]}>Sections</Text>
            <Text style={[styles.sectionHint, { fontSize: layout.scale(12) }]}>
              Students and course projects are managed inside each section.
            </Text>
          </View>
          <Pressable
            onPress={openCreateSection}
            style={({ pressed }) => [styles.createBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Plus size={16} color="#fff" strokeWidth={2.2} />
            <Text style={[styles.createBtnText, { fontSize: layout.scale(13) }]}>Create</Text>
          </Pressable>
        </View>

        {bundleLoading && sections.length === 0 ? (
          <View style={styles.centerInline}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : sections.length === 0 ? (
          <CoursesEmptyState
            title="No sections yet"
            description="Create a section to organize students by schedule and capacity."
          />
        ) : (
          sections.map((section) => (
            <CourseSectionCard
              key={section.id}
              section={section}
              onOpen={() => router.push(doctorSectionPath(courseId, section.id) as Href)}
              onEdit={() => openEditSection(section)}
              onDelete={() => handleDeleteSection(section)}
            />
          ))
        )}
      </ScrollView>

      <SectionFormSheet
        visible={sectionFormOpen}
        courseId={courseId}
        section={editingSection}
        onClose={() => setSectionFormOpen(false)}
        onSaved={() => void reload()}
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
    headerAction: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: DOCTOR_SPACE.md,
      marginTop: DOCTOR_SPACE.xl,
      marginBottom: DOCTOR_SPACE.md,
    },
    sectionHeaderText: {
      flex: 1,
    },
    sectionTitle: {
      fontWeight: "800",
      color: colors.foreground,
    },
    sectionHint: {
      marginTop: 4,
      fontWeight: "500",
      color: colors.muted,
      lineHeight: 17,
    },
    createBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primary,
    },
    createBtnText: {
      fontWeight: "700",
      color: "#fff",
    },
  });
}
