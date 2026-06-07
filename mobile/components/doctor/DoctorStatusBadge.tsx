import { StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";

import { DOCTOR_STATUS, doctorBrandAccent } from "@/constants/doctorHubTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function statusStyles(colors: HubColorScheme): Record<string, { bg: string; text: string; label: string }> {
  const brand = doctorBrandAccent(colors);
  return {
    pending: { bg: brand.bg, text: brand.fg, label: "Pending" },
    new: { bg: brand.bg, text: brand.fg, label: "New" },
    accepted: { bg: DOCTOR_STATUS.success.bg, text: DOCTOR_STATUS.success.fg, label: "Accepted" },
    rejected: { bg: DOCTOR_STATUS.error.bg, text: DOCTOR_STATUS.error.fg, label: "Rejected" },
    reviewing: { bg: DOCTOR_STATUS.warning.bg, text: DOCTOR_STATUS.warning.fg, label: "Reviewing" },
  };
}

type Props = {
  status: string;
};

export function DoctorStatusBadge({ status }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const stylesByStatus = useMemo(() => statusStyles(colors), [colors]);
  const normalized = status.toLowerCase();
  const config = stylesByStatus[normalized] ?? {
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
