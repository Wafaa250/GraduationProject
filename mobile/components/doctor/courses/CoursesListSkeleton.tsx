import { StyleSheet, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";

export function CoursesListSkeleton() {
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrap}>
      {Array.from({ length: 3 }, (_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.icon} />
            <View style={styles.badge} />
          </View>
          <View style={styles.title} />
          <View style={styles.statsRow}>
            <View style={styles.stat} />
            <View style={styles.stat} />
            <View style={styles.stat} />
          </View>
          <View style={styles.footer} />
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  const bone = { backgroundColor: colors.border, borderRadius: DOCTOR_RADIUS.sm };
  return StyleSheet.create({
    wrap: {
      paddingTop: DOCTOR_SPACE.sm,
    },
    card: {
      ...doctorCardStyle(colors),
      padding: DOCTOR_SPACE.lg,
      marginBottom: DOCTOR_SPACE.md,
      gap: DOCTOR_SPACE.md,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    icon: {
      ...bone,
      width: 44,
      height: 44,
      borderRadius: DOCTOR_RADIUS.md,
    },
    badge: {
      ...bone,
      width: 56,
      height: 22,
    },
    title: {
      ...bone,
      height: 20,
      width: "70%",
    },
    statsRow: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.md,
    },
    stat: {
      ...bone,
      flex: 1,
      height: 36,
    },
    footer: {
      ...bone,
      height: 36,
      borderRadius: DOCTOR_RADIUS.sm,
    },
  });
}
