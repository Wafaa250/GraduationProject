import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export function DashboardHeader() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, { marginBottom: layout.space("lg") }]}>
      <Text style={[styles.title, { fontSize: layout.fontSize.title }]}>
        Student <Text style={styles.accent}>Dashboard</Text>
      </Text>
      <Text style={[styles.subtitle, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
        Welcome back — here&apos;s your collaboration snapshot, matched projects, and team activity at a
        glance.
      </Text>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  wrap: {
    width: "100%",
  },
  title: {
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  accent: {
    color: colors.primary,
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 22,
    maxWidth: 520,
  },
});
