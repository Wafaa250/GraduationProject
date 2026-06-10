import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { DoctorConversationsPanel } from "@/components/doctor/messages/DoctorConversationsPanel";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { MessagesThreadPlaceholder } from "@/components/messages/MessagesThreadPlaceholder";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useMessagesSplitLayout } from "@/hooks/use-messages-split-layout";

export default function DoctorMessagesListScreen() {
  const isSplit = useMessagesSplitLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isSplit) {
    return <MessagesThreadPlaceholder />;
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <DoctorScreen edges={["top"]}>
        <DoctorConversationsPanel
          variant="fullscreen"
          onSelectConversation={(id) => router.push(`/doctor/messages/${id}` as never)}
        />
      </DoctorScreen>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
  });
