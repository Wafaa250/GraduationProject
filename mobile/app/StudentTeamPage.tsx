import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { markChatScopeRead } from "@/api/notificationsApi";
import {
  fetchMeForTeamChat,
  fetchMyCourseTeam,
  fetchTeamChatMessages,
  parseMeUserId,
  postTeamChatMessage,
  type MyCourseTeamResponse,
  type TeamChatMessageDto,
} from "@/api/studentTeamApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getItem } from "@/utils/authStorage";

const TEAM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function pickNumericParam(v: string | string[] | undefined): number | null {
  if (v == null) return null;
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[p.length - 1][0] ?? ""}`.toUpperCase();
}

type ThemePalette = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  muted: string;
  sub: string;
  accent: string;
  accentMuted: string;
  bubbleMe: string;
  bubbleOther: string;
  bubbleMeText: string;
  bubbleOtherText: string;
  inputBg: string;
  toastOkBg: string;
  toastOkBorder: string;
  toastErrBg: string;
  toastErrBorder: string;
  toastText: string;
};

function useTeamTheme(): ThemePalette {
  const scheme = useColorScheme();
  return useMemo(() => {
    const dark = scheme === "dark";
    if (dark) {
      return {
        bg: "#0f172a",
        surface: "#1e293b",
        surfaceMuted: "#334155",
        border: "#334155",
        text: "#f8fafc",
        muted: "#94a3b8",
        sub: "#64748b",
        accent: "#a78bfa",
        accentMuted: "#2e1064",
        bubbleMe: "#7c3aed",
        bubbleOther: "#334155",
        bubbleMeText: "#fff",
        bubbleOtherText: "#e2e8f0",
        inputBg: "#0f172a",
        toastOkBg: "#14532d",
        toastOkBorder: "#22c55e",
        toastErrBg: "#7f1d1d",
        toastErrBorder: "#f87171",
        toastText: "#f8fafc",
      };
    }
    return {
      bg: "#f1f5f9",
      surface: "#ffffff",
      surfaceMuted: "#f8fafc",
      border: "#e2e8f0",
      text: "#0f172a",
      muted: "#64748b",
      sub: "#94a3b8",
      accent: "#6366f1",
      accentMuted: "#eef2ff",
      bubbleMe: "#7c3aed",
      bubbleOther: "#e5e7eb",
      bubbleMeText: "#fff",
      bubbleOtherText: "#1f2937",
      inputBg: "#fff",
      toastOkBg: "#f0fdf4",
      toastOkBorder: "#bbf7d0",
      toastErrBg: "#fef2f2",
      toastErrBorder: "#fecaca",
      toastText: "#0f172a",
    };
  }, [scheme]);
}

export default function StudentTeamPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useTeamTheme();
  const styles = useMemo(() => createStyles(), []);
  const { horizontalPadding, maxDashboardWidth } = useResponsiveLayout();

  const { projectId: projectIdParam } = useLocalSearchParams<{ projectId?: string | string[] }>();
  const projectId = pickNumericParam(projectIdParam);

  const [team, setTeam] = useState<MyCourseTeamResponse | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [meData, setMeData] = useState<unknown>(null);
  const [messages, setMessages] = useState<TeamChatMessageDto[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<FlatList<TeamChatMessageDto>>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const currentUserId = useMemo(() => parseMeUserId(meData), [meData]);

  const goHome = useCallback(async () => {
    const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
    router.replace((role === "doctor" ? "/doctor-dashboard" : "/dashboard") as Href);
  }, [router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else void goHome();
  }, [goHome, router]);

  const openCourseWorkspace = useCallback(
    (courseId: number, titleHint: string) => {
      router.push(
        `/CourseWorkspacePage?courseId=${encodeURIComponent(String(courseId))}&courseName=${encodeURIComponent(titleHint)}&courseCode=${encodeURIComponent("—")}&role=student` as Href,
      );
    },
    [router],
  );

  const openMemberProfile = useCallback(
    (userId: number) => {
      if (!projectId) return;
      router.push(`/StudentProfilePage?userId=${userId}&projectId=${projectId}` as Href);
    },
    [projectId, router],
  );

  const openMemberChat = useCallback(
    (userId: number) => {
      router.push(`/ChatPage?userId=${userId}` as Href);
    },
    [router],
  );

  const loadTeam = useCallback(async (): Promise<MyCourseTeamResponse | null> => {
    if (projectId == null) return null;
    try {
      const [teamRes, meRes] = await Promise.all([fetchMyCourseTeam(projectId), fetchMeForTeamChat()]);
      setTeam(teamRes);
      setMeData(meRes);
      setLoadError(null);
      return teamRes;
    } catch (err) {
      setTeam(null);
      const msg = parseApiErrorMessage(err);
      setLoadError(msg);
      showToast(msg, "error");
      return null;
    } finally {
      setLoadingTeam(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    if (projectId == null) {
      setLoadingTeam(false);
      return;
    }
    void loadTeam();
  }, [loadTeam, projectId]);

  const loadMessages = useCallback(async (teamId: number) => {
    try {
      const rows = await fetchTeamChatMessages(teamId, 100);
      setMessages(rows);
      await markChatScopeRead(`team:${teamId}`);
    } catch {
      /* silent — same as web */
    }
  }, []);

  useEffect(() => {
    if (!team?.teamId) return;
    void loadMessages(team.teamId);

    pollRef.current = setInterval(() => {
      void loadMessages(team.teamId);
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [team?.teamId, loadMessages]);

  const onRefresh = useCallback(async () => {
    if (projectId == null) return;
    setRefreshing(true);
    try {
      const t = await loadTeam();
      if (t?.teamId) await loadMessages(t.teamId);
    } finally {
      setRefreshing(false);
    }
  }, [loadMessages, loadTeam, projectId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !team?.teamId) return;
    setSending(true);
    try {
      const created = await postTeamChatMessage(team.teamId, text);
      setMessages((prev) => [...prev, created]);
      setInput("");
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setSending(false);
    }
  }, [input, showToast, team?.teamId]);

  const teamLabel = team
    ? `Team ${TEAM_LETTERS[team.teamIndex] ?? String(team.teamIndex)}`
    : "";

  const pad = horizontalPadding;
  const contentMax = maxDashboardWidth;

  if (projectId == null) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
        <View style={[styles.centerWrap, { paddingHorizontal: pad }]}>
          <Text style={[styles.mutedTitle, { color: C.muted }]}>Missing project</Text>
          <Text style={[styles.mutedSub, { color: C.sub }]}>
            Open this page with a project id, for example /StudentTeamPage?projectId=123
          </Text>
          <Pressable onPress={handleBack} style={[styles.backBtn, { borderColor: C.border, backgroundColor: C.surface }]}>
            <Ionicons name="arrow-back" size={18} color={C.muted} />
            <Text style={[styles.backBtnText, { color: C.text }]}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingTeam) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={[styles.loadingText, { color: C.muted }]}>Loading team…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!team && loadError) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
        <View style={[styles.centerWrap, { paddingHorizontal: pad, paddingBottom: insets.bottom + 24 }]}>
          <Ionicons name="alert-circle-outline" size={48} color={C.sub} style={{ marginBottom: spacing.md }} />
          <Text style={[styles.mutedTitle, { color: C.text, textAlign: "center" }]}>Could not load team</Text>
          <Text style={[styles.mutedSub, { color: C.muted, textAlign: "center" }]}>{loadError}</Text>
          <Pressable
            onPress={() => {
              setLoadingTeam(true);
              void loadTeam();
            }}
            style={[styles.backBtn, { borderColor: C.border, backgroundColor: C.surface, marginTop: spacing.md }]}
          >
            <Ionicons name="refresh" size={18} color={C.accent} />
            <Text style={[styles.backBtnText, { color: C.text }]}>Try again</Text>
          </Pressable>
          <Pressable
            onPress={handleBack}
            style={[styles.backBtn, { borderColor: C.border, backgroundColor: C.surface, marginTop: spacing.sm }]}
          >
            <Ionicons name="arrow-back" size={18} color={C.muted} />
            <Text style={[styles.backBtnText, { color: C.text }]}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!team) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
        <ScrollView
          contentContainerStyle={[styles.centerWrap, { paddingHorizontal: pad, paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        >
          <Ionicons name="people-outline" size={48} color={C.sub} style={{ marginBottom: spacing.md }} />
          <Text style={[styles.mutedTitle, { color: C.muted, textAlign: "center" }]}>
            You have not been assigned to a team for this project yet.
          </Text>
          <Pressable
            onPress={() => {
              void goHome();
            }}
            style={[styles.backBtn, { borderColor: C.border, backgroundColor: C.surface, marginTop: spacing.lg }]}
          >
            <Ionicons name="arrow-back" size={18} color={C.muted} />
            <Text style={[styles.backBtnText, { color: C.text }]}>Back to home</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const membersBlock = (
    <View
      style={[
        styles.membersCard,
        { borderColor: C.border, backgroundColor: C.surfaceMuted },
      ]}
    >
      <View style={styles.membersTitleRow}>
        <Ionicons name="people" size={16} color={C.muted} />
        <Text style={[styles.membersTitle, { color: C.text }]}>Team members</Text>
      </View>
      {team.members.map((member) => (
        <View key={member.studentId} style={[styles.memberRow, { borderColor: C.border, backgroundColor: C.surface }]}>
          <View style={[styles.avatar, { backgroundColor: C.accentMuted }]}>
            <Text style={[styles.avatarText, { color: C.accent }]}>{initialsOf(member.name)}</Text>
          </View>
          <Pressable
            onPress={() => openMemberProfile(member.userId)}
            style={styles.memberInfo}
            accessibilityRole="button"
            accessibilityLabel={`Open profile for ${member.name}`}
          >
            <Text style={[styles.memberName, { color: C.text }]} numberOfLines={1}>
              {member.name}
            </Text>
            {member.universityId ? (
              <Text style={[styles.memberSub, { color: C.sub }]} numberOfLines={1}>
                ID: {member.universityId}
              </Text>
            ) : null}
          </Pressable>
          <View style={styles.memberActions}>
            {member.matchScore > 0 ? (
              <View style={[styles.scoreBadge, { borderColor: C.border, backgroundColor: C.accentMuted }]}>
                <Text style={[styles.scoreBadgeText, { color: C.accent }]}>{member.matchScore.toFixed(0)}%</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => openMemberChat(member.userId)}
              hitSlop={8}
              style={[styles.iconBtn, { backgroundColor: C.surfaceMuted, borderColor: C.border }]}
              accessibilityRole="button"
              accessibilityLabel={`Message ${member.name}`}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.accent} />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );

  const listHeader = (
    <View style={{ paddingHorizontal: pad, paddingTop: spacing.sm, maxWidth: contentMax, width: "100%", alignSelf: "center" }}>
      <Pressable
        onPress={handleBack}
        style={[styles.backBtn, { borderColor: C.border, backgroundColor: C.surface, marginBottom: spacing.sm }]}
      >
        <Ionicons name="arrow-back" size={18} color={C.muted} />
        <Text style={[styles.backBtnText, { color: C.text }]}>Back</Text>
      </Pressable>

      <View style={[styles.headerCard, { borderColor: C.border, backgroundColor: C.surface }]}>
        <Text style={[styles.projectTitle, { color: C.text }]}>{team.projectTitle}</Text>
        <Text style={[styles.projectSub, { color: C.muted }]}>
          {teamLabel} · Team workspace
        </Text>
        <Pressable
          onPress={() => openCourseWorkspace(team.courseId, team.projectTitle)}
          style={[styles.courseLink, { marginTop: spacing.md }]}
        >
          <Ionicons name="school-outline" size={16} color={C.accent} />
          <Text style={[styles.courseLinkText, { color: C.accent }]}>Open course workspace</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: spacing.md }}>{membersBlock}</View>

      {!team.teamId ? (
        <View style={[styles.chatUnavailable, { borderColor: C.border, backgroundColor: C.surface, marginTop: spacing.md }]}>
          <Text style={[styles.noChatText, { color: C.muted }]}>Chat unavailable.</Text>
        </View>
      ) : null}

      {team.teamId && messages.length === 0 ? (
        <Text style={[styles.emptyChat, { color: C.sub, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          No messages yet. Say hello!
        </Text>
      ) : null}
    </View>
  );

  const renderMessage = useCallback(
    ({ item: msg }: { item: TeamChatMessageDto }) => {
      const isMe = msg.senderUserId === currentUserId;
      return (
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem, { maxWidth: contentMax * 0.92 }]}>
          {!isMe ? <Text style={[styles.senderLabel, { color: C.sub }]}>{msg.senderName}</Text> : null}
          <View
            style={[
              styles.bubble,
              isMe
                ? { backgroundColor: C.bubbleMe, borderBottomRightRadius: 4 }
                : { backgroundColor: C.bubbleOther, borderBottomLeftRadius: 4 },
            ]}
          >
            <Text style={[styles.bubbleText, { color: isMe ? C.bubbleMeText : C.bubbleOtherText }]}>{msg.text}</Text>
            <Text style={[styles.timeText, { color: isMe ? "rgba(255,255,255,0.75)" : C.sub }]}>
              {new Date(msg.sentAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>
      );
    },
    [C, contentMax, currentUserId],
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

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 48 : 0}
      >
        <FlatList
          ref={listRef}
          data={team.teamId ? messages : []}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderMessage}
          ListHeaderComponent={listHeader}
          onContentSizeChange={() => {
            if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          contentContainerStyle={{
            paddingBottom: spacing.md,
            flexGrow: 1,
          }}
          style={styles.flex1}
          keyboardShouldPersistTaps="handled"
        />

        {team.teamId ? (
          <View style={[styles.inputRow, { borderTopColor: C.border, backgroundColor: C.surface, paddingBottom: insets.bottom + spacing.sm }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message…"
              placeholderTextColor={C.sub}
              style={[styles.input, { borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]}
              editable={!sending}
              multiline
              maxLength={4000}
            />
            <Pressable
              onPress={() => void sendMessage()}
              disabled={sending || !input.trim()}
              style={[
                styles.sendBtn,
                { backgroundColor: C.bubbleMe, opacity: sending || !input.trim() ? 0.55 : 1 },
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles() {
  return StyleSheet.create({
    flex1: { flex: 1 },
    safe: { flex: 1 },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
    loadingText: { fontSize: 14, fontWeight: "600" },
    centerWrap: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl,
    },
    mutedTitle: { fontSize: 16, fontWeight: "800", marginBottom: spacing.sm },
    mutedSub: { fontSize: 13, fontWeight: "600", textAlign: "center", marginBottom: spacing.lg },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    backBtnText: { fontSize: 14, fontWeight: "700" },
    headerCard: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    projectTitle: { fontSize: 22, fontWeight: "800" },
    projectSub: { marginTop: 4, fontSize: 13, fontWeight: "600" },
    courseLink: { flexDirection: "row", alignItems: "center", gap: 8 },
    courseLinkText: { fontSize: 13, fontWeight: "700" },
    chatUnavailable: {
      flex: 1,
      minHeight: 120,
      borderWidth: 1,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
    },
    membersCard: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    membersTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
    membersTitle: { fontSize: 14, fontWeight: "800" },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.sm,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 12, fontWeight: "800" },
    memberInfo: { flex: 1, minWidth: 0 },
    memberName: { fontSize: 14, fontWeight: "700" },
    memberSub: { marginTop: 2, fontSize: 11, fontWeight: "600" },
    memberActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    scoreBadge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    scoreBadgeText: { fontSize: 10, fontWeight: "800" },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    noChatText: { fontSize: 13, fontWeight: "600" },
    emptyChat: { textAlign: "center", fontSize: 13, fontWeight: "600" },
    msgRow: { marginBottom: spacing.sm, paddingHorizontal: spacing.md, alignSelf: "stretch" },
    msgRowMe: { alignItems: "flex-end" },
    msgRowThem: { alignItems: "flex-start" },
    senderLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4, marginLeft: 4 },
    bubble: {
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      maxWidth: "88%",
    },
    bubbleText: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
    timeText: { fontSize: 10, fontWeight: "600", marginTop: 4 },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      fontWeight: "500",
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
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
