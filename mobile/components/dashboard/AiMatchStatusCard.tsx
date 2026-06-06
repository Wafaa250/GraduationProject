import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { StudentAiMatchStatus } from "@/api/dashboardApi";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { STUDENT_ROUTES } from "@/lib/studentRoutes";

type Props = {
  status: StudentAiMatchStatus | null;
  loading?: boolean;
  followingCompanyCount?: number;
  followingAssociationCount?: number;
};

export function AiMatchStatusCard({
  status,
  loading = false,
  followingCompanyCount = 0,
  followingAssociationCount = 0,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading && !status) {
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
        <View style={styles.header}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={[styles.title, { fontSize: layout.scale(14) }]}>AI Match Status</Text>
        </View>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (!status) return null;

  const showEmpty = status.showEmptyState || !status.hasMatchInsights;
  const followingTotal = followingCompanyCount + followingAssociationCount;
  const companyLabel = followingCompanyCount === 1 ? "Company" : "Companies";
  const associationLabel = followingAssociationCount === 1 ? "Association" : "Associations";

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
      <View style={styles.header}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <Text style={[styles.title, { fontSize: layout.scale(14) }]}>AI Match Status</Text>
      </View>

      <Text style={[styles.headline, { fontSize: layout.fontSize.label, marginTop: layout.space("sm") }]}>
        {status.headline}
      </Text>
      <Text style={[styles.insight, { fontSize: layout.fontSize.footer, marginTop: layout.space("xs") }]}>
        {status.insight}
      </Text>

      {showEmpty ? (
        <Pressable
          style={[styles.outlineBtn, { borderRadius: layout.radius.input, marginTop: layout.space("md") }]}
          onPress={() => router.push(STUDENT_ROUTES.editProfile as never)}
        >
          <Text style={styles.outlineBtnText}>Edit Profile</Text>
        </Pressable>
      ) : status.availabilityStatus ? (
        <Text style={[styles.statusLine, { fontSize: layout.fontSize.footer, marginTop: layout.space("md") }]}>
          <Text style={styles.statusLabel}>Status: </Text>
          {status.availabilityStatus}
        </Text>
      ) : null}

      {followingTotal > 0 ? (
        <Text style={[styles.statusLine, { fontSize: layout.fontSize.footer, marginTop: layout.space("sm") }]}>
          <Text style={styles.statusLabel}>Following: </Text>
          {followingCompanyCount > 0 ? (
            <Text style={styles.link} onPress={() => router.push(STUDENT_ROUTES.following as never)}>
              {followingCompanyCount} {companyLabel}
            </Text>
          ) : null}
          {followingCompanyCount > 0 && followingAssociationCount > 0 ? (
            <Text style={styles.statusLine}> · </Text>
          ) : null}
          {followingAssociationCount > 0 ? (
            <Text style={styles.link} onPress={() => router.push(STUDENT_ROUTES.following as never)}>
              {followingAssociationCount} {associationLabel}
            </Text>
          ) : null}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "700",
    color: colors.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headline: {
    fontWeight: "700",
    color: colors.foreground,
    lineHeight: 22,
  },
  insight: {
    color: colors.muted,
    lineHeight: 20,
  },
  statusLine: {
    color: colors.muted,
    lineHeight: 20,
  },
  statusLabel: {
    fontWeight: "700",
    color: colors.foreground,
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
  outlineBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  outlineBtnText: {
    color: colors.foreground,
    fontWeight: "600",
    fontSize: 14,
  },
});
