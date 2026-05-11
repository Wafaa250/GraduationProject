import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";

import { DashboardScreenLayout, StatCard } from "@/components/dashboard-screen-layout";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function DoctorDashboardScreen() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const { isCompact } = useResponsiveLayout();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, e] = await Promise.all([
        SecureStore.getItemAsync("name"),
        SecureStore.getItemAsync("email"),
      ]);
      if (!cancelled) {
        setName(n?.trim() || "Doctor");
        setEmail(e?.trim() || "");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stripped = name.replace(/^Dr\.?\s*/i, "").trim();

  return (
    <DashboardScreenLayout
      title={stripped ? `Dr. ${stripped}` : "Doctor workspace"}
      subtitle={
        email
          ? `${email} · Supervise cohorts, review submissions, and stay on top of requests.`
          : "Supervise cohorts, review submissions, and stay on top of requests."
      }
      roleBadge="Doctor"
      accentColor="#2563eb"
    >
      <View style={[styles.statsRow, isCompact && styles.statsRowStack]}>
        <View style={[styles.statCell, isCompact && styles.statCellFull]}>
          <StatCard label="Active groups" value="—" hint="Linked courses & projects" />
        </View>
        <View style={[styles.statCell, isCompact && styles.statCellFull]}>
          <StatCard label="Awaiting review" value="—" hint="Submissions queue here" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workspace</Text>
        <View style={[styles.actions, isCompact && styles.actionsStack]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              isCompact && styles.actionCardFull,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionEmoji}>🧑‍🎓</Text>
            <Text style={styles.actionTitle}>Students</Text>
            <Text style={styles.actionSub}>Roster and progress at a glance</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              isCompact && styles.actionCardFull,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionEmoji}>📅</Text>
            <Text style={styles.actionTitle}>Schedule</Text>
            <Text style={styles.actionSub}>Office hours and milestones</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Overview</Text>
        <Text style={styles.panelBody}>
          This screen uses the same responsive shell as the student dashboard so typography, spacing, and
          cards stay consistent across Android screen sizes.
        </Text>
      </View>
    </DashboardScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    alignItems: "stretch",
  },
  statsRowStack: {
    flexDirection: "column",
  },
  statCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "45%",
    minWidth: 0,
  },
  statCellFull: {
    flexBasis: "auto",
    width: "100%",
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  actionsStack: {
    flexDirection: "column",
  },
  actionCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "45%",
    minWidth: 0,
    backgroundColor: "#ffffff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionCardFull: {
    flexBasis: "auto",
    width: "100%",
  },
  pressed: {
    opacity: 0.92,
  },
  actionEmoji: { fontSize: 22, marginBottom: spacing.sm },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    flexShrink: 1,
  },
  actionSub: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748b",
    flexShrink: 1,
  },
  panel: {
    backgroundColor: "#eff6ff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: spacing.sm,
  },
  panelBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#1d4ed8",
    flexShrink: 1,
  },
});
