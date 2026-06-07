import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getConversations,
  sumConversationUnseen,
  type ConversationListItem,
} from "@/api/conversationsApi";
import { getDoctorMe } from "@/api/meApi";
import { DoctorConversationCard } from "@/components/doctor/messages/DoctorConversationCard";
import { DoctorConversationsListSkeleton } from "@/components/doctor/messages/DoctorConversationsListSkeleton";
import { DoctorMessagesFilterBar } from "@/components/doctor/messages/DoctorMessagesFilterBar";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import { MessagesEmptyState } from "@/components/messages/MessagesEmptyState";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  getDoctorConversationDisplayName,
  getDoctorConversationKind,
  getDoctorConversationPreview,
  getDoctorConversationSubtitle,
  type DoctorMessagesFilter,
} from "@/lib/doctorMessagesNavigation";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

export default function DoctorMessagesListScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [filter, setFilter] = useState<DoctorMessagesFilter>("all");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [list, me] = await Promise.all([getConversations(), getDoctorMe().catch(() => null)]);
      setConversations(list);
      setCurrentUserId(me?.userId ?? me?.user?.userId ?? null);
    } catch (err) {
      Alert.alert("Could not load messages", parseApiErrorMessage(err));
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const totalUnread = useMemo(() => sumConversationUnseen(conversations), [conversations]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let items = conversations;

    if (filter !== "all") {
      items = items.filter((item) => getDoctorConversationKind(item) === filter);
    }

    if (!query) return items;

    return items.filter((item) => {
      const name = getDoctorConversationDisplayName(item, currentUserId).toLowerCase();
      const subtitle = getDoctorConversationSubtitle(item, currentUserId).toLowerCase();
      const preview = getDoctorConversationPreview(item).toLowerCase();
      return name.includes(query) || subtitle.includes(query) || preview.includes(query);
    });
  }, [conversations, currentUserId, filter, searchQuery]);

  const renderItem = ({ item }: { item: ConversationListItem }) => (
    <DoctorConversationCard
      item={item}
      currentUserId={currentUserId}
      onPress={() => router.push(`/doctor/messages/${item.id}` as never)}
    />
  );

  return (
    <GestureHandlerRootView style={styles.flex}>
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader
          title="Messages"
          subtitle="Communicate with supervised students and course teams."
          fallbackHref={DOCTOR_ROUTES.dashboard}
          rightSlot={
            <Pressable
              onPress={() => {
                setSearchVisible((prev) => {
                  if (prev) setSearchQuery("");
                  return !prev;
                });
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={searchVisible ? "Close search" : "Search conversations"}
              style={[styles.headerAction, { backgroundColor: colors.inputBg }]}
            >
              <Ionicons
                name={searchVisible ? "close" : "search-outline"}
                size={20}
                color={searchVisible ? colors.primary : colors.foreground}
              />
            </Pressable>
          }
        />

        {totalUnread > 0 ? (
          <View style={[styles.unreadStrip, { marginHorizontal: layout.horizontalPadding, backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }]}>
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>{totalUnread > 99 ? "99+" : totalUnread}</Text>
            </View>
            <Text style={[styles.unreadStripText, { color: colors.primary, fontSize: layout.fontSize.footer }]}>
              unread across all conversations
            </Text>
          </View>
        ) : null}

        {searchVisible ? (
          <View style={[styles.searchBar, { marginHorizontal: layout.horizontalPadding, backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, color: colors.foreground, fontSize: layout.fontSize.body, paddingVertical: 12 }}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        ) : null}

        <DoctorMessagesFilterBar value={filter} onChange={setFilter} />

        {loading && conversations.length === 0 ? (
          <DoctorConversationsListSkeleton />
        ) : filteredConversations.length === 0 ? (
          <MessagesEmptyState
            title={
              searchQuery.trim()
                ? "No matches found"
                : conversations.length === 0
                  ? "No conversations yet"
                  : "No conversations in this filter"
            }
            description={
              searchQuery.trim()
                ? "Try a different name or message keyword."
                : conversations.length === 0
                  ? "Messages with supervised students and course teams will appear here."
                  : "Try another filter tab."
            }
            icon={searchQuery.trim() ? "search-outline" : "chatbubbles-outline"}
          />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: DOCTOR_SPACE.sm,
              paddingBottom: layout.space("xxl"),
              gap: DOCTOR_SPACE.sm,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load(true)}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </DoctorScreen>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
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
