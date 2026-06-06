import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getConversations, type ConversationListItem } from "@/api/conversationsApi";
import { getMe } from "@/api/meApi";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  formatStudentMessageTime,
  getStudentConversationDisplayName,
  getStudentConversationPreview,
  getStudentConversationSubtitle,
} from "@/lib/studentMessagesNavigation";

export default function MessagesListScreen() {
  const layout = useResponsiveLayout();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, me] = await Promise.all([getConversations(), getMe().catch(() => null)]);
      setConversations(list);
      setCurrentUserId(me?.userId ?? null);
    } catch (err) {
      Alert.alert("Could not load messages", parseApiErrorMessage(err));
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const renderItem = ({ item }: { item: ConversationListItem }) => {
    const title = getStudentConversationDisplayName(item, currentUserId);
    const subtitle = getStudentConversationSubtitle(item, currentUserId);
    const preview = getStudentConversationPreview(item);
    const time = formatStudentMessageTime(item.lastMessage?.createdAt);
    const unread = item.unseenCount > 0;

    return (
      <Pressable
        onPress={() => router.push(`/messages/${item.id}` as never)}
        style={[styles.row, { paddingHorizontal: layout.horizontalPadding, paddingVertical: layout.space("md") }]}
      >
        <View style={styles.rowText}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {time ? <Text style={styles.time}>{time}</Text> : null}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={2}>
            {preview}
          </Text>
        </View>
        {unread ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unseenCount > 9 ? "9+" : item.unseenCount}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { paddingHorizontal: layout.horizontalPadding, paddingTop: layout.space("lg") }]}>
        <Text style={[styles.pageTitle, { fontSize: layout.fontSize.title }]}>Messages</Text>
        <Text style={[styles.pageSubtitle, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
          Your conversations and project team chats.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={HUB_COLORS.primary} style={{ marginTop: 32 }} />
      ) : conversations.length === 0 ? (
        <Text style={[styles.empty, { paddingHorizontal: layout.horizontalPadding }]}>
          No conversations yet. Start messaging from the Communication Hub recommendations.
        </Text>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={() => void load()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  header: {
    paddingBottom: 12,
  },
  pageTitle: {
    fontWeight: "800",
    color: HUB_COLORS.foreground,
  },
  pageSubtitle: {
    color: HUB_COLORS.muted,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: HUB_COLORS.cardBg,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    fontSize: 16,
  },
  time: {
    color: HUB_COLORS.muted,
    fontSize: 12,
  },
  subtitle: {
    color: HUB_COLORS.muted,
    fontSize: 13,
  },
  preview: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  previewUnread: {
    color: HUB_COLORS.foreground,
    fontWeight: "600",
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: HUB_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: HUB_COLORS.border,
    marginLeft: 16,
  },
  empty: {
    color: HUB_COLORS.muted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 32,
  },
});
