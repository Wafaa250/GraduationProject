import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Megaphone } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { ConversationMessage } from "@/api/conversationsApi";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  extractLinkAttachment,
  formatDoctorMessageBubbleTime,
  getMessageTextStyle,
  isAnnouncementMessage,
} from "@/lib/doctorMessagesNavigation";

type Props = {
  message: ConversationMessage;
  senderName: string;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isNewGroup: boolean;
  isTeamChat: boolean;
};

export function DoctorChatBubble({
  message,
  senderName,
  isMine,
  isFirstInGroup,
  isLastInGroup,
  isNewGroup,
  isTeamChat,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  const showSenderLabel = !isMine && isFirstInGroup && isTeamChat;

  if (message.deleted) {
    return (
      <View style={[styles.removedWrap, { marginTop: isNewGroup ? 10 : 0, marginBottom: 6 }]}>
        <Text style={[styles.removed, { fontSize: layout.fontSize.footer - 1 }]}>Message removed</Text>
      </View>
    );
  }

  const text = message.text.trim();
  const announcement = isAnnouncementMessage(text);
  const linkAttachment = !announcement ? extractLinkAttachment(text) : null;
  const bodyText = linkAttachment?.body ?? text;
  const time = formatDoctorMessageBubbleTime(message.createdAt);
  const textStyle = getMessageTextStyle(bodyText);

  const bubbleRadius = {
    borderTopLeftRadius: isMine ? (isFirstInGroup ? 18 : 18) : isFirstInGroup ? 18 : 14,
    borderTopRightRadius: isMine ? (isFirstInGroup ? 18 : 14) : 18,
    borderBottomLeftRadius: isMine ? (isLastInGroup ? 4 : 14) : isLastInGroup ? 4 : 14,
    borderBottomRightRadius: isMine ? (isLastInGroup ? 4 : 14) : isLastInGroup ? 4 : 14,
  };

  if (announcement) {
    return (
      <View style={[styles.announcementWrap, { marginTop: isNewGroup ? 12 : 0, marginBottom: 10 }]}>
        <View style={[styles.announcement, { padding: layout.space("md"), borderRadius: 16 }]}>
          <View style={styles.announcementHead}>
            <Megaphone size={14} color={colors.primary} strokeWidth={2.2} />
            <Text style={[styles.announcementLabel, { fontSize: layout.fontSize.footer - 1, color: colors.primary }]}>
              Announcement · {senderName}
            </Text>
            <Text style={[styles.announcementTime, { fontSize: layout.fontSize.footer - 2 }]}>{time}</Text>
          </View>
          <Text
            style={[
              styles.announcementBody,
              { fontSize: layout.fontSize.body, marginTop: 8, lineHeight: layout.scale(22) },
              getMessageTextStyle(text),
            ]}
          >
            {text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        isMine ? styles.wrapMine : styles.wrapOther,
        {
          marginTop: isNewGroup ? 10 : 0,
          marginBottom: isLastInGroup ? 0 : 3,
        },
      ]}
    >
      {showSenderLabel ? (
        <Text
          style={[
            styles.senderLabel,
            {
              fontSize: layout.fontSize.footer - 1,
              marginBottom: 4,
              marginLeft: 4,
            },
          ]}
          numberOfLines={1}
        >
          {senderName}
        </Text>
      ) : null}

      <View
        style={[
          styles.bubble,
          bubbleRadius,
          {
            paddingHorizontal: 14,
            paddingVertical: 10,
            maxWidth: "78%",
          },
          isMine ? styles.bubbleMine : styles.bubbleOther,
        ]}
      >
        <Text
          style={[
            styles.body,
            { fontSize: layout.fontSize.body, lineHeight: layout.scale(22) },
            isMine && styles.bodyMine,
            textStyle,
          ]}
        >
          {bodyText}
        </Text>

        {linkAttachment ? (
          <Pressable
            onPress={() => void Linking.openURL(linkAttachment.url)}
            style={[styles.linkCard, isMine && styles.linkCardMine]}
          >
            <Ionicons name="link-outline" size={15} color={isMine ? "#FFFFFF" : colors.primary} />
            <Text
              style={[styles.linkUrl, isMine && styles.linkUrlMine, { fontSize: layout.fontSize.footer - 2 }]}
              numberOfLines={1}
            >
              {linkAttachment.url}
            </Text>
          </Pressable>
        ) : null}

        {isLastInGroup ? (
          <Text
            style={[
              styles.time,
              { fontSize: 10, marginTop: 4 },
              isMine ? styles.timeMine : { color: colors.muted },
            ]}
          >
            {time}
            {message.edited ? " · Edited" : ""}
          </Text>
        ) : null}
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
    senderLabel: {
      color: colors.muted,
      fontWeight: "700",
    },
    bubble: {
      minWidth: 48,
    },
    bubbleMine: {
      backgroundColor: colors.primary,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.18,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    bubbleOther: {
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.8,
          shadowRadius: 2,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    body: {
      color: colors.foreground,
    },
    bodyMine: {
      color: "#FFFFFF",
    },
    time: {
      alignSelf: "flex-end",
      fontWeight: "500",
    },
    timeMine: {
      color: "rgba(255,255,255,0.68)",
    },
    removedWrap: {
      width: "100%",
      alignItems: "center",
    },
    removed: {
      color: colors.muted,
      fontStyle: "italic",
    },
    announcementWrap: {
      width: "100%",
    },
    announcement: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    announcementHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    announcementLabel: {
      fontWeight: "700",
      flex: 1,
    },
    announcementTime: {
      color: colors.muted,
      fontWeight: "600",
    },
    announcementBody: {
      color: colors.foreground,
    },
    linkCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
    },
    linkCardMine: {
      backgroundColor: "rgba(255,255,255,0.14)",
    },
    linkUrl: {
      flex: 1,
      color: colors.primary,
      fontWeight: "600",
    },
    linkUrlMine: {
      color: "rgba(255,255,255,0.92)",
    },
  });
}
