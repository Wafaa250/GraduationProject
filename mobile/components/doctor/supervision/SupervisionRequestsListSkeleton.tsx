import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";

function SkeletonBlock({
  width,
  height,
  radius = 8,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: object;
}) {
  const { colors } = useHubTheme();
  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.inputBg },
        style,
      ]}
    />
  );
}

function CardSkeleton() {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBlock width={40} height={40} radius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock width="55%" height={14} />
          <SkeletonBlock width="40%" height={11} />
          <SkeletonBlock width="85%" height={14} style={{ marginTop: 4 }} />
          <SkeletonBlock width="60%" height={11} />
        </View>
      </View>
    </View>
  );
}

export function SupervisionRequestsListSkeleton() {
  return (
    <View style={{ gap: DOCTOR_SPACE.sm, paddingTop: DOCTOR_SPACE.xs }}>
      <CardSkeleton />
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
    row: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
    },
  });
}
