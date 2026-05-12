import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";

import api, { parseApiErrorMessage } from "@/api/axiosInstance";
import { getEnrolledCourses, type EnrolledCourse } from "@/api/studentCoursesApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getCourseId } from "@/utils/getCourseId";
import { getItem } from "@/utils/authStorage";

function asText(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export default function CoursesIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { horizontalPadding, maxDashboardWidth } = useResponsiveLayout();

  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pad = horizontalPadding;
  const colMax = maxDashboardWidth;

  const load = useCallback(async () => {
    setError(null);
    try {
      await api.get("/me");
      const enrolled = await getEnrolledCourses();
      setCourses(Array.isArray(enrolled) ? enrolled : []);
    } catch (err) {
      setCourses([]);
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const goHome = useCallback(async () => {
    const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
    router.replace((role === "doctor" ? "/doctor-dashboard" : "/dashboard") as Href);
  }, [router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else void goHome();
  }, [goHome, router]);

  const openCourse = useCallback(
    (id: number) => {
      router.push(`/courses/${id}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: EnrolledCourse }) => {
      const cid = getCourseId(item);
      if (cid == null) return null;
      const sectionCount =
        typeof item.sectionCount === "number" && Number.isFinite(item.sectionCount)
          ? item.sectionCount
          : Array.isArray(item.sections)
            ? item.sections.length
            : null;

      return (
        <Pressable
          onPress={() => openCourse(cid)}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.cardTop}>
            <View style={styles.iconWrap}>
              <Ionicons name="book-outline" size={20} color="#6d28d9" />
            </View>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.courseName} numberOfLines={2}>
                {asText(item.name)}
              </Text>
              <Text style={styles.courseCode}>{asText(item.code)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </View>
          {item.doctorName ? (
            <Text style={styles.doctorLine} numberOfLines={1}>
              Dr. {asText(item.doctorName, "")}
            </Text>
          ) : null}
          {item.semester ? (
            <Text style={styles.metaMuted} numberOfLines={1}>
              {asText(item.semester, "")}
            </Text>
          ) : null}
          <View style={styles.statsRow}>
            {sectionCount != null ? (
              <View style={styles.statChip}>
                <Ionicons name="layers-outline" size={14} color="#64748b" />
                <Text style={styles.statChipText}>
                  {sectionCount} section{sectionCount === 1 ? "" : "s"}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [openCourse],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.header, { paddingHorizontal: pad, borderBottomColor: "rgba(99,102,241,0.12)" }]}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#64748b" />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>My courses</Text>
          <Text style={styles.headerSub}>Open a course for section, teams, projects, and chat.</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.note}>Loading enrolled courses…</Text>
        </View>
      ) : null}

      {error && !loading ? (
        <View style={[styles.banner, { marginHorizontal: pad, marginTop: spacing.md }]}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error ? (
        <FlatList
          data={courses}
          keyExtractor={(c, i) => {
            const id = getCourseId(c);
            return id != null ? `c-${id}` : `c-x-${i}`;
          }}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: pad,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
            maxWidth: colMax,
            width: "100%",
            alignSelf: "center",
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="file-tray-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No enrolled courses yet</Text>
              <Text style={styles.emptyText}>Once you enroll in courses, they will appear here.</Text>
            </View>
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(248,247,255,0.98)",
  },
  backBtn: { padding: 4 },
  headerTitles: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  headerSub: { marginTop: 2, fontSize: 13, color: "#64748b", fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  note: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  banner: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: "#b91c1c", fontWeight: "700", fontSize: 14 },
  retryBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "#6366f1",
  },
  retryBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPressed: { opacity: 0.92 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  courseName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  courseCode: { marginTop: 4, fontSize: 12, fontWeight: "800", color: "#7c3aed" },
  doctorLine: { marginTop: spacing.sm, fontSize: 13, fontWeight: "600", color: "#475569" },
  metaMuted: { marginTop: 4, fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statChipText: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  empty: { alignItems: "center", paddingVertical: spacing.xl * 2, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#64748b" },
  emptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "600", textAlign: "center", maxWidth: 280 },
});
