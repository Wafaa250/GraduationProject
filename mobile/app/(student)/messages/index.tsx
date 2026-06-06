import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getConversations,
  sumConversationUnseen,
  type ConversationListItem,
} from "@/api/conversationsApi";
import { getMe } from "@/api/meApi";
import { ConversationCard } from "@/components/messages/ConversationCard";
import { MessagesEmptyState } from "@/components/messages/MessagesEmptyState";
import { MessagesInboxHeader } from "@/components/messages/MessagesInboxHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  loadMutedConversationIds,
  loadPinnedConversationIds,
  toggleMutedConversationId,
  togglePinnedConversationId,
} from "@/lib/messageListPreferences";
import {
  getStudentConversationDisplayName,
  getStudentConversationPreview,
  getStudentConversationSubtitle,
} from "@/lib/studentMessagesNavigation";

function sortConversations(
  items: ConversationListItem[],
  pinnedIds: Set<number>,
): ConversationListItem[] {
  return [...items].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id) ? 1 : 0;
    const bPinned = pinnedIds.has(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;

    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export default function MessagesListScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [mutedIds, setMutedIds] = useState<Set<number>>(new Set());
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [list, me, pinned, muted] = await Promise.all([
        getConversations(),
        getMe().catch(() => null),
        loadPinnedConversationIds(),
        loadMutedConversationIds(),
      ]);
      setConversations(list);
      setCurrentUserId(me?.userId ?? null);
      setPinnedIds(pinned);
      setMutedIds(muted);
    } catch (err) {
      Alert.alert("Could not load messages", parseApiErrorMessage(err));
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalUnread = useMemo(() => sumConversationUnseen(conversations), [conversations]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sorted = sortConversations(conversations, pinnedIds);

    if (!query) return sorted;

    return sorted.filter((item) => {
      const name = getStudentConversationDisplayName(item, currentUserId).toLowerCase();
      const subtitle = getStudentConversationSubtitle(item, currentUserId).toLowerCase();
      const preview = getStudentConversationPreview(item).toLowerCase();
      return name.includes(query) || subtitle.includes(query) || preview.includes(query);
    });
  }, [conversations, currentUserId, pinnedIds, searchQuery]);

  const handleTogglePin = async (id: number) => {
    const next = await togglePinnedConversationId(id);
    setPinnedIds(next);
  };

  const handleToggleMute = async (id: number) => {
    const next = await toggleMutedConversationId(id);
    setMutedIds(next);
  };

  const renderItem = ({ item }: { item: ConversationListItem }) => (
    <ConversationCard
      item={item}
      currentUserId={currentUserId}
      pinned={pinnedIds.has(item.id)}
      muted={mutedIds.has(item.id)}
      onPress={() => router.push(`/messages/${item.id}` as never)}
      onTogglePin={() => void handleTogglePin(item.id)}
      onToggleMute={() => void handleToggleMute(item.id)}
    />
  );

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <MessagesInboxHeader
          totalUnread={totalUnread}
          searchVisible={searchVisible}
          searchQuery={searchQuery}
          onToggleSearch={() => {
            setSearchVisible((prev) => {
              if (prev) setSearchQuery("");
              return !prev;
            });
          }}
          onSearchChange={setSearchQuery}
        />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : filteredConversations.length === 0 ? (
          <MessagesEmptyState
            title={searchQuery.trim() ? "No matches found" : "No conversations yet"}
            description={
              searchQuery.trim()
                ? "Try a different name or message keyword."
                : "Start connecting with students, doctors and organizations."
            }
            icon={searchQuery.trim() ? "search-outline" : "chatbubbles-outline"}
          />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingTop: layout.space("xs"),
              paddingBottom: layout.space("xxl"),
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load(true)}
                tintColor={colors.primary}
              />
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loader: {
      marginTop: 48,
    },
  });
