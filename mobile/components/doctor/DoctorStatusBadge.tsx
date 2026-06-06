import { StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "rgba(124, 58, 237, 0.12)", text: "#7C3AED", label: "Pending" },
  new: { bg: "rgba(124, 58, 237, 0.12)", text: "#7C3AED", label: "New" },
  accepted: { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981", label: "Accepted" },
  rejected: { bg: "rgba(239, 68, 68, 0.12)", text: "#EF4444", label: "Rejected" },
  reviewing: { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", label: "Reviewing" },
};

type Props = {
  status: string;
};

export function DoctorStatusBadge({ status }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const normalized = status.toLowerCase();
  const config = STATUS_STYLES[normalized] ?? {
    bg: colors.primarySoft,
    text: colors.primary,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderRadius: 999,
          paddingHorizontal: layout.space("sm"),
          paddingVertical: layout.space("xs"),
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.label, { color: config.text, fontSize: layout.scale(11) }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontWeight: "700",
  },
});
