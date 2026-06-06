import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { StudentAiMatchStatus } from "@/api/dashboardApi";
import { HUB_COLORS } from "@/constants/studentHubTheme";
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
          <Ionicons name="sparkles" size={14} color={HUB_COLORS.primary} />
          <Text style={[styles.title, { fontSize: layout.scale(14) }]}>AI Match Status</Text>
        </View>
        <ActivityIndicator color={HUB_COLORS.primary} style={{ marginTop: 12 }} />
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
        <Ionicons name="sparkles" size={14} color={HUB_COLORS.primary} />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headline: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    lineHeight: 22,
  },
  insight: {
    color: HUB_COLORS.muted,
    lineHeight: 20,
  },
  statusLine: {
    color: HUB_COLORS.muted,
    lineHeight: 20,
  },
  statusLabel: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  link: {
    color: HUB_COLORS.primary,
    fontWeight: "600",
  },
  outlineBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  outlineBtnText: {
    color: HUB_COLORS.foreground,
    fontWeight: "600",
    fontSize: 14,
  },
});
