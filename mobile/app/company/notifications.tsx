import { router, useFocusEffect, type Href } from "expo-router";
import { Bell } from "lucide-react-native";
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
  getCompanyNotifications,
  getCompanyNotificationsUnreadCount,
  markCompanyNotificationRead,
  markCompanyNotificationsAllRead,
  type AppNotification,
} from "@/api/notificationsApi";
import { CompanyNotificationRow } from "@/components/company/notifications/CompanyNotificationRow";
import { CompanyNotificationsListSkeleton } from "@/components/company/notifications/CompanyNotificationsListSkeleton";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import {
  getCompanyNotificationTarget,
} from "@/lib/companyNotificationNavigation";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import {
  COMPANY_NOTIFICATIONS_EMPTY,
  COMPANY_NOTIFICATIONS_SUBTITLE,
} from "@/lib/companyWorkspaceCopy";

type SectionItem =
  | { type: "header"; id: string; title: string }
  | { type: "notification"; id: string; notification: AppNotification };

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildSectionItems(notifications: AppNotification[]): SectionItem[] {
  const todayStart = startOfDay(new Date());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const today: AppNotification[] = [];
  const yesterday: AppNotification[] = [];
  const earlier: AppNotification[] = [];

  for (const n of notifications) {
    const created = new Date(n.createdAt);
    if (created >= todayStart) today.push(n);
    else if (created >= yesterdayStart) yesterday.push(n);
    else earlier.push(n);
  }

  const items: SectionItem[] = [];
  const appendSection = (title: string, rows: AppNotification[]) => {
    if (rows.length === 0) return;
    items.push({ type: "header", id: `header-${title.toLowerCase()}`, title });
    rows.forEach((n) => items.push({ type: "notification", id: `n-${n.id}`, notification: n }));
  };

  appendSection("Today", today);
  appendSection("Yesterday", yesterday);
  appendSection("Earlier", earlier);
  return items;
}

export default function CompanyNotificationsScreen() {
  const colors = useCompanyTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sectionItems = useMemo(() => buildSectionItems(items), [items]);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rows, count] = await Promise.all([
        getCompanyNotifications(50),
        getCompanyNotificationsUnreadCount(),
      ]);
      setItems(rows);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      const message = parseApiErrorMessage(err);
      setError(message);
      if (!silent) {
        Alert.alert("Could not load notifications", message);
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
      await markCompanyNotificationsAllRead();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
      setUnreadCount(0);
    } catch (err) {
      Alert.alert("Could not mark all read", parseApiErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const handlePress = async (notification: AppNotification) => {
    if (!notification.readAt) {
      try {
        await markCompanyNotificationRead(notification.id);
        const now = new Date().toISOString();
        setItems((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, readAt: now } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* non-blocking */
      }
    }

    const target = getCompanyNotificationTarget(notification);
    if (target) router.push(target as Href);
  };

  const renderItem = ({ item, index }: { item: SectionItem; index: number }) => {
    if (item.type === "header") {
      const isFirst = index === 0;
      return (
        <Text
          style={{
            paddingHorizontal: HOME_SPACE.lg,
            paddingTop: isFirst ? HOME_SPACE.md : HOME_SPACE.xl,
            paddingBottom: HOME_SPACE.xs,
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: -0.1,
            color: colors.muted,
          }}
        >
          {item.title}
        </Text>
      );
    }

    const hasTarget = Boolean(getCompanyNotificationTarget(item.notification));

    return (
      <View style={{ paddingHorizontal: HOME_SPACE.lg, marginBottom: 8 }}>
        <CompanyNotificationRow
          notification={item.notification}
          showChevron={hasTarget}
          onPress={() => void handlePress(item.notification)}
        />
      </View>
    );
  };

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title="Notifications"
        subtitle={COMPANY_NOTIFICATIONS_SUBTITLE}
        fallbackHref={COMPANY_ROUTES.dashboard}
        right={
          unreadCount > 0 ? (
            <Pressable
              onPress={() => void handleMarkAll()}
              disabled={markingAll}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              {markingAll ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.accent }}>Mark all read</Text>
              )}
            </Pressable>
          ) : undefined
        }
      />

      {unreadCount > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 6,
            marginHorizontal: HOME_SPACE.lg,
            marginTop: HOME_SPACE.sm,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: COMPANY_RADIUS.pill,
            backgroundColor: colors.surfaceMuted,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.accent,
            }}
          />
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
            {unreadCount} unread
          </Text>
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <CompanyNotificationsListSkeleton count={7} />
      ) : error && items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: HOME_SPACE.xxxl }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.accentSoft,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: HOME_SPACE.lg,
            }}
          >
            <Bell size={28} color={colors.accent} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>
            Could not load notifications
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            {error}
          </Text>
          <Pressable
            onPress={() => void refresh()}
            style={({ pressed }) => ({
              marginTop: HOME_SPACE.lg,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: COMPANY_RADIUS.md,
              backgroundColor: colors.accent,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>Try again</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: HOME_SPACE.xxxl }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={32} color={colors.accent} strokeWidth={2} />
          </View>
          <Text
            style={{
              marginTop: HOME_SPACE.lg,
              fontSize: 20,
              fontWeight: "800",
              color: colors.foreground,
              textAlign: "center",
              letterSpacing: -0.3,
            }}
          >
            No notifications yet
          </Text>
          <Text
            style={{
              marginTop: HOME_SPACE.sm,
              fontSize: 15,
              lineHeight: 22,
              color: colors.muted,
              textAlign: "center",
              fontWeight: "500",
              maxWidth: 280,
            }}
          >
            {COMPANY_NOTIFICATIONS_EMPTY}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sectionItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={{ flex: 1, marginTop: HOME_SPACE.xs }}
          contentContainerStyle={{ paddingBottom: HOME_SPACE.xxxl, paddingTop: 2 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </CompanyScreen>
  );
}
