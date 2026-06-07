import { ChevronRight, GraduationCap } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { courseSubtitle, type CourseListCardModel } from "@/lib/doctorCourseUi";

type Props = {
  course: CourseListCardModel;
  onOpen: () => void;
};

export function CourseListCard({ course, onOpen }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <GraduationCap size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={styles.codeBadge}>
          <Text style={[styles.codeText, { fontSize: layout.scale(10) }]} numberOfLines={1}>
            {course.code}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { fontSize: layout.scale(17) }]} numberOfLines={2}>
        {course.name}
      </Text>
      {course.semester ? (
        <Text style={[styles.subtitle, { fontSize: layout.scale(12) }]} numberOfLines={1}>
          {courseSubtitle(course)}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        <StatCell label="Sections" value={course.sections} styles={styles} layout={layout} />
        <StatCell label="Students" value={course.students} styles={styles} layout={layout} />
        <StatCell label="Projects" value={course.projects} styles={styles} layout={layout} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { fontSize: layout.scale(13) }]}>Open course</Text>
        <ChevronRight size={16} color={colors.primary} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

function StatCell({
  label,
  value,
  styles,
  layout,
}: {
  label: string;
  value: number;
  styles: ReturnType<typeof createStyles>;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { fontSize: layout.scale(16) }]}>{value}</Text>
      <Text style={[styles.statLabel, { fontSize: layout.scale(10) }]}>{label}</Text>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      ...doctorCardStyle(colors),
      padding: DOCTOR_SPACE.lg,
      marginBottom: DOCTOR_SPACE.md,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: DOCTOR_SPACE.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    codeBadge: {
      maxWidth: "50%",
      paddingHorizontal: DOCTOR_SPACE.sm,
      paddingVertical: 4,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.border,
    },
    codeText: {
      fontWeight: "700",
      color: colors.muted,
    },
    title: {
      fontWeight: "800",
      letterSpacing: -0.3,
      color: colors.foreground,
    },
    subtitle: {
      marginTop: 4,
      fontWeight: "500",
      color: colors.muted,
    },
    statsRow: {
      flexDirection: "row",
      marginTop: DOCTOR_SPACE.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: DOCTOR_SPACE.md,
    },
    statCell: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontWeight: "800",
      color: colors.foreground,
    },
    statLabel: {
      marginTop: 2,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    footer: {
      marginTop: DOCTOR_SPACE.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primarySoft,
    },
    footerText: {
      fontWeight: "700",
      color: colors.primary,
    },
  });
}
