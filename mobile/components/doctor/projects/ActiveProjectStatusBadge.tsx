import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { ProjectHealthStatus } from "@/lib/doctorActiveProjectUi";

const STATUS: Record<ProjectHealthStatus, { label: string; bg: string; text: string; dot: string }> = {
  active: {
    label: "Supervised",
    bg: "rgba(124, 58, 237, 0.12)",
    text: "#7C3AED",
    dot: "#7C3AED",
  },
  completed: {
    label: "Team complete",
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#059669",
    dot: "#10B981",
  },
};

type Props = {
  status: ProjectHealthStatus;
  compact?: boolean;
};

export function ActiveProjectStatusBadge({ status, compact }: Props) {
  const layout = useResponsiveLayout();
  const ui = STATUS[status];

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
