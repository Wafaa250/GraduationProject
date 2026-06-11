import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getStudentDirectoryProfile } from "@/api/studentDirectoryApi";
import { StudentPublicProfileView } from "@/components/public-profile/StudentPublicProfileView";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorStudentProfileExtras } from "@/hooks/useDoctorStudentProfileExtras";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  doctorCourseProjectPath,
  DOCTOR_ROUTES,
} from "@/lib/doctorRoutes";
import { mapDirectoryProfileToMe } from "@/lib/mapStudentDirectoryProfile";

export default function DoctorStudentProfileScreen() {
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>();
  const userId = Number(userIdParam);
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudentDirectoryProfile>> | null>(
    null,
  );

  const extras = useDoctorStudentProfileExtras(student?.profileId ?? null, student?.userId ?? null);
  const profile = useMemo(
    () => (student ? mapDirectoryProfileToMe(student) : null),
    [student],
  );

  useEffect(() => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setError("Invalid student.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void getStudentDirectoryProfile(userId)
      .then(setStudent)
      .catch((err) => {
        setStudent(null);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <DoctorScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </DoctorScreen>
    );
  }

  if (!student || !profile) {
    return (
      <DoctorScreen>
        <DoctorStackHeader title="Student" fallbackHref={DOCTOR_ROUTES.dashboard} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? "Student not found."}</Text>
        </View>
      </DoctorScreen>
    );
  }

  return (
    <DoctorScreen>
      <DoctorStackHeader
        title="Student profile"
        subtitle="Skills, academic details, and course team memberships"
        fallbackHref={DOCTOR_ROUTES.dashboard}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: DOCTOR_SPACE.xl,
          gap: DOCTOR_SPACE.md,
        }}
      >
        <StudentPublicProfileView
          profile={profile}
          projects={extras.graduationProjects}
          showShare={false}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course teams</Text>
          <Text style={styles.sectionSubtitle}>
            {extras.enrollmentCount > 0
              ? `Enrolled in ${extras.enrollmentCount} course${extras.enrollmentCount === 1 ? "" : "s"}`
              : "Course enrollment and team memberships"}
          </Text>
          {extras.loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
          ) : extras.courseTeams.length === 0 ? (
            <Text style={styles.muted}>No course team memberships in your courses.</Text>
          ) : (
            extras.courseTeams.map((team) => (
              <Pressable
                key={`${team.courseId}-${team.teamId}`}
                style={styles.teamRow}
                onPress={() =>
                  router.push(
                    doctorCourseProjectPath(team.courseId, team.sectionId, team.projectId) as Href,
                  )
                }
              >
                <Text style={styles.teamTitle}>{team.projectTitle}</Text>
                <Text style={styles.muted}>
                  {team.courseCode} · {team.courseName} · {team.teamLabel}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </DoctorScreen>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: DOCTOR_SPACE.lg,
    },
    errorText: {
      color: colors.muted,
      fontSize: 14,
      textAlign: "center",
    },
    section: {
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: DOCTOR_SPACE.md,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.muted,
    },
    muted: {
      fontSize: 13,
      color: colors.muted,
    },
    teamRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.md,
      padding: DOCTOR_SPACE.sm,
      gap: 4,
      marginTop: 4,
    },
    teamTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },
  });
