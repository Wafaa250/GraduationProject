import { ChevronRight, Pencil, Trash2 } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CourseSectionWorkspace } from "@/api/doctorCoursesApi";
import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatSectionSchedule } from "@/lib/courseWorkspaceUtils";

type Props = {
  section: CourseSectionWorkspace;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function CourseSectionCard({ section, onOpen, onEdit, onDelete }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const schedule = formatSectionSchedule(section.days, section.timeFrom, section.timeTo);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[styles.name, { fontSize: layout.scale(18) }]} numberOfLines={1}>
          {section.name}
        </Text>
        <View style={styles.actions}>
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Edit section"
          >
            <Pencil size={16} color={colors.muted} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Delete section"
          >
            <Trash2 size={16} color="#DC2626" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.schedule, { fontSize: layout.scale(12) }]} numberOfLines={2}>
        {schedule}
      </Text>

      <View style={styles.statsRow}>
        <MiniStat label="Students" value={section.studentCount} styles={styles} layout={layout} />
        <MiniStat label="Capacity" value={section.capacity} styles={styles} layout={layout} />
        <MiniStat label="Projects" value={section.courseProjectCount} styles={styles} layout={layout} />
      </View>

      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.openBtn, { opacity: pressed ? 0.9 : 1 }]}
        accessibilityRole="button"
      >
        <Text style={[styles.openText, { fontSize: layout.scale(14) }]}>Open section</Text>
        <ChevronRight size={16} color="#fff" strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

function MiniStat({
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
    <View style={styles.miniStat}>
      <Text style={[styles.miniLabel, { fontSize: layout.scale(10) }]}>{label}</Text>
      <Text style={[styles.miniValue, { fontSize: layout.scale(15) }]}>{value}</Text>
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: DOCTOR_SPACE.sm,
    },
    name: {
      flex: 1,
      fontWeight: "800",
      color: colors.foreground,
    },
    actions: {
      flexDirection: "row",
      gap: 4,
    },
    iconBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: DOCTOR_RADIUS.sm,
    },
    schedule: {
      marginTop: DOCTOR_SPACE.xs,
      fontWeight: "500",
      color: colors.muted,
    },
    statsRow: {
      flexDirection: "row",
      marginTop: DOCTOR_SPACE.lg,
      gap: DOCTOR_SPACE.sm,
    },
    miniStat: {
      flex: 1,
      paddingVertical: DOCTOR_SPACE.sm,
      paddingHorizontal: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.border,
      alignItems: "center",
    },
    miniLabel: {
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    miniValue: {
      marginTop: 2,
      fontWeight: "800",
      color: colors.foreground,
    },
    openBtn: {
      marginTop: DOCTOR_SPACE.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primary,
    },
    openText: {
      fontWeight: "700",
      color: "#fff",
    },
  });
}
