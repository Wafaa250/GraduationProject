import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ConversationListItem } from "@/api/conversationsApi";
import { DoctorConversationCard } from "@/components/doctor/messages/DoctorConversationCard";
import { DoctorConversationsListSkeleton } from "@/components/doctor/messages/DoctorConversationsListSkeleton";
import { DoctorMessagesFilterBar } from "@/components/doctor/messages/DoctorMessagesFilterBar";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { MessagesEmptyState } from "@/components/messages/MessagesEmptyState";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorConversationsListState } from "@/contexts/DoctorConversationsListContext";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  variant: "fullscreen" | "sidebar" | "sheet";
  selectedId?: number | null;
  onSelectConversation: (id: number) => void;
  showPageHeader?: boolean;
};

export function DoctorConversationsPanel({
  variant,
  selectedId = null,
  onSelectConversation,
  showPageHeader = true,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const list = useDoctorConversationsListState();
  const embedded = variant !== "fullscreen";

  const renderItem = ({ item }: { item: ConversationListItem }) => (
    <DoctorConversationCard
      item={item}
      currentUserId={list.currentUserId}
      selected={selectedId === item.id}
      embedded={embedded}
      onPress={() => onSelectConversation(item.id)}
    />
  );

  const filterBar = (
    <DoctorMessagesFilterBar value={list.filter} onChange={list.setFilter} embedded={embedded} />
  );

  const searchBar = list.searchVisible ? (
    <View
      style={[
        styles.searchBar,
        {
          marginHorizontal: embedded ? layout.space("md") : layout.horizontalPadding,
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name="search-outline" size={18} color={colors.muted} />
      <TextInput
        value={list.searchQuery}
        onChangeText={list.setSearchQuery}
        placeholder="Search conversations"
        placeholderTextColor={colors.muted}
        style={{ flex: 1, color: colors.foreground, fontSize: layout.fontSize.body, paddingVertical: 12 }}
        autoFocus={variant === "fullscreen"}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  ) : null;

  const unreadStrip =
    list.totalUnread > 0 && variant === "fullscreen" ? (
      <View
        style={[
          styles.unreadStrip,
          {
            marginHorizontal: layout.horizontalPadding,
            backgroundColor: colors.primarySoft,
            borderColor: colors.primaryBorder,
          },
        ]}
      >
        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.unreadBadgeText}>{list.totalUnread > 99 ? "99+" : list.totalUnread}</Text>
        </View>
        <Text style={[styles.unreadStripText, { color: colors.primary, fontSize: layout.fontSize.footer }]}>
          unread across all conversations
        </Text>
      </View>
    ) : null;

  const listBody =
    list.loading && list.conversations.length === 0 ? (
      <DoctorConversationsListSkeleton />
    ) : list.filteredConversations.length === 0 ? (
      <MessagesEmptyState
        title={
          list.searchQuery.trim()
            ? "No matches found"
            : list.conversations.length === 0
              ? "No conversations yet"
              : "No conversations in this filter"
        }
        description={
          list.searchQuery.trim()
            ? "Try a different name or message keyword."
            : list.conversations.length === 0
              ? "Messages with supervised students and course teams will appear here."
              : "Try another filter tab."
        }
        icon={list.searchQuery.trim() ? "search-outline" : "chatbubbles-outline"}
      />
    ) : (
      <FlatList
        data={list.filteredConversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: embedded ? layout.space("md") : layout.horizontalPadding,
          paddingTop: DOCTOR_SPACE.sm,
          paddingBottom: layout.space("xxl"),
          gap: DOCTOR_SPACE.sm,
        }}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={() => void list.load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
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
        {filterBar}
        {listBody}
      </View>
    );
  }

  if (variant === "sheet") {
    return (
      <View style={styles.sheetRoot}>
        {filterBar}
        {listBody}
      </View>
    );
  }

  return (
    <View style={styles.fullscreenRoot}>
      {showPageHeader ? (
        <View style={[styles.pageHeader, { paddingHorizontal: layout.horizontalPadding, paddingTop: layout.space("lg") }]}>
          <View style={styles.pageHeaderRow}>
            <View style={styles.pageHeaderText}>
              <Text style={[styles.pageTitle, { fontSize: layout.fontSize.title }]}>Messages</Text>
              <Text style={[styles.pageSubtitle, { fontSize: layout.fontSize.body, marginTop: layout.space("xs") }]}>
                Communicate with supervised students and course teams.
              </Text>
            </View>
            <Pressable
              onPress={list.toggleSearch}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={list.searchVisible ? "Close search" : "Search conversations"}
              style={[styles.headerAction, { backgroundColor: colors.inputBg }]}
            >
              <Ionicons
                name={list.searchVisible ? "close" : "search-outline"}
                size={20}
                color={list.searchVisible ? colors.primary : colors.foreground}
              />
            </Pressable>
          </View>
        </View>
      ) : null}
      {unreadStrip}
      {searchBar}
      {filterBar}
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
    sheetRoot: {
      flex: 1,
      minHeight: 280,
    },
    pageHeader: {
      paddingBottom: 12,
    },
    pageHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    pageHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    pageTitle: {
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.4,
    },
    pageSubtitle: {
      color: colors.muted,
      lineHeight: 22,
    },
    headerAction: {
      width: 36,
      height: 36,
      borderRadius: DOCTOR_RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
      marginBottom: DOCTOR_SPACE.sm,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadBadgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
    },
    unreadStripText: {
      fontWeight: "700",
      flex: 1,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: DOCTOR_SPACE.sm,
      paddingHorizontal: 14,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
  });
