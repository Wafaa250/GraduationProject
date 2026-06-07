import { GraduationCap } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title?: string;
  description?: string;
};

export function CoursesEmptyState({
  title = "No courses yet",
  description = "Your teaching courses will appear here once created.",
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <GraduationCap size={28} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={[styles.title, { fontSize: layout.scale(17) }]}>{title}</Text>
      <Text style={[styles.description, { fontSize: layout.scale(14) }]}>{description}</Text>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    wrap: {
      alignItems: "center",
      paddingVertical: DOCTOR_SPACE.xxxl,
      paddingHorizontal: DOCTOR_SPACE.xl,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: DOCTOR_SPACE.lg,
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
    },
    description: {
      marginTop: DOCTOR_SPACE.sm,
      fontWeight: "500",
      color: colors.muted,
      textAlign: "center",
      lineHeight: 21,
    },
  });
}
