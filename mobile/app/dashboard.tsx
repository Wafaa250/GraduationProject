import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";

import { DashboardScreenLayout, StatCard } from "@/components/dashboard-screen-layout";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function DashboardScreen() {
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
        setName(n?.trim() || "Student");
        setEmail(e?.trim() || "");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardScreenLayout
      title={`Hi, ${name}`}
      subtitle={
        email
          ? `${email} · Track projects, invitations, and deadlines in one place.`
          : "Track projects, invitations, and deadlines in one place."
      }
      roleBadge="Student"
      accentColor="#6366f1"
    >
      <View style={[styles.statsRow, isCompact && styles.statsRowStack]}>
        <View style={[styles.statCell, isCompact && styles.statCellFull]}>
          <StatCard label="Active projects" value="—" hint="Wire your API when ready" />
        </View>
        <View style={[styles.statCell, isCompact && styles.statCellFull]}>
          <StatCard label="Pending invites" value="—" hint="Team requests appear here" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={[styles.actions, isCompact && styles.actionsStack]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              isCompact && styles.actionCardFull,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionTitle}>Browse projects</Text>
            <Text style={styles.actionSub}>Discover teams that match your skills</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              isCompact && styles.actionCardFull,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionEmoji}>✉️</Text>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionSub}>Collaborate with supervisors and peers</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Today</Text>
        <Text style={styles.panelBody}>
          Your personalized feed will appear here once the backend is connected. Layout is optimized for
          small phones, large phones, and tablets.
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
    backgroundColor: "#eef2ff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#312e81",
    marginBottom: spacing.sm,
  },
  panelBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4338ca",
    flexShrink: 1,
  },
});
