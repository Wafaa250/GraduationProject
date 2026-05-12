import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function pickNumericParam(v: string | string[] | undefined): number | null {
  if (v == null) return null;
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickTitle(v: string | string[] | undefined): string {
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s || "Project";
}

export default function StudentTeamChoicePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { horizontalPadding, maxDashboardWidth } = useResponsiveLayout();
  const params = useLocalSearchParams<{
    courseId?: string | string[];
    projectId?: string | string[];
    projectTitle?: string | string[];
  }>();
  const courseId = pickNumericParam(params.courseId);
  const projectId = pickNumericParam(params.projectId);
  const projectTitle = pickTitle(params.projectTitle);

  const pad = horizontalPadding;
  const colMax = maxDashboardWidth;

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else if (courseId != null) router.replace(`/courses/${courseId}` as Href);
    else router.replace("/courses" as Href);
  }, [courseId, router]);

  const goManual = useCallback(() => {
    if (courseId == null || projectId == null) return;
    router.replace(
      `/CourseManualTeamPage?courseId=${encodeURIComponent(String(courseId))}&projectId=${encodeURIComponent(String(projectId))}&projectTitle=${encodeURIComponent(projectTitle)}` as Href,
    );
  }, [courseId, projectId, projectTitle, router]);

  const goAi = useCallback(() => {
    if (courseId == null || projectId == null) return;
    router.replace(
      `/StudentAiTeamPage?courseId=${encodeURIComponent(String(courseId))}&projectId=${encodeURIComponent(String(projectId))}&projectTitle=${encodeURIComponent(projectTitle)}` as Href,
    );
  }, [courseId, projectId, projectTitle, router]);

  const invalid = courseId == null || projectId == null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.inner, { paddingHorizontal: pad, paddingBottom: insets.bottom + spacing.lg, maxWidth: colMax, width: "100%", alignSelf: "center" }]}>
        <Pressable onPress={handleBack} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backText}>Back to projects</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.projectLabel}>{projectTitle}</Text>
          <Text style={styles.title}>Choose team formation</Text>
          <Text style={styles.sub}>Choose how you want to form your team</Text>

          {invalid ? (
            <Text style={styles.err}>Missing course or project. Open this screen from a course project.</Text>
          ) : (
            <View style={styles.grid}>
              <Pressable onPress={goManual} style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="people" size={22} color="#4f46e5" />
                </View>
                <Text style={styles.optionTitle}>Build my own team</Text>
                <Text style={styles.optionDesc}>Choose teammates manually from available students.</Text>
                <View style={styles.optionBtn}>
                  <Text style={styles.optionBtnText}>Continue</Text>
                </View>
              </Pressable>

              <Pressable onPress={goAi} style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="sparkles" size={22} color="#6d28d9" />
                </View>
                <Text style={styles.optionTitle}>Let AI suggest teammates</Text>
                <Text style={styles.optionDesc}>Use AI recommendations to build the best matching team.</Text>
                <View style={[styles.optionBtn, styles.optionBtnAi]}>
                  <Text style={styles.optionBtnText}>Continue</Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  inner: { flex: 1, paddingTop: spacing.md },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md },
  backText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: spacing.lg,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  projectLabel: { fontSize: 13, fontWeight: "700", color: "#6366f1", marginBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  sub: { marginTop: spacing.sm, fontSize: 14, color: "#64748b", fontWeight: "600", lineHeight: 20 },
  err: { marginTop: spacing.md, color: "#b91c1c", fontWeight: "700" },
  grid: { marginTop: spacing.lg, gap: spacing.md },
  option: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: "#fafafa",
  },
  optionPressed: { opacity: 0.92 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  optionTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  optionDesc: { marginTop: spacing.sm, fontSize: 13, color: "#64748b", lineHeight: 19, fontWeight: "500" },
  optionBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.md,
  },
  optionBtnAi: { backgroundColor: "#7c3aed" },
  optionBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
