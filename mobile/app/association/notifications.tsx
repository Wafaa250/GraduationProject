import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { ASSOCIATION_ROUTES } from "@/lib/associationRoutes";
import {
  getAssociationNotificationTargetLabel,
  resolveAssociationNotificationTarget,
} from "@/lib/associationNotificationNavigation";

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

export default function AssociationNotificationsScreen() {
  const layout = useResponsiveLayout();
  const styles = useMemo(() => createStyles(), []);
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

    const target = await resolveAssociationNotificationTarget(notification);
    if (target) router.push(target as Href);
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
    <AssociationWorkspaceScreen
      showBack
      fallbackHref={ASSOCIATION_ROUTES.dashboard}
      navTitle="Notifications"
      refreshing={loading}
      onRefresh={() => void load()}
    >
      <View style={{ width: "100%", gap: layout.space("md") }}>
        <Text style={[styles.pageTitle, { fontSize: layout.fontSize.title }]}>Notifications</Text>
        <Text style={[styles.pageSubtitle, { fontSize: layout.fontSize.body }]}>
          Updates from your organization, events, and messages.
        </Text>

        <Pressable
          onPress={() => void handleMarkAll()}
          disabled={markingAll || items.length === 0}
          style={[styles.markAllBtn, { borderRadius: layout.radius.input }]}
        >
          {markingAll ? (
            <ActivityIndicator size="small" color={ASSOC_COLORS.accent} />
          ) : (
            <Text style={styles.markAllText}>Mark all as read</Text>
          )}
        </Pressable>

        {loading ? (
          <ActivityIndicator color={ASSOC_COLORS.accent} style={{ marginTop: 24 }} />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>You&apos;re all caught up. New notifications will appear here.</Text>
        ) : (
          <View style={{ gap: layout.space("sm"), width: "100%" }}>
            {items.map((notification) => {
              const unread = !notification.readAt;
              const target = getAssociationNotificationTargetLabel(notification);
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
      </View>
    </AssociationWorkspaceScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    pageTitle: {
      fontWeight: "800",
      color: ASSOC_COLORS.foreground,
      letterSpacing: -0.3,
    },
    pageSubtitle: {
      color: ASSOC_COLORS.muted,
      lineHeight: 22,
    },
    markAllBtn: {
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 44,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: ASSOC_COLORS.accentBorder,
      backgroundColor: ASSOC_COLORS.accentMuted,
    },
    markAllText: {
      color: ASSOC_COLORS.accentDark,
      fontWeight: "700",
    },
    empty: {
      color: ASSOC_COLORS.muted,
      textAlign: "center",
      lineHeight: 22,
    },
    item: {
      width: "100%",
      backgroundColor: ASSOC_COLORS.cardBg,
      borderWidth: 1,
      borderColor: ASSOC_COLORS.border,
      gap: 6,
    },
    itemUnread: {
      borderColor: ASSOC_COLORS.accentBorder,
      backgroundColor: ASSOC_COLORS.accentSoft,
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    itemTitle: {
      flex: 1,
      fontWeight: "700",
      color: ASSOC_COLORS.foreground,
      fontSize: 15,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: ASSOC_COLORS.accent,
      marginTop: 6,
    },
    itemBody: {
      color: ASSOC_COLORS.muted,
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
      color: ASSOC_COLORS.muted,
      fontSize: 12,
    },
    itemAction: {
      color: ASSOC_COLORS.accentDark,
      fontWeight: "700",
      fontSize: 13,
    },
  });
}
