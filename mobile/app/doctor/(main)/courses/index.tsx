import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getDoctorCoursesWithStats } from "@/api/doctorCoursesApi";
import { CourseListCard } from "@/components/doctor/courses/CourseListCard";
import { CoursesEmptyState } from "@/components/doctor/courses/CoursesEmptyState";
import { CoursesListSkeleton } from "@/components/doctor/courses/CoursesListSkeleton";
import { DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { mapCourseToListCard, type CourseListCardModel } from "@/lib/doctorCourseUi";
import { doctorCoursePath } from "@/lib/doctorRoutes";

export default function DoctorCoursesScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<CourseListCardModel[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const rows = await getDoctorCoursesWithStats();
      setCourses(rows.map(mapCourseToListCard));
    } catch (err) {
      Alert.alert("Could not load courses", parseApiErrorMessage(err));
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const listHeader = (
    <View style={styles.listHeader}>
      <Pressable
        onPress={() => router.push("/doctor/courses/create" as Href)}
        style={styles.createBtn}
      >
        <Text style={[styles.createBtnText, { fontSize: layout.scale(13) }]}>Create course</Text>
      </Pressable>
      <Text style={[styles.subtitle, { fontSize: layout.scale(13) }]}>
        Your teaching load and course workspaces
      </Text>
      {!loading && courses.length > 0 ? (
        <Text style={[styles.meta, { fontSize: layout.scale(12) }]}>
          {courses.length} course{courses.length === 1 ? "" : "s"}
        </Text>
      ) : null}
    </View>
  );

  const listFooter =
    !loading && courses.length > 0 ? (
      <Text style={[styles.footerNote, { fontSize: layout.scale(12) }]}>
        Team management and sections are configured from each course workspace after creation.
      </Text>
    ) : null;

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader title="Courses" subtitle="Manage your teaching courses" variant="compact" />
      <FlatList
        data={courses}
        keyExtractor={(item) => String(item.courseId)}
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: DOCTOR_SPACE.xxxl,
          flexGrow: courses.length === 0 ? 1 : undefined,
        }}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <CourseListCard
            course={item}
            onOpen={() => router.push(doctorCoursePath(item.courseId) as Href)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <CoursesListSkeleton />
          ) : (
            <CoursesEmptyState />
          )
        }
      />
    </DoctorScreen>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    listHeader: {
      paddingTop: DOCTOR_SPACE.sm,
      paddingBottom: DOCTOR_SPACE.md,
      gap: DOCTOR_SPACE.xs,
    },
    createBtn: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginBottom: DOCTOR_SPACE.xs,
    },
    createBtnText: {
      color: colors.onPrimary,
      fontWeight: "700",
    },
    subtitle: {
      fontWeight: "500",
      color: colors.muted,
      lineHeight: 19,
    },
    meta: {
      fontWeight: "600",
      color: colors.muted,
    },
    footerNote: {
      marginTop: DOCTOR_SPACE.sm,
      fontWeight: "500",
      color: colors.muted,
      lineHeight: 18,
    },
  });
}
