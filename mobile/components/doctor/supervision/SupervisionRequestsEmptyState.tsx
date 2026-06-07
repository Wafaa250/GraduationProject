import { Inbox } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function SupervisionRequestsEmptyState({
  title = "No supervision requests",
  description = "When students submit supervision requests, they will appear here for review.",
  compact,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, { paddingHorizontal: layout.horizontalPadding }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Inbox size={layout.scale(compact ? 28 : 34)} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={[styles.title, { fontSize: layout.fontSize.subtitle, marginTop: layout.space(compact ? "md" : "lg") }]}>
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
    wrapCompact: {
      paddingVertical: 24,
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
