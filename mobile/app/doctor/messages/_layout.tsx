import { Stack, router, useGlobalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { DoctorConversationsPanel } from "@/components/doctor/messages/DoctorConversationsPanel";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { DoctorConversationsListProvider } from "@/contexts/DoctorConversationsListContext";
import { useDoctorConversationsListState } from "@/contexts/DoctorConversationsListContext";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useMessagesSplitLayout, MESSAGES_SIDEBAR_WIDTH } from "@/hooks/use-messages-split-layout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function SplitDoctorMessagesShell() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useGlobalSearchParams<{ conversationId?: string }>();
  const list = useDoctorConversationsListState();

  const selectedId = useMemo(() => {
    const paramId = params.conversationId ? Number(params.conversationId) : NaN;
    return Number.isFinite(paramId) ? paramId : null;
  }, [params.conversationId]);

  const handleSelect = (id: number) => {
    router.push(`/doctor/messages/${id}` as never);
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <DoctorScreen edges={["top"]}>
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

        {list.searchVisible ? (
          <View
            style={[
              styles.searchBar,
              {
                marginHorizontal: layout.horizontalPadding,
                marginBottom: DOCTOR_SPACE.sm,
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
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        ) : null}

        <View style={[styles.shell, { marginHorizontal: layout.horizontalPadding, marginBottom: layout.space("md") }]}>
          <View style={[styles.sidebar, { width: MESSAGES_SIDEBAR_WIDTH, borderColor: colors.border }]}>
            <DoctorConversationsPanel
              variant="sidebar"
              showPageHeader={false}
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
      </DoctorScreen>
    </GestureHandlerRootView>
  );
}

export default function DoctorMessagesLayout() {
  const isSplit = useMessagesSplitLayout();

  return (
    <DoctorConversationsListProvider>
      {isSplit ? (
        <SplitDoctorMessagesShell />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="[conversationId]" options={{ animation: "slide_from_right" }} />
        </Stack>
      )}
    </DoctorConversationsListProvider>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
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
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
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
