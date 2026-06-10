import { Stack, router, useGlobalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { MessagesInboxHeader } from "@/components/messages/MessagesInboxHeader";
import { StudentConversationsPanel } from "@/components/messages/StudentConversationsPanel";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { StudentConversationsListProvider } from "@/contexts/StudentConversationsListContext";
import { useMessagesSplitLayout, MESSAGES_SIDEBAR_WIDTH } from "@/hooks/use-messages-split-layout";
import { useStudentConversationsListState } from "@/contexts/StudentConversationsListContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function SplitMessagesShell() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useGlobalSearchParams<{ conversationId?: string }>();
  const list = useStudentConversationsListState();

  const selectedId = useMemo(() => {
    const paramId = params.conversationId ? Number(params.conversationId) : NaN;
    return Number.isFinite(paramId) ? paramId : null;
  }, [params.conversationId]);

  const handleSelect = (id: number) => {
    router.push(`/messages/${id}` as never);
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <MessagesInboxHeader
          totalUnread={list.totalUnread}
          searchVisible={list.searchVisible}
          searchQuery={list.searchQuery}
          onToggleSearch={list.toggleSearch}
          onSearchChange={list.setSearchQuery}
        />

        <View style={[styles.shell, { marginHorizontal: layout.horizontalPadding, marginBottom: layout.space("md") }]}>
          <View style={[styles.sidebar, { width: MESSAGES_SIDEBAR_WIDTH, borderColor: colors.border }]}>
            <StudentConversationsPanel
              variant="sidebar"
              selectedId={selectedId}
              onSelectConversation={handleSelect}
            />
          </View>

          <View style={[styles.threadPane, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <Stack screenOptions={{ headerShown: false, animation: "none" }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="[conversationId]" />
            </Stack>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function MessagesLayout() {
  const isSplit = useMessagesSplitLayout();

  return (
    <StudentConversationsListProvider>
      {isSplit ? (
        <SplitMessagesShell />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="[conversationId]" />
        </Stack>
      )}
    </StudentConversationsListProvider>
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
    shell: {
      flex: 1,
      minHeight: 0,
      flexDirection: "row",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      backgroundColor: colors.cardBg,
    },
    sidebar: {
      borderRightWidth: 1,
      minHeight: 0,
    },
    threadPane: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
    },
  });
