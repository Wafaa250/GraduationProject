import { FolderKanban } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title?: string;
  description?: string;
};

export function ActiveProjectsEmptyState({
  title = "No active projects",
  description = "Accepted supervision requests will appear here as graduation projects under your supervision.",
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <FolderKanban size={layout.scale(30)} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={[styles.title, { fontSize: layout.fontSize.subtitle, marginTop: layout.space("md") }]}>
        {title}
      </Text>
      <Text style={[styles.description, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
        {description}
      </Text>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    wrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
    },
    description: {
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
      maxWidth: 300,
      fontWeight: "500",
    },
  });
}
