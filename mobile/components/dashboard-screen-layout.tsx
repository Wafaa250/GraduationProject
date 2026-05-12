import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { spacing, radius } from "@/constants/responsiveLayout";
import { clearSession } from "@/utils/authStorage";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type DashboardScreenLayoutProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Short label shown in a pill (e.g. Student, Doctor) */
  roleBadge: string;
  accentColor?: string;
  headerAction?: ReactNode;
}>;

export function DashboardScreenLayout({
  title,
  subtitle,
  roleBadge,
  accentColor = "#6366f1",
  headerAction,
  children,
}: DashboardScreenLayoutProps) {
  const { horizontalPadding, maxDashboardWidth, isTablet } = useResponsiveLayout();

  const signOut = async () => {
    try {
      await clearSession();
    } catch {
      /* ignore */
    }
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inner, { maxWidth: maxDashboardWidth, alignSelf: isTablet ? "center" : "stretch", width: "100%" }]}>
          <View style={styles.topBar}>
            <View style={[styles.badge, { borderColor: accentColor }]}>
              <View style={[styles.badgeDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.badgeText, { color: accentColor }]}>{roleBadge}</Text>
            </View>
            {headerAction ?? (
              <Pressable onPress={signOut} style={styles.outlineBtn} hitSlop={8}>
                <Text style={styles.outlineBtnText}>Sign out</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}

          <View style={styles.body}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {value}
      </Text>
      {hint ? (
        <Text style={styles.statHint} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flexGrow: 1,
    minHeight: 120,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: "#ffffff",
    maxWidth: "100%",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  outlineBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748b",
    marginBottom: spacing.xl,
    flexShrink: 1,
  },
  body: {
    gap: spacing.lg,
    flexGrow: 1,
  },
  statCard: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: "#ffffff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  statHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: "#94a3b8",
  },
});
