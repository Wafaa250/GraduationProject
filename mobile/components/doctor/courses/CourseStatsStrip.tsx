import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type StatItem = {
  label: string;
  value: number;
};

type Props = {
  sections: number;
  students: number;
  projects: number;
  loading?: boolean;
  labels?: [string, string, string];
};

export function CourseStatsStrip({ sections, students, projects, loading, labels }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  const items: StatItem[] = [
    { label: labels?.[0] ?? "Sections", value: sections },
    { label: labels?.[1] ?? "Students", value: students },
    { label: labels?.[2] ?? "Projects", value: projects },
  ];

  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.cell, index > 0 && styles.cellBorder]}>
          <Text style={[styles.value, { fontSize: layout.scale(20), color: loading ? colors.muted : colors.foreground }]}>
            {loading ? "—" : String(item.value)}
          </Text>
          <Text style={[styles.label, { fontSize: layout.scale(11) }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
    },
    cell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: DOCTOR_SPACE.md,
    },
    cellBorder: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
    },
    value: {
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    label: {
      marginTop: 2,
      fontWeight: "600",
      color: colors.muted,
    },
  });
}
