import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatParticipantsSheet } from "@/components/messages/ChatParticipantsSheet";
import { ConversationsListSheet } from "@/components/messages/ConversationsListSheet";
import { StudentConversationsPanel } from "@/components/messages/StudentConversationsPanel";
import { MobileNavHeader } from "@/components/navigation/MobileNavHeader";
import { StudentChatBubble } from "@/components/messages/StudentChatBubble";
import { MessagesEmptyState } from "@/components/messages/MessagesEmptyState";
import { useMessagesSplitLayout } from "@/hooks/use-messages-split-layout";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  deleteConversation,
  getConversationById,
  markConversationSeen,
  sendMessage,
  type ConversationDetails,
  type ConversationMessage,
} from "@/api/conversationsApi";
import { getMe } from "@/api/meApi";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useStudentConversationsListState } from "@/contexts/StudentConversationsListContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import {
  getStudentConversationDisplayName,
  getStudentConversationSubtitle,
  getStudentMessageSenderName,
  isStudentGroupConversation,
} from "@/lib/studentMessagesNavigation";

export default function MessageThreadScreen() {
  const layout = useResponsiveLayout();
  const isSplit = useMessagesSplitLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const conversationNumericId = Number(conversationId);
  const listRef = useRef<FlatList<ConversationMessage>>(null);
  const composerRef = useRef<TextInput>(null);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [thread, setThread] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const conversationsList = useStudentConversationsListState();

  const loadThread = useCallback(async (silent = false) => {
    if (!Number.isFinite(conversationNumericId)) return;
    if (!silent) setLoading(true);
    try {
      const details = await getConversationById(conversationNumericId);
      setThread(details);
      await markConversationSeen(conversationNumericId).catch(() => undefined);
    } catch (err) {
      if (!silent) {
        Alert.alert("Could not load conversation", parseApiErrorMessage(err));
      }
      setThread(null);
    } finally {
      setLoading(false);
    }
  }, [conversationNumericId]);

  useEffect(() => {
    void getMe()
      .then((me) => setCurrentUserId(me.userId))
      .catch(() => setCurrentUserId(null));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadThread(true);
    }, [loadThread]),
  );

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !Number.isFinite(conversationNumericId) || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationNumericId, text);
      setDraft("");
      await loadThread(true);
      listRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      Alert.alert("Send failed", parseApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = () => {
    if (!Number.isFinite(conversationNumericId)) return;

    confirmAlert({
      title: "Delete conversation",
      message: "This conversation will be removed from your inbox.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deleteConversation(conversationNumericId);
          conversationsList.removeConversation(conversationNumericId);
          setThread(null);
          router.replace("/messages");
        } catch (err) {
          showAlert("Delete failed", parseApiErrorMessage(err));
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const title = thread ? getStudentConversationDisplayName(thread, currentUserId) : "Conversation";
  const subtitle = thread ? getStudentConversationSubtitle(thread, currentUserId) : "";
  const isGroupConversation = thread ? isStudentGroupConversation(thread) : false;
  const showParticipants = isGroupConversation && (thread?.users.length ?? 0) > 0;

  const renderMessage = ({ item }: { item: ConversationMessage }) => {
    const mine = currentUserId != null && item.senderId === currentUserId;
    const senderName = isGroupConversation && thread
      ? getStudentMessageSenderName(thread.users, item.senderId, currentUserId)
      : null;

    return <StudentChatBubble message={item} mine={mine} senderName={senderName} />;
  };

  const conversationsButton = !isSplit ? (
    <Pressable
      onPress={() => setConversationsOpen(true)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open conversations"
      style={styles.conversationsBtn}
    >
      <Ionicons name="chatbubbles-outline" size={22} color={colors.foreground} />
    </Pressable>
  ) : null;

  return (
    <SafeAreaView style={styles.container} edges={isSplit ? ["bottom"] : ["top", "bottom"]}>
      <MobileNavHeader
        title={title}
        subtitle={subtitle || undefined}
        fallbackHref="/messages"
        showBack={!isSplit}
        leftAccessory={conversationsButton}
        backColor={colors.foreground}
        titleColor={colors.foreground}
        backgroundColor={colors.cardBg}
        borderColor={colors.border}
        rightSlot={
          <View style={styles.headerActions}>
            {showParticipants ? (
              <Pressable
                onPress={() => setParticipantsOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="View participants"
              >
                <Ionicons name="people-outline" size={20} color={colors.muted} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete conversation"
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.muted} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              )}
            </Pressable>
          </View>
        }
      />

      <ChatParticipantsSheet
        visible={participantsOpen}
        participants={thread?.users ?? []}
        currentUserId={currentUserId}
        onClose={() => setParticipantsOpen(false)}
      />

      <ConversationsListSheet
        visible={conversationsOpen}
        onClose={() => setConversationsOpen(false)}
      >
        <StudentConversationsPanel
          variant="sheet"
          selectedId={conversationNumericId}
          onSelectConversation={(id) => {
            setConversationsOpen(false);
            if (id !== conversationNumericId) {
              router.replace(`/messages/${id}` as never);
            }
          }}
        />
      </ConversationsListSheet>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={layout.scale(8)}
      >
        {loading && !thread ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : !thread ? (
          <MessagesEmptyState
            title="Conversation not found"
            description="Go back and choose a conversation from your inbox."
            icon="alert-circle-outline"
          />
        ) : (
          <FlatList
            ref={listRef}
            data={thread.messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            ListEmptyComponent={
              <Text style={[styles.emptyThread, { color: colors.muted }]}>No messages yet.</Text>
            }
            contentContainerStyle={{
              paddingHorizontal: layout.horizontalPadding,
              paddingVertical: layout.space("md"),
              gap: 8,
              flexGrow: 1,
            }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View
          style={[
            styles.composer,
            { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.space("md") },
          ]}
        >
          <TextInput
            ref={composerRef}
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor={colors.muted}
            style={[styles.input, { borderRadius: layout.radius.input, fontSize: layout.fontSize.body }]}
            multiline
          />
          <Pressable
            onPress={() => void handleSend()}
            disabled={sending || !draft.trim()}
            style={[styles.sendBtn, { borderRadius: layout.radius.input }]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    conversationsBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyThread: {
      textAlign: "center",
      fontSize: 14,
      marginTop: 24,
    },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.cardBg,
      paddingTop: 10,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      color: colors.foreground,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sendBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
  });
