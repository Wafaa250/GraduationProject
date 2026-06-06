import { router } from "expo-router";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getAllNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type GraduationNotification,
} from "@/api/notificationsApi";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getStudentNotificationTarget } from "@/lib/studentNotificationNavigation";

function formatNotificationTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function NotificationsScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GraduationNotification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllNotifications();
      setItems(data);
      await markAllNotificationsRead().catch(() => undefined);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    } catch (err) {
      Alert.alert("Could not load notifications", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePress = async (notification: GraduationNotification) => {
    if (!notification.readAt) {
      try {
        await markNotificationRead(notification.id);
        setItems((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n,
          ),
        );
      } catch {
        /* non-blocking */
      }
    }

    const target = getStudentNotificationTarget(notification);
    if (target) router.push(target as never);
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    } catch (err) {
      Alert.alert("Could not mark all read", parseApiErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <StudentWorkspaceScreen
      title="Notifications"
      subtitle="Updates from your projects, courses, and messages."
      refreshing={loading}
      onRefresh={() => void load()}
    >
      <Pressable
        onPress={() => void handleMarkAll()}
        disabled={markingAll || items.length === 0}
        style={[styles.markAllBtn, { borderRadius: layout.radius.input }]}
      >
        {markingAll ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.markAllText}>Mark all as read</Text>
        )}
      </Pressable>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>You&apos;re all caught up. New notifications will appear here.</Text>
      ) : (
        <View style={{ gap: layout.space("sm"), width: "100%" }}>
          {items.map((notification) => {
            const unread = !notification.readAt;
            const target = getStudentNotificationTarget(notification);
            return (
              <Pressable
                key={notification.id}
                onPress={() => void handlePress(notification)}
                style={[
                  styles.item,
                  unread && styles.itemUnread,
                  { borderRadius: layout.radius.input, padding: layout.space("md") },
                ]}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {notification.title}
                  </Text>
                  {unread ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.itemBody} numberOfLines={3}>
                  {notification.body}
                </Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemTime}>{formatNotificationTime(notification.createdAt)}</Text>
                  {target ? <Text style={styles.itemAction}>View</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </StudentWorkspaceScreen>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  markAllBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  markAllText: {
    color: colors.primary,
    fontWeight: "700",
  },
  empty: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  item: {
    width: "100%",
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  itemUnread: {
    borderColor: colors.primaryBorder,
    backgroundColor: "rgba(99, 102, 241, 0.06)",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontWeight: "700",
    color: colors.foreground,
    fontSize: 15,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  itemBody: {
    color: colors.muted,
    lineHeight: 20,
    fontSize: 14,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  itemTime: {
    color: colors.muted,
    fontSize: 12,
  },
  itemAction: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
