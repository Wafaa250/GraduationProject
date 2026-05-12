import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getManualTeamStudents,
  sendManualTeamRequest,
  type ManualTeamStudent,
} from "@/api/studentCoursesApi";
import { resolveStudentUserIdByProfileId } from "@/api/studentsApi";
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
  return s || "";
}

function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[p.length - 1][0] ?? ""}`.toUpperCase();
}

function avatarUri(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (t.startsWith("data:")) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `data:image/jpeg;base64,${t}`;
}

export default function CourseManualTeamPage() {
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
  const titleParam = pickTitle(params.projectTitle);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState(titleParam);
  const [students, setStudents] = useState<ManualTeamStudent[]>([]);
  const [sendingToId, setSendingToId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const [openingChatFor, setOpeningChatFor] = useState<number | null>(null);

  const pad = horizontalPadding;
  const colMax = maxDashboardWidth;

  const showToast = useCallback((message: string, ok: boolean) => {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const pageTitle = useMemo(
    () => projectTitle.trim() || (projectId != null ? `Project #${projectId}` : "Manual team"),
    [projectId, projectTitle],
  );

  const load = useCallback(async () => {
    if (courseId == null || projectId == null) {
      setError("Invalid course or project.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await getManualTeamStudents(courseId, projectId);
      setProjectTitle((prev) => prev.trim() || data.projectTitle || `Project #${projectId}`);
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (err) {
      setStudents([]);
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId, projectId]);

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

  const openChatForProfile = useCallback(
    async (profileId: number) => {
      setOpeningChatFor(profileId);
      try {
        const uid = await resolveStudentUserIdByProfileId(profileId);
        if (uid == null) {
          showToast("Could not resolve this student for chat.", false);
          return;
        }
        router.push(`/ChatPage?userId=${encodeURIComponent(String(uid))}` as Href);
      } catch (err) {
        showToast(parseApiErrorMessage(err), false);
      } finally {
        setOpeningChatFor(null);
      }
    },
    [router, showToast],
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else if (courseId != null) router.replace(`/courses/${courseId}?tab=projects` as Href);
    else router.replace("/courses" as Href);
  }, [courseId, router]);

  const sendRequest = useCallback(
    async (studentProfileId: number) => {
      if (courseId == null || projectId == null || sendingToId != null) return;
      setSendingToId(studentProfileId);
      try {
        const res = await sendManualTeamRequest(courseId, projectId, studentProfileId);
        setStudents((prev) =>
          prev.map((s) => (s.id === studentProfileId ? { ...s, hasPendingRequest: true } : s)),
        );
        showToast(res.message?.trim() ? res.message : "Request sent successfully.", true);
      } catch (err) {
        showToast(parseApiErrorMessage(err), false);
      } finally {
        setSendingToId(null);
      }
    },
    [courseId, projectId, sendingToId, showToast],
  );

  const invalid = courseId == null || projectId == null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {toast ? (
        <View style={[styles.toast, toast.ok ? styles.toastOk : styles.toastErr]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: pad,
          paddingBottom: insets.bottom + spacing.xl,
          maxWidth: colMax,
          width: "100%",
          alignSelf: "center",
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        <Pressable onPress={handleBack} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.headerCard}>
          <Text style={styles.title}>{pageTitle}</Text>
          <Text style={styles.sub}>Choose teammates and send invitations</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.note}>Loading available students…</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.banner}>
            <Text style={styles.err}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retry}>
              <Text style={styles.retryTxt}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && !invalid && students.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No available students right now.</Text>
            <Text style={styles.emptySub}>You can come back later to send teammate requests.</Text>
          </View>
        ) : null}

        {!loading && !error && students.length > 0
          ? students.map((student) => {
              const isSending = sendingToId === student.id;
              const uri = avatarUri(student.avatar);
              return (
                <View key={student.id} style={styles.card}>
                  <View style={styles.rowTop}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.avatarImg} accessibilityIgnoresInvertColors />
                    ) : (
                      <View style={styles.avatarFb}>
                        <Text style={styles.avatarLetter}>{initialsOf(student.name)}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.name} numberOfLines={2}>
                        {student.name}
                      </Text>
                      <Text style={styles.email} numberOfLines={1}>
                        {student.email?.trim() ? student.email : "No email"}
                      </Text>
                    </View>
                    <View style={styles.secBadge}>
                      <Text style={styles.secBadgeTxt}>{student.sectionName || "Section"}</Text>
                    </View>
                  </View>
                  {student.bio?.trim() ? <Text style={styles.bio}>{student.bio.trim()}</Text> : null}
                  <View style={styles.skills}>
                    {student.skills.length === 0 ? (
                      <Text style={styles.skillMuted}>No skills listed</Text>
                    ) : (
                      student.skills.map((sk, i) => (
                        <View key={`${sk}-${i}`} style={styles.skillChip}>
                          <Text style={styles.skillChipTxt} numberOfLines={1}>
                            {sk}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() =>
                        router.push(`/StudentPublicProfilePage?profileId=${encodeURIComponent(String(student.id))}` as Href)
                      }
                      style={styles.outline}
                    >
                      <Text style={styles.outlineTxt}>Profile</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void openChatForProfile(student.id)}
                      style={styles.outline}
                      disabled={openingChatFor === student.id}
                    >
                      {openingChatFor === student.id ? (
                        <ActivityIndicator size="small" color="#6366f1" />
                      ) : (
                        <Ionicons name="chatbubble-outline" size={16} color="#6366f1" />
                      )}
                      <Text style={styles.outlineTxt}>Message</Text>
                    </Pressable>
                  </View>
                  <View style={styles.actions}>
                    {student.availabilityStatus === "already_teammate" ? (
                      <View style={styles.pillOk}>
                        <Text style={styles.pillOkTxt}>Already in team</Text>
                      </View>
                    ) : student.availabilityStatus === "unavailable" ? (
                      <View style={styles.pillDisabled}>
                        <Text style={styles.pillDisabledTxt}>Unavailable</Text>
                      </View>
                    ) : student.hasPendingRequest || student.availabilityStatus === "pending" ? (
                      <View style={styles.pillDisabled}>
                        <Text style={styles.pillDisabledTxt}>Invitation sent</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => void sendRequest(student.id)}
                        disabled={isSending || student.availabilityStatus !== "available"}
                        style={[styles.primaryBtn, (isSending || student.availabilityStatus !== "available") && styles.disabled]}
                      >
                        <Text style={styles.primaryBtnTxt}>{isSending ? "Sending…" : "Send invitation"}</Text>
                      </Pressable>
                    )}
                  </View>
                  {student.availabilityStatus === "unavailable" && student.availabilityReason ? (
                    <Text style={styles.reason}>{student.availabilityReason}</Text>
                  ) : null}
                </View>
              );
            })
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  toast: {
    position: "absolute",
    top: 52,
    left: 16,
    right: 16,
    zIndex: 20,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  toastOk: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  toastErr: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  toastText: { textAlign: "center", fontWeight: "700", color: "#0f172a", fontSize: 13 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md },
  backText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  sub: { marginTop: spacing.sm, fontSize: 14, color: "#64748b", fontWeight: "600" },
  center: { paddingVertical: spacing.xl, alignItems: "center", gap: spacing.sm },
  note: { color: "#64748b", fontWeight: "600" },
  banner: {
    padding: spacing.md,
    backgroundColor: "#fef2f2",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: spacing.md,
  },
  err: { color: "#b91c1c", fontWeight: "700" },
  retry: { marginTop: spacing.sm, alignSelf: "flex-start", backgroundColor: "#6366f1", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  retryTxt: { color: "#fff", fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: spacing.xl * 2, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#64748b" },
  emptySub: { fontSize: 13, color: "#94a3b8", textAlign: "center", maxWidth: 280 },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatarImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  avatarFb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 14, fontWeight: "800", color: "#7c3aed" },
  name: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  email: { marginTop: 4, fontSize: 12, color: "#64748b", fontWeight: "600" },
  secBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ede9fe",
    borderWidth: 1,
    borderColor: "#ddd6fe",
  },
  secBadgeTxt: { fontSize: 11, fontWeight: "800", color: "#6d28d9" },
  bio: { marginTop: spacing.sm, fontSize: 13, color: "#64748b", lineHeight: 19 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
  skillChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxWidth: "100%",
  },
  skillChipTxt: { fontSize: 11, fontWeight: "700", color: "#475569" },
  skillMuted: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  outline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: "#fff",
  },
  outlineTxt: { fontSize: 12, fontWeight: "700", color: "#6366f1" },
  primaryBtn: { backgroundColor: "#7c3aed", paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md },
  primaryBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  pillOk: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  pillOkTxt: { fontSize: 12, fontWeight: "800", color: "#166534" },
  pillDisabled: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#e2e8f0",
  },
  pillDisabledTxt: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  disabled: { opacity: 0.55 },
  reason: { marginTop: spacing.sm, fontSize: 11, fontWeight: "700", color: "#92400e" },
});
