import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CourseEnrolledStudent } from "@/api/doctorCoursesApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { ProjectStudentStatusMeta } from "@/lib/courseProjectStudentStatus";

type Props = {
  student: CourseEnrolledStudent;
  status: ProjectStudentStatusMeta;
  teamLabel?: string;
};

export function ProjectStudentRow({ student, status, teamLabel }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayName = student.name?.trim() || "Student";
  const subtitle = [student.major, student.universityId].filter(Boolean).join(" · ");

  return (
    <View style={styles.row}>
      <FeedAvatar name={displayName} size={40} roleType="student" />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { fontSize: layout.scale(14) }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={[styles.statusBadge, statusStyle(status.status, colors)]}>
            <Text style={[styles.statusText, { fontSize: layout.scale(9) }]}>{status.label.toUpperCase()}</Text>
          </View>
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { fontSize: layout.scale(11) }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {teamLabel ? (
          <Text style={[styles.teamLabel, { fontSize: layout.scale(11) }]}>{teamLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

function statusStyle(status: ProjectStudentStatusMeta["status"], colors: HubColorScheme) {
  switch (status) {
    case "in-team":
      return { backgroundColor: colors.primarySoft };
    case "available":
      return { backgroundColor: "rgba(16, 185, 129, 0.12)" };
    case "pending-invite":
      return { backgroundColor: "rgba(245, 158, 11, 0.14)" };
    default:
      return { backgroundColor: colors.background };
  }
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.md,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
    },
    name: {
      flex: 1,
      fontWeight: "800",
      color: colors.foreground,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: DOCTOR_RADIUS.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    statusText: {
      fontWeight: "800",
      letterSpacing: 0.3,
      color: colors.muted,
    },
    subtitle: {
      marginTop: 2,
      fontWeight: "500",
      color: colors.muted,
    },
    teamLabel: {
      marginTop: 2,
      fontWeight: "700",
      color: colors.primary,
    },
  });
}
