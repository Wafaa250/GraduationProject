import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getAiTeamRecommendations,
  sendManualTeamRequest,
  type AiTeamRecommendation,
} from "@/api/studentCoursesApi";
import { fetchMyCourseTeam } from "@/api/studentTeamApi";
import { resolveStudentUserIdByProfileId } from "@/api/studentsApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getItem } from "@/utils/authStorage";

function pickNumericParam(v: string | string[] | undefined): number | null {
  if (v == null) return null;
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickStringParam(v: string | string[] | undefined): string | null {
  if (v == null) return null;
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s || null;
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

type ThemePalette = {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  sub: string;
  accent: string;
  accentMuted: string;
  chip: string;
  chipBorder: string;
  chipText: string;
  error: string;
  okBadge: string;
  okBadgeBorder: string;
  okBadgeText: string;
  warnBadge: string;
  warnBadgeBorder: string;
  warnBadgeText: string;
  toastOkBg: string;
  toastOkBorder: string;
  toastErrBg: string;
  toastErrBorder: string;
  toastText: string;
};

function useAiTeamTheme(): ThemePalette {
  const scheme = useColorScheme();
  return useMemo(() => {
    const dark = scheme === "dark";
    if (dark) {
      return {
        bg: "#0f172a",
        surface: "#1e293b",
        border: "#334155",
        text: "#f8fafc",
        muted: "#94a3b8",
        sub: "#64748b",
        accent: "#a78bfa",
        accentMuted: "#2e1064",
        chip: "#334155",
        chipBorder: "#475569",
        chipText: "#e2e8f0",
        error: "#fca5a5",
        okBadge: "#14532d",
        okBadgeBorder: "#22c55e",
        okBadgeText: "#bbf7d0",
        warnBadge: "#78350f",
        warnBadgeBorder: "#fbbf24",
        warnBadgeText: "#fde68a",
        toastOkBg: "#14532d",
        toastOkBorder: "#22c55e",
        toastErrBg: "#7f1d1d",
        toastErrBorder: "#f87171",
        toastText: "#f8fafc",
      };
    }
    return {
      bg: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      muted: "#64748b",
      sub: "#94a3b8",
      accent: "#6d28d9",
      accentMuted: "#ede9fe",
      chip: "#f1f5f9",
      chipBorder: "#e2e8f0",
      chipText: "#475569",
      error: "#b91c1c",
      okBadge: "#dcfce7",
      okBadgeBorder: "#bbf7d0",
      okBadgeText: "#166534",
      warnBadge: "#fef3c7",
      warnBadgeBorder: "#fde68a",
      warnBadgeText: "#92400e",
      toastOkBg: "#f0fdf4",
      toastOkBorder: "#bbf7d0",
      toastErrBg: "#fef2f2",
      toastErrBorder: "#fecaca",
      toastText: "#0f172a",
    };
  }, [scheme]);
}

export default function StudentAiTeamPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useAiTeamTheme();
  const styles = useMemo(() => createStyles(), []);
  const { horizontalPadding, isTablet, maxDashboardWidth } = useResponsiveLayout();

  const params = useLocalSearchParams<{
    projectId?: string | string[];
    courseId?: string | string[];
    projectTitle?: string | string[];
  }>();
  const projectId = pickNumericParam(params.projectId);
  const courseIdParam = pickNumericParam(params.courseId);
  const projectTitleParam = pickStringParam(params.projectTitle);

  const [resolvedCourseId, setResolvedCourseId] = useState<number | null>(courseIdParam);
  const [resolvingCourse, setResolvingCourse] = useState(courseIdParam == null && projectId != null);
  const [courseResolveError, setCourseResolveError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AiTeamRecommendation[]>([]);
  const [sendingToId, setSendingToId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [openingChatProfileId, setOpeningChatProfileId] = useState<number | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const goHome = useCallback(async () => {
    const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
    router.replace((role === "doctor" ? "/doctor-dashboard" : "/dashboard") as Href);
  }, [router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else void goHome();
  }, [goHome, router]);

  const pageTitle = useMemo(() => {
    const t = projectTitleParam?.trim();
    if (t) return t;
    if (projectId != null) return `Project #${projectId}`;
    return "AI teammate suggestions";
  }, [projectId, projectTitleParam]);

  useEffect(() => {
    if (courseIdParam != null) {
      setResolvedCourseId(courseIdParam);
      setCourseResolveError(null);
      setResolvingCourse(false);
      return;
    }
    if (projectId == null) {
      setResolvedCourseId(null);
      setResolvingCourse(false);
      return;
    }
    let cancelled = false;
    setResolvingCourse(true);
    setCourseResolveError(null);
    void (async () => {
      try {
        const team = await fetchMyCourseTeam(projectId);
        if (!cancelled) setResolvedCourseId(team.courseId);
      } catch (err) {
        if (!cancelled) {
          setResolvedCourseId(null);
          setCourseResolveError(parseApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setResolvingCourse(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseIdParam, projectId]);

  const fetchRecommendations = useCallback(async () => {
    if (projectId == null || resolvedCourseId == null) return;
    setError(null);
    try {
      const data = await getAiTeamRecommendations(resolvedCourseId, projectId);
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecommendations([]);
      setError(parseApiErrorMessage(err));
    }
  }, [projectId, resolvedCourseId]);

  useEffect(() => {
    if (projectId == null) {
      setLoading(false);
      setError("Missing project id. Open this page with ?projectId=… (and optionally ?courseId=…).");
      return;
    }
    if (resolvingCourse) return;
    if (resolvedCourseId == null) {
      setLoading(false);
      if (courseResolveError) {
        setError(
          "Could not determine course id. Add ?courseId=… to the URL (same as the web /student/courses/{courseId}/projects/{projectId}/ai-team route).",
        );
      }
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await fetchRecommendations();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [courseResolveError, fetchRecommendations, projectId, resolvedCourseId, resolvingCourse]);

  const onRefresh = useCallback(async () => {
    if (projectId == null || resolvedCourseId == null) return;
    setRefreshing(true);
    try {
      await fetchRecommendations();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRecommendations, projectId, resolvedCourseId]);

  const handleSendInvitation = useCallback(
    async (studentProfileId: number) => {
      if (resolvedCourseId == null || projectId == null || sendingToId != null) return;
      setSendingToId(studentProfileId);
      try {
        const res = await sendManualTeamRequest(resolvedCourseId, projectId, studentProfileId);
        setRecommendations((prev) =>
          prev.map((r) =>
            r.studentId === studentProfileId
              ? { ...r, hasPendingRequest: true, availabilityStatus: "pending" }
              : r,
          ),
        );
        showToast(res.message?.trim() ? res.message : "Invitation sent.", "success");
      } catch (err) {
        showToast(parseApiErrorMessage(err), "error");
      } finally {
        setSendingToId(null);
      }
    },
    [projectId, resolvedCourseId, sendingToId, showToast],
  );

  const openProfile = useCallback(
    (profileId: number) => {
      router.push(`/StudentPublicProfilePage?profileId=${encodeURIComponent(String(profileId))}` as Href);
    },
    [router],
  );

  const openChatForProfile = useCallback(
    async (profileId: number) => {
      setOpeningChatProfileId(profileId);
      try {
        const uid = await resolveStudentUserIdByProfileId(profileId);
        if (uid == null) {
          showToast("Could not resolve this student for chat.", "error");
          return;
        }
        router.push(`/ChatPage?userId=${encodeURIComponent(String(uid))}` as Href);
      } catch (err) {
        showToast(parseApiErrorMessage(err), "error");
      } finally {
        setOpeningChatProfileId(null);
      }
    },
    [router, showToast],
  );

  const pad = horizontalPadding;
  const colMax = maxDashboardWidth;
  const numColumns = isTablet ? 2 : 1;

  const renderCard = useCallback(
    ({ item: student }: { item: AiTeamRecommendation }) => {
      const isSending = sendingToId === student.studentId;
      const status = (student.availabilityStatus ?? "").toLowerCase();
      const canInvite =
        status === "available" && !student.hasPendingRequest && !student.isAlreadyInTeam;
      const matchPct = Math.min(100, Math.max(0, Math.round(student.matchScore)));
      const uri = avatarUri(student.avatar);

      return (
        <View
          style={[
            styles.card,
            numColumns > 1 ? styles.cardGrid : null,
            { borderColor: C.border, backgroundColor: C.surface, maxWidth: colMax },
          ]}
        >
          <View style={styles.cardTop}>
            {uri ? (
              <Image source={{ uri }} style={[styles.avatarImg, { borderColor: C.border }]} accessibilityIgnoresInvertColors />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: C.accentMuted }]}>
                <Text style={[styles.avatarLetter, { color: C.accent }]}>{initialsOf(student.name)}</Text>
              </View>
            )}
            <View style={styles.cardTitleBlock}>
              <Text style={[styles.name, { color: C.text }]} numberOfLines={2}>
                {student.name}
              </Text>
              <Text style={[styles.email, { color: C.muted }]} numberOfLines={1}>
                {student.email?.trim() ? student.email : "No email"}
              </Text>
            </View>
            <View style={[styles.matchBadge, { borderColor: C.accentMuted, backgroundColor: C.accentMuted }]}>
              <Text style={[styles.matchBadgeText, { color: C.accent }]}>{matchPct}% match</Text>
            </View>
          </View>

          <View style={[styles.sectionBadge, { borderColor: C.accentMuted, backgroundColor: C.accentMuted }]}>
            <Text style={[styles.sectionBadgeText, { color: C.accent }]} numberOfLines={1}>
              {student.sectionName?.trim() ? student.sectionName : "Section"}
            </Text>
          </View>

          {student.matchReason?.trim() ? (
            <View>
              <Text style={[styles.matchReasonLabel, { color: C.sub }]}>Why this match</Text>
              <Text style={[styles.matchReason, { color: C.muted }]}>{student.matchReason.trim()}</Text>
            </View>
          ) : null}

          {student.bio?.trim() ? <Text style={[styles.bio, { color: C.muted }]}>{student.bio.trim()}</Text> : null}

          <View style={styles.skillsWrap}>
            {(student.skills ?? []).length === 0 ? (
              <Text style={[styles.skillMuted, { color: C.sub }]}>No skills listed</Text>
            ) : (
              (student.skills ?? []).map((skill, idx) => (
                <View
                  key={`${skill}-${idx}`}
                  style={[styles.skillTag, { borderColor: C.chipBorder, backgroundColor: C.chip }]}
                >
                  <Text style={[styles.skillTagText, { color: C.chipText }]} numberOfLines={1}>
                    {skill}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.secondaryActions}>
            <Pressable
              onPress={() => openProfile(student.studentId)}
              style={[styles.outlineBtn, { borderColor: C.border }]}
            >
              <Ionicons name="person-outline" size={16} color={C.accent} />
              <Text style={[styles.outlineBtnText, { color: C.accent }]}>Profile</Text>
            </Pressable>
            <Pressable
              onPress={() => void openChatForProfile(student.studentId)}
              style={[styles.outlineBtn, { borderColor: C.border }]}
              disabled={openingChatProfileId === student.studentId}
            >
              {openingChatProfileId === student.studentId ? (
                <ActivityIndicator size="small" color={C.accent} />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={C.accent} />
                  <Text style={[styles.outlineBtnText, { color: C.accent }]}>Message</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.actionsRow}>
            {student.isAlreadyInTeam ? (
              <View style={[styles.stateBadge, { borderColor: C.okBadgeBorder, backgroundColor: C.okBadge }]}>
                <Text style={[styles.stateBadgeText, { color: C.okBadgeText }]}>Already in team</Text>
              </View>
            ) : student.hasPendingRequest || status === "pending" ? (
              <View style={[styles.inviteDisabled, { backgroundColor: C.chip }]}>
                <Text style={[styles.inviteDisabledText, { color: C.muted }]}>Invitation sent</Text>
              </View>
            ) : status === "unavailable" ? (
              <View style={[styles.inviteDisabled, { backgroundColor: C.chip }]}>
                <Text style={[styles.inviteDisabledText, { color: C.muted }]}>Unavailable</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => void handleSendInvitation(student.studentId)}
                disabled={!canInvite || isSending}
                style={[
                  styles.inviteBtn,
                  { opacity: !canInvite || isSending ? 0.55 : 1 },
                ]}
              >
                <Text style={styles.inviteBtnText}>{isSending ? "Sending…" : "Send invitation"}</Text>
              </Pressable>
            )}
          </View>

          {status === "unavailable" && student.availabilityReason?.trim() ? (
            <View style={[styles.warnPill, { borderColor: C.warnBadgeBorder, backgroundColor: C.warnBadge }]}>
              <Text style={[styles.warnPillText, { color: C.warnBadgeText }]} numberOfLines={3}>
                {student.availabilityReason.trim()}
              </Text>
            </View>
          ) : null}
        </View>
      );
    },
    [
      C,
      colMax,
      handleSendInvitation,
      openChatForProfile,
      openProfile,
      openingChatProfileId,
      sendingToId,
      styles,
      numColumns,
    ],
  );

  const listHeader = useMemo(
    () => (
      <View style={{ paddingHorizontal: pad, paddingBottom: spacing.md, maxWidth: colMax, width: "100%", alignSelf: "center" }}>
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { borderColor: C.border, backgroundColor: C.surface, marginTop: spacing.sm }]}
        >
          <Ionicons name="arrow-back" size={18} color={C.muted} />
          <Text style={[styles.backBtnText, { color: C.text }]}>Back</Text>
        </Pressable>

        <View style={[styles.headerCard, { borderColor: C.border, backgroundColor: C.surface }]}>
          <View style={[styles.headerIconWrap, { backgroundColor: C.accentMuted }]}>
            <Ionicons name="sparkles" size={22} color={C.accent} />
          </View>
          <Text style={[styles.title, { color: C.text }]}>{pageTitle}</Text>
          <Text style={[styles.subtitle, { color: C.muted }]}>
            AI-ranked suggestions — you still choose who to invite; invitations use the same flow as manual browse.
          </Text>
        </View>

        {loading || resolvingCourse ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color={C.accent} />
            <Text style={[styles.note, { color: C.muted }]}>
              {resolvingCourse ? "Resolving course…" : "Loading recommendations…"}
            </Text>
          </View>
        ) : null}

        {error ? (
          <Text style={[styles.errorText, { color: C.error }]} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        {!loading && !resolvingCourse && !error && recommendations.length === 0 ? (
          <Text style={[styles.note, { color: C.muted }]}>No eligible students to recommend right now.</Text>
        ) : null}
      </View>
    ),
    [
      C,
      colMax,
      error,
      handleBack,
      loading,
      pageTitle,
      pad,
      recommendations.length,
      resolvingCourse,
      styles,
    ],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={["left", "right"]}>
      {toast ? (
        <View
          style={[
            styles.toast,
            toast.type === "success"
              ? { backgroundColor: C.toastOkBg, borderColor: C.toastOkBorder }
              : { backgroundColor: C.toastErrBg, borderColor: C.toastErrBorder },
          ]}
        >
          <Text style={[styles.toastText, { color: C.toastText }]}>{toast.message}</Text>
        </View>
      ) : null}

      <FlatList
        data={recommendations}
        keyExtractor={(s) => String(s.studentId)}
        renderItem={renderCard}
        ListHeaderComponent={listHeader}
        numColumns={numColumns}
        key={String(numColumns)}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrap : undefined}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.lg,
          flexGrow: 1,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

function createStyles() {
  return StyleSheet.create({
    safe: { flex: 1 },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    backBtnText: { fontSize: 14, fontWeight: "700" },
    headerCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
    },
    headerIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    title: { fontSize: 24, fontWeight: "800" },
    subtitle: { marginTop: spacing.sm, fontSize: 14, lineHeight: 21, fontWeight: "600" },
    inlineLoading: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
    note: { marginTop: spacing.sm, fontSize: 13, fontWeight: "600" },
    errorText: { marginTop: spacing.sm, fontSize: 13, fontWeight: "700" },
    columnWrap: {
      gap: spacing.md,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.sm,
    },
    card: {
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
      marginBottom: spacing.md,
      marginHorizontal: spacing.sm,
      minWidth: 0,
    },
    cardGrid: {
      flex: 1,
    },
    cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    avatarImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1 },
    avatarFallback: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetter: { fontSize: 13, fontWeight: "800" },
    cardTitleBlock: { flex: 1, minWidth: 0 },
    name: { fontSize: 15, fontWeight: "800" },
    email: { marginTop: 3, fontSize: 12, fontWeight: "600" },
    matchBadge: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    matchBadgeText: { fontSize: 11, fontWeight: "800" },
    sectionBadge: {
      alignSelf: "flex-start",
      marginTop: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    sectionBadgeText: { fontSize: 11, fontWeight: "800" },
    matchReasonLabel: {
      marginTop: spacing.sm,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    matchReason: { marginTop: 4, fontSize: 12, lineHeight: 18, fontWeight: "600" },
    bio: { marginTop: spacing.sm, fontSize: 12, lineHeight: 18, fontWeight: "500" },
    skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
    skillTag: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
      maxWidth: "100%",
    },
    skillTagText: { fontSize: 11, fontWeight: "700" },
    skillMuted: { fontSize: 11, fontWeight: "600" },
    secondaryActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    outlineBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    outlineBtnText: { fontSize: 12, fontWeight: "700" },
    actionsRow: { marginTop: spacing.md, alignItems: "flex-end" },
    inviteBtn: {
      borderRadius: radius.md,
      backgroundColor: "#7c3aed",
      paddingVertical: 10,
      paddingHorizontal: 16,
      shadowColor: "#7c3aed",
      shadowOpacity: 0.28,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    inviteBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
    inviteDisabled: {
      borderRadius: radius.md,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    inviteDisabledText: { fontSize: 12, fontWeight: "800" },
    stateBadge: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    stateBadgeText: { fontSize: 11, fontWeight: "800" },
    warnPill: {
      marginTop: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    warnPillText: { fontSize: 11, fontWeight: "700" },
    toast: {
      position: "absolute",
      top: 52,
      left: 16,
      right: 16,
      zIndex: 50,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    toastText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  });
}
