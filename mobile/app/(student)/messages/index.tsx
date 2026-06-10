import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { MessagesThreadPlaceholder } from "@/components/messages/MessagesThreadPlaceholder";
import { StudentConversationsPanel } from "@/components/messages/StudentConversationsPanel";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useMessagesSplitLayout } from "@/hooks/use-messages-split-layout";

export default function MessagesListScreen() {
  const isSplit = useMessagesSplitLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isSplit) {
    return <MessagesThreadPlaceholder />;
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StudentConversationsPanel
          variant="fullscreen"
          onSelectConversation={(id) => router.push(`/messages/${id}` as never)}
        />
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
  });
