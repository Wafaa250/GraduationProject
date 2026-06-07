import { UserMinus } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CourseEnrolledStudent } from "@/api/doctorCoursesApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorInsetCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { StudentAssignmentContext } from "@/lib/courseWorkspaceUtils";

const DESTRUCTIVE = "#DC2626";

type Props = {
  student: CourseEnrolledStudent;
  assignment: StudentAssignmentContext | null;
  onRemove: () => void;
};

export function SectionStudentRow({ student, assignment, onRemove }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const displayName = student.name?.trim() || "Student";

  return (
    <View style={styles.row}>
      <FeedAvatar name={displayName} size={40} />
      <View style={styles.body}>
        <Text style={[styles.name, { fontSize: layout.scale(15) }]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={[styles.meta, { fontSize: layout.scale(12) }]} numberOfLines={1}>
          {[student.major, student.universityId].filter(Boolean).join(" · ") || "—"}
        </Text>
        {assignment ? (
          <Text style={[styles.assignment, { fontSize: layout.scale(11) }]} numberOfLines={1}>
            {assignment.label}
            {assignment.detail ? ` · ${assignment.detail}` : ""}
          </Text>
        ) : (
          <Text style={[styles.unassigned, { fontSize: layout.scale(11) }]}>Not on a project team</Text>
        )}
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="Remove student"
      >
        <UserMinus size={16} color={DESTRUCTIVE} strokeWidth={2} />
        <Text style={[styles.removeText, { fontSize: layout.scale(11) }]}>Remove</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    row: {
      ...doctorInsetCardStyle(colors),
      flexDirection: "row",
      alignItems: "center",
      padding: DOCTOR_SPACE.md,
      marginBottom: DOCTOR_SPACE.sm,
      gap: DOCTOR_SPACE.md,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontWeight: "700",
      color: colors.foreground,
    },
    meta: {
      marginTop: 2,
      fontWeight: "500",
      color: colors.muted,
    },
    assignment: {
      marginTop: 4,
      fontWeight: "600",
      color: colors.foreground,
    },
    unassigned: {
      marginTop: 4,
      fontWeight: "500",
      color: colors.muted,
    },
    removeBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: DOCTOR_SPACE.xs,
      paddingVertical: DOCTOR_SPACE.xs,
      borderRadius: DOCTOR_RADIUS.sm,
    },
    removeText: {
      marginTop: 2,
      fontWeight: "700",
      color: DESTRUCTIVE,
    },
  });
}
