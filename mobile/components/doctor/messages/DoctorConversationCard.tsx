import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ConversationListItem } from "@/api/conversationsApi";
import {
  DOCTOR_RADIUS,
  DOCTOR_SPACE,
  doctorCardShadow,
} from "@/components/doctor/ui/doctorDesignSystem";
import { MessageConversationAvatar } from "@/components/messages/MessageConversationAvatar";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDoctorHubRelativeTime } from "@/lib/doctorHubMappers";
import {
  getDoctorConversationDisplayName,
  getDoctorConversationKind,
  getDoctorConversationPreview,
  getDoctorConversationRoleLabel,
} from "@/lib/doctorMessagesNavigation";

type Props = {
  item: ConversationListItem;
  currentUserId: number | null;
  onPress: () => void;
};

export function DoctorConversationCard({ item, currentUserId, onPress }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const name = getDoctorConversationDisplayName(item, currentUserId);
  const preview = getDoctorConversationPreview(item);
  const time = item.lastMessage?.createdAt ? formatDoctorHubRelativeTime(item.lastMessage.createdAt) : "";
  const unread = item.unseenCount > 0;
  const kind = getDoctorConversationKind(item);
  const roleLabel = getDoctorConversationRoleLabel(item);
  const avatarSize = layout.scale(48);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        unread && styles.cardUnread,
        {
          padding: DOCTOR_SPACE.md,
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        },
      ]}
      accessibilityRole="button"
    >
      {kind === "team" ? (
        <View style={[styles.teamAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
          <Ionicons name="people" size={layout.scale(20)} color={colors.primary} />
        </View>
      ) : (
        <MessageConversationAvatar name={name} size={avatarSize} />
      )}

      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={[styles.name, unread && styles.nameUnread, { fontSize: layout.fontSize.body }]} numberOfLines={1}>
            {name}
          </Text>
          {time ? (
            <Text style={[styles.time, { fontSize: layout.fontSize.footer - 1 }, unread && styles.timeUnread]}>
              {time}
            </Text>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.rolePill, kind === "student" ? styles.roleStudent : styles.roleTeam]}>
            <Text style={[styles.roleText, { fontSize: 11, color: kind === "student" ? colors.student : colors.primary }]}>
              {roleLabel}
            </Text>
          </View>
          {unread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unseenCount > 99 ? "99+" : item.unseenCount}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.preview, unread && styles.previewUnread, { fontSize: layout.fontSize.footer }]} numberOfLines={2}>
          {preview}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: DOCTOR_SPACE.md,
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...doctorCardShadow(colors),
    },
    cardUnread: {
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primarySoft,
    },
    teamAvatar: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primaryBorder,
      flexShrink: 0,
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: 5,
    },
    topLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    name: {
      flex: 1,
      fontWeight: "700",
      color: colors.foreground,
      letterSpacing: -0.2,
    },
    nameUnread: {
      fontWeight: "800",
    },
    time: {
      color: colors.muted,
      fontWeight: "600",
      flexShrink: 0,
    },
    timeUnread: {
      color: colors.primary,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    rolePill: {
      borderRadius: DOCTOR_RADIUS.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: StyleSheet.hairlineWidth,
    },
    roleStudent: {
      backgroundColor: colors.roleBg.student,
      borderColor: colors.border,
    },
    roleTeam: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primaryBorder,
    },
    roleText: {
      fontWeight: "700",
    },
    preview: {
      color: colors.muted,
      lineHeight: 18,
    },
    previewUnread: {
      color: colors.foreground,
      fontWeight: "600",
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
    },
  });
}
