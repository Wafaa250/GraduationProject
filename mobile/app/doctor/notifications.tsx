import { router, useFocusEffect, type Href } from "expo-router";
import { BellOff } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getAllNotifications,
  getAllNotificationsUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type GraduationNotification,
} from "@/api/notificationsApi";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { NotificationsListSkeleton } from "@/components/notifications/NotificationsListSkeleton";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  getDoctorNotificationTarget,
  getDoctorNotificationTargetLabel,
} from "@/lib/doctorNotificationNavigation";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

type SectionItem =
  | { type: "header"; id: string; title: string }
  | { type: "notification"; id: string; notification: GraduationNotification };

function buildSectionItems(notifications: GraduationNotification[]): SectionItem[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const today: GraduationNotification[] = [];
  const earlier: GraduationNotification[] = [];

  for (const n of notifications) {
    if (new Date(n.createdAt) >= startOfToday) today.push(n);
    else earlier.push(n);
  }

  const items: SectionItem[] = [];
  if (today.length > 0) {
    items.push({ type: "header", id: "header-today", title: "Today" });
    today.forEach((n) => items.push({ type: "notification", id: `n-${n.id}`, notification: n }));
  }
  if (earlier.length > 0) {
    items.push({ type: "header", id: "header-earlier", title: "Earlier" });
    earlier.forEach((n) => items.push({ type: "notification", id: `n-${n.id}`, notification: n }));
  }
  return items;
}

export default function DoctorNotificationsScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [items, setItems] = useState<GraduationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const sectionItems = useMemo(() => buildSectionItems(items), [items]);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rows, count] = await Promise.all([
        getAllNotifications(50),
        getAllNotificationsUnreadCount(),
      ]);
      setItems(rows);
      setUnreadCount(count);
    } catch (err) {
      if (!silent) {
        Alert.alert("Could not load notifications", parseApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh(true);
    }, [refresh]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refresh(true);
  }, [refresh]);

  const handleMarkAll = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
      setUnreadCount(0);
    } catch (err) {
      Alert.alert("Could not mark all read", parseApiErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const handlePress = async (notification: GraduationNotification) => {
    if (!notification.readAt) {
      try {
        await markNotificationRead(notification.id);
        const now = new Date().toISOString();
        setItems((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, readAt: now } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* non-blocking */
      }
    }

    const target = getDoctorNotificationTarget(notification);
    if (target) router.push(target as Href);
  };

  const renderItem = ({ item }: { item: SectionItem }) => {
    if (item.type === "header") {
      return (
        <Text
          style={[
            styles.sectionHeader,
            {
              fontSize: layout.fontSize.footer,
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: layout.space("md"),
              paddingBottom: layout.space("xs"),
            },
          ]}
        >
          {item.title}
        </Text>
      );
    }

    return (
      <View style={{ paddingHorizontal: layout.horizontalPadding }}>
        <NotificationRow
          notification={item.notification}
          actionLabel={getDoctorNotificationTargetLabel(item.notification)}
          onPress={() => void handlePress(item.notification)}
        />
      </View>
    );
  };

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader
        title="Notifications"
        subtitle="Supervision requests, project updates, and messages."
        fallbackHref={DOCTOR_ROUTES.dashboard}
        rightSlot={
          unreadCount > 0 ? (
            <Pressable
              onPress={() => void handleMarkAll()}
              disabled={markingAll}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              {markingAll ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.markAll, { fontSize: layout.fontSize.footer, color: colors.primary }]}>
                  Mark all read
                </Text>
              )}
            </Pressable>
          ) : undefined
        }
      />

      {unreadCount > 0 ? (
        <View
          style={[
            styles.unreadBanner,
            {
              marginHorizontal: layout.horizontalPadding,
              marginTop: layout.space("sm"),
              paddingHorizontal: layout.space("md"),
              paddingVertical: layout.space("sm"),
              borderRadius: layout.radius.input,
            },
          ]}
        >
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.unreadBannerText, { fontSize: layout.fontSize.footer }]}>
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </Text>
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View
          style={{
            marginTop: layout.space("sm"),
            marginHorizontal: layout.horizontalPadding,
            borderRadius: layout.radius.input,
            overflow: "hidden",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            backgroundColor: colors.cardBg,
          }}
        >
          <NotificationsListSkeleton count={7} />
        </View>
      ) : items.length === 0 ? (
        <View style={[styles.emptyWrap, { paddingHorizontal: layout.horizontalPadding }]}>
          <View
            style={[
              styles.emptyIcon,
              {
                width: layout.scale(64),
                height: layout.scale(64),
                borderRadius: layout.scale(32),
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <BellOff size={layout.scale(28)} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.emptyTitle, { fontSize: layout.fontSize.title - 4, marginTop: layout.space("md") }]}>
            You&apos;re all caught up
          </Text>
          <Text style={[styles.emptyBody, { fontSize: layout.fontSize.body, marginTop: layout.space("xs") }]}>
            Supervision requests, project updates, and messages will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sectionItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={{ flex: 1, marginTop: DOCTOR_SPACE.sm }}
          contentContainerStyle={{
            paddingBottom: layout.space("xxl"),
            gap: DOCTOR_SPACE.sm,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </DoctorScreen>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    markAll: {
      fontWeight: "800",
    },
    unreadBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
      backgroundColor: colors.primarySoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primaryBorder,
      borderRadius: DOCTOR_RADIUS.md,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    unreadBannerText: {
      color: colors.primary,
      fontWeight: "700",
    },
    sectionHeader: {
      color: colors.muted,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 48,
    },
    emptyIcon: {
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
      letterSpacing: -0.3,
    },
    emptyBody: {
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
      maxWidth: 280,
      fontWeight: "500",
    },
  });
}
