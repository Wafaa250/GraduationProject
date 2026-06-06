import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { STUDENT_ROUTES } from "@/lib/studentRoutes";

type Props = {
  enrolled: number;
  partners: number;
};

export function CoursesAreaCard({ enrolled, partners }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius.button,
          padding: layout.space("lg"),
          marginBottom: layout.space("md"),
        },
      ]}
    >
      <Text style={[styles.title, { fontSize: layout.scale(18) }]}>Courses Area</Text>
      <Text style={[styles.subtitle, { fontSize: layout.fontSize.footer, marginTop: 4 }]}>
        Track the courses you&apos;re enrolled in and your classroom collaborators.
      </Text>

      <View style={[styles.statsRow, { gap: layout.space("md"), marginTop: layout.space("lg") }]}>
        <View style={[styles.statCard, { borderRadius: layout.radius.input, padding: layout.space("md"), flex: 1 }]}>
          <View style={styles.statIconWrap}>
            <Ionicons name="book-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { fontSize: layout.scale(28), marginTop: layout.space("sm") }]}>
            {enrolled}
          </Text>
          <Text style={styles.statLabel}>Enrolled Courses</Text>
        </View>

        <View style={[styles.statCard, { borderRadius: layout.radius.input, padding: layout.space("md"), flex: 1 }]}>
          <View style={[styles.statIconWrap, styles.statIconAccent]}>
            <Ionicons name="people-outline" size={18} color="#0EA5E9" />
          </View>
          <Text style={[styles.statValue, { fontSize: layout.scale(28), marginTop: layout.space("sm") }]}>
            {partners}
          </Text>
          <Text style={styles.statLabel}>Partner Activity</Text>
        </View>
      </View>

      <Pressable
        style={[styles.ctaBtn, { borderRadius: layout.radius.button, marginTop: layout.space("lg") }]}
        onPress={() => router.push(STUDENT_ROUTES.studentCourses as never)}
      >
        <Text style={styles.ctaText}>Manage My Courses</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  title: {
    fontWeight: "700",
    color: colors.foreground,
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
  },
  statCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconAccent: {
    backgroundColor: "rgba(14, 165, 233, 0.12)",
  },
  statValue: {
    fontWeight: "800",
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 2,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    minHeight: 48,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
