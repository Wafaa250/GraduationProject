import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

function Block({
  width,
  height,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
}) {
  const { colors } = useDoctorTheme();
  return (
    <View
      style={[{ width, height, borderRadius: 8, backgroundColor: colors.inputBg }, style]}
    />
  );
}

function CardSkeleton() {
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Block width="35%" height={10} />
      <Block width="80%" height={16} style={{ marginTop: 8 }} />
      <Block width="100%" height={12} style={{ marginTop: 8 }} />
      <Block width="60%" height={12} style={{ marginTop: 6 }} />
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <Block width="48%" height={40} style={{ borderRadius: 10 }} />
        <Block width="48%" height={40} style={{ borderRadius: 10 }} />
      </View>
    </View>
  );
}

export function ActiveProjectsListSkeleton() {
  return (
    <View style={{ gap: DOCTOR_SPACE.sm, paddingTop: DOCTOR_SPACE.xs }}>
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: DOCTOR_SPACE.md,
    },
  });
}
