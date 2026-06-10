import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { ConversationListItem } from "@/api/conversationsApi";
import { ConversationCard } from "@/components/messages/ConversationCard";
import { MessagesEmptyState } from "@/components/messages/MessagesEmptyState";
import { MessagesInboxHeader } from "@/components/messages/MessagesInboxHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useStudentConversationsListState } from "@/contexts/StudentConversationsListContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  variant: "fullscreen" | "sidebar" | "sheet";
  selectedId?: number | null;
  onSelectConversation: (id: number) => void;
};

export function StudentConversationsPanel({
  variant,
  selectedId = null,
  onSelectConversation,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const list = useStudentConversationsListState();
  const embedded = variant !== "fullscreen";

  const renderItem = ({ item }: { item: ConversationListItem }) => (
    <ConversationCard
      item={item}
      currentUserId={list.currentUserId}
      pinned={list.pinnedIds.has(item.id)}
      muted={list.mutedIds.has(item.id)}
      selected={selectedId === item.id}
      embedded={embedded}
      onPress={() => onSelectConversation(item.id)}
      onTogglePin={() => void list.handleTogglePin(item.id)}
      onToggleMute={() => void list.handleToggleMute(item.id)}
    />
  );

  const listBody =
    list.loading && list.conversations.length === 0 ? (
      <ActivityIndicator color={colors.primary} style={styles.loader} />
    ) : list.filteredConversations.length === 0 ? (
      <MessagesEmptyState
        title={list.searchQuery.trim() ? "No matches found" : "No conversations yet"}
        description={
          list.searchQuery.trim()
            ? "Try a different name or message keyword."
            : "Start connecting with students, doctors and organizations."
        }
        icon={list.searchQuery.trim() ? "search-outline" : "chatbubbles-outline"}
      />
    ) : (
      <FlatList
        data={list.filteredConversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: embedded ? layout.space("xs") : layout.space("xs"),
          paddingBottom: layout.space("xxl"),
        }}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={() => void list.load(true)}
            tintColor={colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    );

  if (variant === "sidebar") {
    return (
      <View style={styles.sidebarRoot}>
        <View style={[styles.sidebarHead, { paddingHorizontal: layout.space("md") }]}>
          <Text style={[styles.sidebarTitle, { fontSize: layout.fontSize.label }]}>Conversations</Text>
        </View>
        <View style={styles.sidebarList}>{listBody}</View>
      </View>
    );
  }

  if (variant === "sheet") {
    return (
      <View style={styles.sheetRoot}>
        {listBody}
      </View>
    );
  }

  return (
    <View style={styles.fullscreenRoot}>
      <MessagesInboxHeader
        totalUnread={list.totalUnread}
        searchVisible={list.searchVisible}
        searchQuery={list.searchQuery}
        onToggleSearch={list.toggleSearch}
        onSearchChange={list.setSearchQuery}
      />
      {listBody}
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    fullscreenRoot: {
      flex: 1,
    },
    sidebarRoot: {
      flex: 1,
      backgroundColor: colors.cardBg,
    },
    sidebarHead: {
      paddingTop: 14,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sidebarTitle: {
      fontWeight: "800",
      color: colors.foreground,
    },
    sidebarList: {
      flex: 1,
      minHeight: 0,
    },
    sheetRoot: {
      flex: 1,
      minHeight: 280,
    },
    loader: {
      marginTop: 32,
    },
  });
