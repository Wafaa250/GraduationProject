import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import type { ConversationListItem } from "@/api/conversationsApi";
import { MessageConversationAvatar } from "@/components/messages/MessageConversationAvatar";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  formatStudentMessageTime,
  getStudentConversationDisplayName,
  getStudentConversationPreview,
} from "@/lib/studentMessagesNavigation";

type Props = {
  item: ConversationListItem;
  currentUserId: number | null;
  pinned: boolean;
  muted: boolean;
  onPress: () => void;
  onTogglePin: () => void;
  onToggleMute: () => void;
};

export function ConversationCard({
  item,
  currentUserId,
  pinned,
  muted,
  onPress,
  onTogglePin,
  onToggleMute,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const swipeRef = useRef<Swipeable>(null);

  const name = getStudentConversationDisplayName(item, currentUserId);
  const preview = getStudentConversationPreview(item);
  const time = formatStudentMessageTime(item.lastMessage?.createdAt);
  const unread = item.unseenCount > 0;
  const isTeam = item.courseTeamId != null || item.type === "Team";
  const avatarSize = layout.scale(52);

  const renderLeftActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const translateX = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [-80, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.actionWrap, styles.pinAction, { transform: [{ translateX }] }]}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => {
            swipeRef.current?.close();
            onTogglePin();
          }}
          accessibilityRole="button"
          accessibilityLabel={pinned ? "Unpin conversation" : "Pin conversation"}
        >
          <Ionicons name={pinned ? "pin" : "pin-outline"} size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>{pinned ? "Unpin" : "Pin"}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.actionWrap, styles.muteAction, { transform: [{ translateX }] }]}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => {
            swipeRef.current?.close();
            onToggleMute();
          }}
          accessibilityRole="button"
          accessibilityLabel={muted ? "Unmute conversation" : "Mute conversation"}
        >
          <Ionicons
            name={muted ? "notifications" : "notifications-off-outline"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.actionText}>{muted ? "Unmute" : "Mute"}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          {
            marginHorizontal: layout.horizontalPadding,
            borderRadius: layout.radius.input,
            padding: layout.space("md"),
            marginBottom: layout.space("sm"),
          },
          unread && styles.cardUnread,
        ]}
        accessibilityRole="button"
      >
        {isTeam ? (
          <View
            style={[
              styles.teamAvatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <Ionicons name="people" size={layout.scale(24)} color={colors.primary} />
          </View>
        ) : (
          <MessageConversationAvatar name={name} size={avatarSize} />
        )}

        <View style={styles.content}>
          <View style={styles.topLine}>
            <View style={styles.nameRow}>
              {pinned ? (
                <Ionicons name="pin" size={14} color={colors.primary} style={styles.pinIcon} />
              ) : null}
              <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>
                {name}
              </Text>
            </View>
            {time ? <Text style={styles.time}>{time}</Text> : null}
          </View>

          <View style={styles.previewRow}>
            <Text
              style={[styles.preview, unread && styles.previewUnread, muted && styles.previewMuted]}
              numberOfLines={2}
            >
              {preview}
            </Text>
            {unread ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unseenCount > 9 ? "9+" : item.unseenCount}</Text>
              </View>
            ) : muted ? (
              <Ionicons name="notifications-off-outline" size={16} color={colors.muted} />
            ) : null}
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 3,
    },
    cardUnread: {
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primarySoft,
    },
    teamAvatar: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    topLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    nameRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
    },
    pinIcon: {
      marginRight: 4,
    },
    name: {
      flex: 1,
      fontWeight: "700",
      fontSize: 16,
      color: colors.foreground,
    },
    nameUnread: {
      fontWeight: "800",
    },
    time: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    preview: {
      flex: 1,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
    },
    previewUnread: {
      color: colors.foreground,
      fontWeight: "600",
    },
    previewMuted: {
      opacity: 0.72,
    },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      marginTop: 1,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
    },
    actionWrap: {
      justifyContent: "center",
      width: 88,
      marginBottom: 8,
    },
    pinAction: {
      backgroundColor: colors.primary,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      marginLeft: 16,
    },
    muteAction: {
      backgroundColor: colors.muted,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      marginRight: 16,
      alignItems: "flex-end",
    },
    actionBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingHorizontal: 8,
    },
    actionText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
  });
