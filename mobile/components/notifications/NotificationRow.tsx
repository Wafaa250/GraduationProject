import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { GraduationNotification } from "@/api/notificationsApi";
import {
  DOCTOR_RADIUS,
  DOCTOR_SPACE,
  doctorCardShadow,
} from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDoctorHubRelativeTime } from "@/lib/doctorHubMappers";
import { getNotificationVisual } from "@/lib/notificationPresentation";

type Props = {
  notification: GraduationNotification;
  actionLabel?: string | null;
  onPress: () => void;
};

export function NotificationRow({ notification, actionLabel, onPress }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);
  const unread = !notification.readAt;
  const visual = getNotificationVisual(notification);
  const Icon = visual.icon;
  const iconSize = layout.scale(44);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        unread && styles.rowUnread,
        {
          padding: DOCTOR_SPACE.md,
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: unread }}
    >
      {unread ? <View style={[styles.unreadBar, { backgroundColor: colors.primary }]} /> : null}

      <View
        style={[
          styles.iconWrap,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: DOCTOR_RADIUS.md,
            backgroundColor: visual.backgroundColor,
          },
        ]}
      >
        <Icon size={layout.scale(20)} color={visual.accentColor} strokeWidth={2.2} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                fontSize: layout.fontSize.body,
                color: colors.foreground,
                fontWeight: unread ? "800" : "600",
              },
            ]}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <Text style={[styles.time, { fontSize: layout.fontSize.footer }]} numberOfLines={1}>
            {formatDoctorHubRelativeTime(notification.createdAt)}
          </Text>
        </View>

        {notification.body?.trim() ? (
          <Text
            style={[
              styles.body,
              {
                fontSize: layout.fontSize.footer + 1,
                marginTop: layout.space("xs"),
                color: unread ? colors.foreground : colors.muted,
                fontWeight: unread ? "500" : "400",
              },
            ]}
            numberOfLines={3}
          >
            {notification.body}
          </Text>
        ) : null}

        {actionLabel ? (
          <View style={[styles.actionRow, { marginTop: layout.space("sm") }]}>
            <Text style={[styles.actionText, { fontSize: layout.fontSize.footer, color: colors.primary }]}>
              {actionLabel}
            </Text>
            <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: DOCTOR_SPACE.md,
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      position: "relative",
      overflow: "hidden",
      ...doctorCardShadow(colors),
    },
    rowUnread: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primaryBorder,
    },
    unreadBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    title: {
      flex: 1,
      lineHeight: 20,
      letterSpacing: -0.2,
    },
    time: {
      color: colors.muted,
      fontWeight: "600",
      flexShrink: 0,
      maxWidth: "38%",
      textAlign: "right",
    },
    body: {
      lineHeight: 19,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      alignSelf: "flex-start",
    },
    actionText: {
      fontWeight: "700",
    },
  });
}
