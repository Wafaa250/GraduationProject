import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  deleteConversation,
  getConversationById,
  markConversationSeen,
  sendMessage,
  type ConversationDetails,
  type ConversationMessage,
} from "@/api/conversationsApi";
import { getDoctorMe } from "@/api/meApi";
import { DoctorChatBubble } from "@/components/doctor/messages/DoctorChatBubble";
import { DoctorChatComposer } from "@/components/doctor/messages/DoctorChatComposer";
import { DoctorChatSkeleton } from "@/components/doctor/messages/DoctorChatSkeleton";
import { DoctorChatThreadHeader } from "@/components/doctor/messages/DoctorChatThreadHeader";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { MessagesEmptyState } from "@/components/messages/MessagesEmptyState";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  getDoctorConversationDisplayName,
  getDoctorConversationKind,
  getDoctorStudentProfilePath,
} from "@/lib/doctorMessagesNavigation";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

const POLL_MS = 4000;

type LoadError = "invalid" | "failed";

export default function DoctorMessageThreadScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const conversationNumericId = Number(conversationId);
  const listRef = useRef<FlatList<ConversationMessage>>(null);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [thread, setThread] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isValidId = Number.isFinite(conversationNumericId) && conversationNumericId > 0;

  const senderNames = useMemo(() => {
    const map = new Map<number, string>();
    thread?.users.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [thread?.users]);

  const loadThread = useCallback(
    async (options?: { silent?: boolean; refreshUser?: boolean }) => {
      const silent = options?.silent ?? false;
      const refreshUser = options?.refreshUser ?? false;

      if (!isValidId) {
        setLoadError("invalid");
        setThread(null);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
        setLoadError(null);
        setErrorMessage("");
      }

      try {
        const [me, details] = await Promise.all([
          refreshUser ? getDoctorMe().catch(() => null) : Promise.resolve(null),
          getConversationById(conversationNumericId),
        ]);

        if (me?.userId) {
          setCurrentUserId(me.userId);
        }

        setThread(details);
        setLoadError(null);
        await markConversationSeen(conversationNumericId).catch(() => undefined);
      } catch (err) {
        if (!silent) {
          setThread(null);
          setLoadError("failed");
          setErrorMessage(parseApiErrorMessage(err));
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [conversationNumericId, isValidId],
  );

  useEffect(() => {
    setThread(null);
    setDraft("");
    setLoadError(null);
    setErrorMessage("");

    void (async () => {
      if (!isValidId) {
        setLoadError("invalid");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [me, details] = await Promise.all([
          getDoctorMe().catch(() => null),
          getConversationById(conversationNumericId),
        ]);
        setCurrentUserId(me?.userId ?? null);
        setThread(details);
        await markConversationSeen(conversationNumericId).catch(() => undefined);
      } catch (err) {
        setThread(null);
        setLoadError("failed");
        setErrorMessage(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationNumericId, isValidId]);

  useFocusEffect(
    useCallback(() => {
      if (!isValidId) return;
      const interval = setInterval(() => {
        void loadThread({ silent: true });
      }, POLL_MS);
      return () => clearInterval(interval);
    }, [isValidId, loadThread]),
  );

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !isValidId || sending || !thread) return;

    setSending(true);
    try {
      await sendMessage(conversationNumericId, text);
      setDraft("");
      await loadThread({ silent: true });
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (err) {
      Alert.alert("Send failed", parseApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete conversation?",
      "This permanently removes the conversation and all messages for everyone in this chat. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                await deleteConversation(conversationNumericId);
                router.replace(DOCTOR_ROUTES.messages as never);
              } catch (err) {
                Alert.alert("Could not delete conversation", parseApiErrorMessage(err));
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleViewStudent = () => {
    if (!thread) return;
    const path = getDoctorStudentProfilePath(thread, currentUserId);
    if (path) router.push(path as never);
  };

  const title = thread ? getDoctorConversationDisplayName(thread, currentUserId) : "Conversation";
  const kind = thread ? getDoctorConversationKind(thread) : null;
  const showViewStudent =
    thread != null &&
    kind === "student" &&
    getDoctorStudentProfilePath(thread, currentUserId) != null;

  const isTeamChat = kind === "team";

  const renderMessage = ({ item, index }: { item: ConversationMessage; index: number }) => {
    const messages = thread?.messages ?? [];
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const isMine = currentUserId != null && item.senderId === currentUserId;

    const sameSenderAsPrev =
      prev != null && prev.senderId === item.senderId && !prev.deleted && !item.deleted;
    const sameSenderAsNext =
      next != null && next.senderId === item.senderId && !next.deleted && !item.deleted;

    const isFirstInGroup = !sameSenderAsPrev;
    const isLastInGroup = !sameSenderAsNext;
    const isNewGroup = isFirstInGroup && index > 0;

    return (
      <DoctorChatBubble
        message={item}
        senderName={senderNames.get(item.senderId) ?? "Participant"}
        isMine={isMine}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
        isNewGroup={isNewGroup}
        isTeamChat={isTeamChat}
      />
    );
  };

  const renderBody = () => {
    if (loading && !thread) {
      return <DoctorChatSkeleton />;
    }

    if (loadError === "invalid") {
      return (
        <MessagesEmptyState
          title="Conversation not found"
          description="This conversation link is invalid. Go back and choose a conversation from your inbox."
          icon="alert-circle-outline"
        />
      );
    }

    if (loadError === "failed") {
      return (
        <View style={styles.errorWrap}>
          <MessagesEmptyState
            title="Could not load conversation"
            description={errorMessage || "Something went wrong while loading this conversation."}
            icon="cloud-offline-outline"
          />
          <Pressable
            onPress={() => void loadThread({ refreshUser: true })}
            style={[styles.retryBtn, { borderRadius: layout.radius.input, paddingHorizontal: layout.space("lg") }]}
            accessibilityRole="button"
            accessibilityLabel="Retry loading conversation"
          >
            <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        ref={listRef}
        data={thread?.messages ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        style={styles.messageList}
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: layout.space("sm"),
          paddingBottom: layout.space("md"),
          flexGrow: 1,
          justifyContent: (thread?.messages.length ?? 0) === 0 ? "center" : "flex-start",
        }}
        ListEmptyComponent={
          thread ? (
            <View style={styles.emptyWrap}>
              <MessagesEmptyState
                title="No messages yet"
                description="Send the first message to begin the academic conversation with your students."
                icon="chatbubble-ellipses-outline"
              />
            </View>
          ) : null
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <DoctorScreen edges={["top"]}>
      {thread ? (
        <DoctorChatThreadHeader
          title={title}
          kind={kind}
          participantCount={thread.participantCount}
          participants={thread.users}
          showViewStudent={showViewStudent}
          deleting={deleting}
          onViewStudent={handleViewStudent}
          onDelete={handleDelete}
        />
      ) : (
        <DoctorChatThreadHeader
          title="Conversation"
          kind={null}
          participantCount={0}
          participants={[]}
          showViewStudent={false}
          deleting={deleting}
          onViewStudent={() => undefined}
          onDelete={handleDelete}
        />
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={layout.scale(8)}
      >
        {renderBody()}

        {thread && !loadError ? (
          <DoctorChatComposer
            value={draft}
            sending={sending}
            disabled={!thread}
            onChange={setDraft}
            onSend={() => void handleSend()}
          />
        ) : null}
      </KeyboardAvoidingView>
    </DoctorScreen>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cardBg,
    },
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    messageList: {
      flex: 1,
      backgroundColor: colors.background,
    },
    emptyWrap: {
      paddingVertical: 24,
    },
    errorWrap: {
      flex: 1,
      justifyContent: "center",
      paddingBottom: 24,
    },
    retryBtn: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      paddingVertical: 12,
      backgroundColor: colors.primary,
    },
    retryText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },
  });
