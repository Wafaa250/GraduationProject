import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_STATUS, doctorBrandAccent } from "@/constants/doctorHubTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { ProjectHealthStatus } from "@/lib/doctorActiveProjectUi";

function projectStatusUi(status: ProjectHealthStatus, colors: HubColorScheme) {
  if (status === "completed") {
    return {
      label: "Team complete",
      bg: DOCTOR_STATUS.success.bg,
      text: DOCTOR_STATUS.success.fg,
      dot: DOCTOR_STATUS.success.fg,
    };
  }

  const brand = doctorBrandAccent(colors);
  return {
    label: "Supervised",
    bg: brand.bg,
    text: brand.fg,
    dot: brand.fg,
  };
}

type Props = {
  status: ProjectHealthStatus;
  compact?: boolean;
};

export function ActiveProjectStatusBadge({ status, compact }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const ui = projectStatusUi(status, colors);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: ui.bg,
          paddingHorizontal: compact ? 7 : 9,
          paddingVertical: compact ? 3 : 4,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: ui.dot }]} />
      <Text style={[styles.label, { color: ui.text, fontSize: layout.scale(compact ? 10 : 11) }]}>
        {ui.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontWeight: "700",
  },
});
