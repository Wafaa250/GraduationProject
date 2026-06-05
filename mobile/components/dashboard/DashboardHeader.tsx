import { StyleSheet, Text, View } from "react-native";

import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export function DashboardHeader() {
  const layout = useResponsiveLayout();

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

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  title: {
    fontWeight: "800",
    color: HUB_COLORS.foreground,
    letterSpacing: -0.5,
  },
  accent: {
    color: HUB_COLORS.primary,
  },
  subtitle: {
    color: HUB_COLORS.muted,
    lineHeight: 22,
    maxWidth: 520,
  },
});
