import { StyleSheet, Text, View } from "react-native";

import type { DoctorSupervisorRequestsSummary } from "@/api/doctorDashboardApi";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DOCTOR_STATUS } from "@/constants/doctorHubTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  summary: DoctorSupervisorRequestsSummary;
  loading?: boolean;
};

const ITEMS = [
  { key: "pendingCount" as const, label: "Pending", color: DOCTOR_STATUS.warning.fg },
  { key: "acceptedCount" as const, label: "Accepted", color: DOCTOR_STATUS.success.fg },
  { key: "rejectedCount" as const, label: "Rejected", color: DOCTOR_STATUS.error.fg },
  { key: "totalCount" as const, label: "Total", colorKey: "primary" as const },
];

export function SupervisionRequestsStatsStrip({ summary, loading }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrap}>
      {ITEMS.map((item, index) => {
        const value = loading ? "—" : String(summary[item.key]);
        const color = "colorKey" in item ? colors.primary : item.color;
        return (
          <View key={item.key} style={[styles.cell, index > 0 && styles.cellBorder]}>
            <Text style={[styles.value, { color: loading ? colors.muted : color, fontSize: layout.scale(20) }]}>
              {value}
            </Text>
            <Text style={[styles.label, { fontSize: layout.scale(11) }]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
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
      paddingHorizontal: DOCTOR_SPACE.xs,
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
