import type { LucideIcon } from "lucide-react-native";
import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function CourseWorkspaceEmptyState({ icon: Icon, title, description, action }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={26} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={[styles.title, { fontSize: layout.scale(16) }]}>{title}</Text>
      <Text style={[styles.description, { fontSize: layout.scale(13) }]}>{description}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    wrap: {
      alignItems: "center",
      paddingVertical: DOCTOR_SPACE.xxxl,
      paddingHorizontal: DOCTOR_SPACE.lg,
      borderRadius: DOCTOR_RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderStyle: "dashed",
      backgroundColor: colors.cardBg,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: DOCTOR_SPACE.md,
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
      lineHeight: 20,
      maxWidth: 320,
    },
    action: {
      marginTop: DOCTOR_SPACE.lg,
    },
  });
}
