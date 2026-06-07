import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  supervised: number;
  teamsComplete: number;
  teamChats: number;
  loading?: boolean;
};

export function ActiveProjectsStatsStrip({ supervised, teamsComplete, teamChats, loading }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);

  const items = [
    { label: "Projects", value: supervised, color: colors.primary },
    { label: "Complete", value: teamsComplete, color: colors.primary },
    { label: "Chats", value: teamChats, color: colors.primary },
  ];

  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.cell, index > 0 && styles.cellBorder]}>
          <Text style={[styles.value, { color: loading ? colors.muted : item.color, fontSize: layout.scale(20) }]}>
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
