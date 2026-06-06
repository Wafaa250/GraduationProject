import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  formatStudentMessageTime,
  getStudentConversationDisplayName,
} from "@/lib/studentMessagesNavigation";

export default function MessageThreadScreen() {
  const layout = useResponsiveLayout();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const conversationNumericId = Number(conversationId);
  const listRef = useRef<FlatList<ConversationMessage>>(null);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [thread, setThread] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadThread = useCallback(async () => {
    if (!Number.isFinite(conversationNumericId)) return;
    setLoading(true);
    try {
      const details = await getConversationById(conversationNumericId);
      setThread(details);
      await markConversationSeen(conversationNumericId).catch(() => undefined);
    } catch (err) {
      Alert.alert("Could not load conversation", parseApiErrorMessage(err));
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

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !Number.isFinite(conversationNumericId) || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationNumericId, text);
      setDraft("");
      await loadThread();
      listRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      Alert.alert("Send failed", parseApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete conversation", "This conversation will be removed from your inbox.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setDeleting(true);
            try {
              await deleteConversation(conversationNumericId);
              router.replace("/messages");
            } catch (err) {
              Alert.alert("Delete failed", parseApiErrorMessage(err));
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  const title = thread ? getStudentConversationDisplayName(thread, currentUserId) : "Conversation";

  const renderMessage = ({ item }: { item: ConversationMessage }) => {
    const mine = currentUserId != null && item.senderId === currentUserId;
    return (
      <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
          <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
            {formatStudentMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={[styles.topBar, { paddingHorizontal: layout.horizontalPadding }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={HUB_COLORS.foreground} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={handleDelete} disabled={deleting} hitSlop={8}>
          {deleting ? (
            <ActivityIndicator size="small" color={HUB_COLORS.muted} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={HUB_COLORS.muted} />
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={layout.scale(8)}
      >
        {loading ? (
          <ActivityIndicator color={HUB_COLORS.primary} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={thread?.messages ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={{
              paddingHorizontal: layout.horizontalPadding,
              paddingVertical: layout.space("md"),
              gap: 8,
              flexGrow: 1,
            }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={[styles.composer, { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.space("md") }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message..."
            placeholderTextColor={HUB_COLORS.muted}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.cardBg,
  },
  backBtn: {
    padding: 4,
  },
  topTitle: {
    flex: 1,
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    fontSize: 16,
  },
  bubbleWrap: {
    width: "100%",
  },
  bubbleWrapMine: {
    alignItems: "flex-end",
  },
  bubbleWrapOther: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: HUB_COLORS.primary,
  },
  bubbleOther: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
  },
  bubbleText: {
    color: HUB_COLORS.foreground,
    lineHeight: 20,
    fontSize: 15,
  },
  bubbleTextMine: {
    color: "#FFFFFF",
  },
  bubbleTime: {
    fontSize: 11,
    color: HUB_COLORS.muted,
    alignSelf: "flex-end",
  },
  bubbleTimeMine: {
    color: "rgba(255,255,255,0.8)",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.cardBg,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.inputBg,
    color: HUB_COLORS.foreground,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HUB_COLORS.primary,
  },
});
