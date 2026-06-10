import { StyleSheet, Text, View } from "react-native";

import type { ConversationMessage } from "@/api/conversationsApi";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatStudentMessageTime } from "@/lib/studentMessagesNavigation";

type Props = {
  message: ConversationMessage;
  mine: boolean;
  senderName: string | null;
};

/** Student thread bubble — WEB parity: sender label on group/team chats only. */
export function StudentChatBubble({ message, mine, senderName }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  if (message.deleted) {
    return (
      <View style={styles.removedWrap}>
        <Text style={[styles.removed, { fontSize: layout.fontSize.footer - 1 }]}>Message removed</Text>
      </View>
    );
  }

  const time = formatStudentMessageTime(message.createdAt);

  return (
    <View style={[styles.wrap, mine ? styles.wrapMine : styles.wrapOther]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        {senderName ? (
          <Text style={[styles.senderLabel, { fontSize: layout.fontSize.footer - 1 }]} numberOfLines={1}>
            {senderName}
          </Text>
        ) : null}
        <Text style={[styles.body, { fontSize: layout.fontSize.body, lineHeight: layout.scale(20) }, mine && styles.bodyMine]}>
          {message.text}
        </Text>
        <Text style={[styles.time, { fontSize: 10 }, mine && styles.timeMine]}>
          {time}
          {message.edited ? " · Edited" : ""}
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    wrap: {
      width: "100%",
    },
    wrapMine: {
      alignItems: "flex-end",
    },
    wrapOther: {
      alignItems: "flex-start",
    },
    removedWrap: {
      width: "100%",
      alignItems: "center",
      paddingVertical: 4,
    },
    removed: {
      color: colors.muted,
      fontStyle: "italic",
    },
    bubble: {
      maxWidth: "82%",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 4,
    },
    bubbleMine: {
      backgroundColor: colors.primary,
    },
    bubbleOther: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    senderLabel: {
      color: colors.primary,
      fontWeight: "700",
    },
    body: {
      color: colors.foreground,
    },
    bodyMine: {
      color: "#FFFFFF",
    },
    time: {
      color: colors.muted,
      alignSelf: "flex-end",
      fontWeight: "500",
    },
    timeMine: {
      color: "rgba(255,255,255,0.75)",
    },
  });
}
