import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getConversationById,
  getConversations,
  markConversationSeen,
  sendMessage,
  startConversation,
  type ConversationDetails,
  type ConversationMessage,
} from "@/api/conversationsApi";
import { getGraduationProjectById, getGraduationProjectMembers } from "@/api/gradProjectApi";
import { getDoctorMe } from "@/api/meApi";
import { DoctorChatBubble } from "@/components/doctor/messages/DoctorChatBubble";
import { DoctorChatComposer } from "@/components/doctor/messages/DoctorChatComposer";
import { DoctorChatSkeleton } from "@/components/doctor/messages/DoctorChatSkeleton";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { findDoctorProjectConversation } from "@/lib/doctorProjectConversation";
import { doctorProjectPath, DOCTOR_ROUTES } from "@/lib/doctorRoutes";

const POLL_MS = 4000;

export default function DoctorProjectTeamChatScreen() {
  const { projectId: idParam } = useLocalSearchParams<{ projectId: string }>();
  const projectId = Number(idParam);
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const listRef = useRef<FlatList<ConversationMessage>>(null);

  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [leaderUserId, setLeaderUserId] = useState<number | null>(null);
  const [thread, setThread] = useState<ConversationDetails | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadThread = useCallback(async (id: number, silent = false) => {
    if (!silent) setLoadingThread(true);
    try {
      const details = await getConversationById(id);
      setThread(details);
      await markConversationSeen(id).catch(() => undefined);
    } catch (err) {
      if (!silent) {
        setThread(null);
        Alert.alert("Could not load conversation", parseApiErrorMessage(err));
      }
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, []);

  const resolveConversation = useCallback(async () => {
    if (!Number.isFinite(projectId)) return;

    setLoading(true);
    setThread(null);
    setConversationId(null);

    try {
      const [project, members, conversations, me] = await Promise.all([
        getGraduationProjectById(projectId),
        getGraduationProjectMembers(projectId),
        getConversations(),
        getDoctorMe(),
      ]);

      const userId = me?.userId ?? me?.user?.userId ?? null;
      setCurrentUserId(userId);
      setProjectName(project.name);

      const memberUserIds = members.members.map((m) => m.userId).filter((id) => id > 0);
      const leader =
        members.members.find((m) => m.role.toLowerCase() === "leader") ?? members.members[0];
      setLeaderUserId(leader?.userId ?? null);

      if (!userId) return;

      const match = findDoctorProjectConversation(
        conversations,
        project.name,
        memberUserIds,
        userId,
      );

      if (match) {
        setConversationId(match.id);
        await loadThread(match.id);
      }
    } catch (err) {
      Alert.alert("Could not open team chat", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadThread, projectId]);

  useFocusEffect(
    useCallback(() => {
      void resolveConversation();
    }, [resolveConversation]),
  );

  useEffect(() => {
    if (!conversationId) return undefined;
    const timer = setInterval(() => {
      void loadThread(conversationId, true);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId, loadThread]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!conversationId || !text) return;
    setSending(true);
    try {
      await sendMessage(conversationId, text);
      setDraft("");
      await loadThread(conversationId);
      listRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      Alert.alert("Send failed", parseApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleStartWithLeader = async () => {
    if (!leaderUserId) return;
    setStartingChat(true);
    try {
      const id = await startConversation(leaderUserId);
      setConversationId(id);
      await loadThread(id);
      Alert.alert("Conversation started", "You can now message the team lead.");
    } catch (err) {
      Alert.alert("Could not start conversation", parseApiErrorMessage(err));
    } finally {
      setStartingChat(false);
    }
  };

  const senderNames = useMemo(() => {
    const map = new Map<number, string>();
    thread?.users.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [thread?.users]);

  const showEmpty = !loading && !loadingThread && conversationId == null;

  if (!Number.isFinite(projectId)) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Invalid project" fallbackHref={DOCTOR_ROUTES.projects} />
      </DoctorScreen>
    );
  }

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader
        title="Team Chat"
        subtitle={projectName ? projectName : undefined}
        fallbackHref={doctorProjectPath(projectId)}
        variant="compact"
        rightSlot={
          <Pressable
            onPress={() => router.push(doctorProjectPath(projectId) as Href)}
            hitSlop={8}
            style={[styles.overviewBtn, { backgroundColor: colors.primarySoft }]}
          >
            <Text style={[styles.overviewBtnText, { color: colors.primary }]}>Overview</Text>
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : showEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <MessageSquare size={28} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>No team chat yet</Text>
          <Text style={styles.emptyDesc}>
            Start a supervision conversation with the team lead. Messages support announcements and
            shared file links.
          </Text>
          {leaderUserId ? (
            <Pressable
              onPress={() => void handleStartWithLeader()}
              disabled={startingChat}
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: colors.primary, opacity: startingChat || pressed ? 0.85 : 1 },
              ]}
            >
              {startingChat ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.startBtnText}>Message team lead</Text>
              )}
            </Pressable>
          ) : (
            <Text style={styles.emptyHint}>Team member information is not available yet.</Text>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={layout.insets.top + 56}
        >
          {loadingThread && !thread ? (
            <DoctorChatSkeleton />
          ) : (
            <FlatList
              ref={listRef}
              data={thread?.messages ?? []}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item, index }) => {
                const messages = thread?.messages ?? [];
                const prev = messages[index - 1];
                const next = messages[index + 1];
                const isMine = currentUserId != null && item.senderId === currentUserId;
                const sameSenderAsPrev =
                  prev != null && prev.senderId === item.senderId && !prev.deleted && !item.deleted;
                const sameSenderAsNext =
                  next != null && next.senderId === item.senderId && !next.deleted && !item.deleted;

                return (
                  <DoctorChatBubble
                    message={item}
                    senderName={senderNames.get(item.senderId) ?? "Participant"}
                    isMine={isMine}
                    isFirstInGroup={!sameSenderAsPrev}
                    isLastInGroup={!sameSenderAsNext}
                    isNewGroup={!sameSenderAsPrev && index > 0}
                    isTeamChat
                  />
                );
              }}
              contentContainerStyle={{
                paddingHorizontal: layout.horizontalPadding,
                paddingVertical: DOCTOR_SPACE.md,
                gap: DOCTOR_SPACE.sm,
                flexGrow: 1,
              }}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
            />
          )}

          <DoctorChatComposer
            value={draft}
            onChange={setDraft}
            onSend={() => void handleSend()}
            sending={sending}
            disabled={!conversationId}
          />
        </KeyboardAvoidingView>
      )}
    </DoctorScreen>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    flex: { flex: 1 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    overviewBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: DOCTOR_RADIUS.pill,
    },
    overviewBtnText: {
      fontSize: 12,
      fontWeight: "700",
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
      paddingBottom: 40,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      marginTop: DOCTOR_SPACE.lg,
      fontSize: 18,
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
    },
    emptyDesc: {
      marginTop: DOCTOR_SPACE.sm,
      fontSize: 14,
      lineHeight: 21,
      color: colors.muted,
      textAlign: "center",
      maxWidth: 320,
    },
    startBtn: {
      marginTop: DOCTOR_SPACE.lg,
      minHeight: 48,
      paddingHorizontal: 24,
      borderRadius: DOCTOR_RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
    },
    startBtnText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 15,
    },
    emptyHint: {
      marginTop: DOCTOR_SPACE.md,
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
    },
  });
}
