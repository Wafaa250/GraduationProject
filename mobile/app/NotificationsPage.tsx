import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  fetchMergedNotificationsForInbox,
  markAllNotificationsReadAllCategories,
  markGraduationNotificationRead,
  mergeNotificationRows,
  type GraduationNotificationDto,
} from "@/api/notificationsApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { subscribeInboxNotificationCreated } from "@/lib/notificationsHubInbox";
import { getItem } from "@/utils/authStorage";
import { getNotificationTargetHref } from "@/utils/notificationNavigation";

type Section = { title: string; key: string; data: GraduationNotificationDto[] };

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function categoryLabel(cat: string | undefined): string {
  const t = (cat ?? "").trim().toLowerCase();
  if (t === "graduation_project") return "Graduation";
  if (t === "course") return "Course";
  if (t === "chat") return "Chat";
  if (t === "invitations" || t === "invitation") return "Invitations";
  if (t === "system") return "System";
  if (t === "announcement" || t === "announcements") return "Announcements";
  if (!t) return "Notification";
  return t.replace(/_/g, " ");
}

function buildSections(items: GraduationNotificationDto[]): Section[] {
  const map = new Map<string, GraduationNotificationDto[]>();
  for (const it of items) {
    const d = new Date(it.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const arr = map.get(key) ?? [];
    arr.push(it);
    map.set(key, arr);
  }
  const keys = [...map.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return keys.map((key) => {
    const [y, m, day] = key.split("-").map(Number);
    const dt = new Date(y, m - 1, day);
    const title = dt.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const data = (map.get(key) ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return { title, key, data };
  });
}

export default function NotificationsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { horizontalPadding, maxDashboardWidth } = useResponsiveLayout();

  const [items, setItems] = useState<GraduationNotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pad = horizontalPadding;
  const colMax = maxDashboardWidth;

  const loadList = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchMergedNotificationsForInbox(50);
      setItems(rows);
    } catch (e) {
      setItems([]);
      setError(parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    const unsub = subscribeInboxNotificationCreated((payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const row = payload as GraduationNotificationDto;
      if (typeof row.id !== "number") return;
      setItems((prev) => mergeNotificationRows(prev, [row]));
    });
    return unsub;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadList();
    } finally {
      setRefreshing(false);
    }
  }, [loadList]);

  const handleBack = useCallback(async () => {
    if (router.canGoBack()) router.back();
    else {
      const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
      router.replace((role === "doctor" ? "/doctor-dashboard" : "/dashboard") as Href);
    }
  }, [router]);

  const unreadCount = useMemo(() => items.filter((n) => n.readAt == null).length, [items]);

  const sections = useMemo(() => buildSections(items), [items]);

  const onMarkAllRead = useCallback(async () => {
    if (unreadCount === 0 || markAllBusy) return;
    const nowIso = new Date().toISOString();
    setMarkAllBusy(true);
    setItems((prev) => prev.map((n) => (n.readAt == null ? { ...n, readAt: nowIso } : n)));
    try {
      await markAllNotificationsReadAllCategories();
      await loadList();
    } catch (e) {
      await loadList();
      setError(parseApiErrorMessage(e));
    } finally {
      setMarkAllBusy(false);
    }
  }, [loadList, markAllBusy, unreadCount]);

  const handleRowPress = useCallback(
    async (n: GraduationNotificationDto) => {
      const roleRaw = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
      const roleNorm = roleRaw === "doctor" ? "doctor" : "student";
      const href = getNotificationTargetHref(n, roleNorm);

      if (n.readAt == null) {
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
        );
        try {
          await markGraduationNotificationRead(n.id);
        } catch {
          await loadList();
        }
      }

      router.push(href);
    },
    [loadList, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: GraduationNotificationDto }) => {
      const unread = item.readAt == null;
      return (
        <Pressable
          onPress={() => void handleRowPress(item)}
          style={({ pressed }) => [styles.card, unread && styles.cardUnread, pressed && styles.cardPressed]}
        >
          <View style={styles.cardInner}>
            <View style={[styles.dot, unread ? styles.dotUnread : styles.dotRead]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.catPill}>{categoryLabel(item.category)}</Text>
                <Text style={styles.time}>{formatWhen(item.createdAt)}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              {item.body ? (
                <Text style={styles.body} numberOfLines={4}>
                  {item.body}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={styles.chevron} />
          </View>
        </Pressable>
      );
    },
    [handleRowPress],
  );

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.topBar, { paddingHorizontal: pad }]}>
        <Pressable onPress={() => void handleBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.topBarRight} />
      </View>

      <View style={[styles.subHeader, { paddingHorizontal: pad }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.pageTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <Text style={styles.pageSub}>{unreadCount} unread</Text>
          ) : (
            <Text style={styles.pageSubMuted}>All caught up</Text>
          )}
        </View>
        <Pressable
          onPress={() => void onMarkAllRead()}
          disabled={unreadCount === 0 || markAllBusy}
          style={[styles.markAllBtn, (unreadCount === 0 || markAllBusy) && styles.markAllBtnDisabled]}
        >
          {markAllBusy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.markAllBtnText}>Mark all read</Text>
          )}
        </Pressable>
      </View>

      <View style={{ flex: 1, maxWidth: colMax, width: "100%", alignSelf: "center" }}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.hint}>Loading notifications…</Text>
          </View>
        ) : error ? (
          <View style={[styles.center, { paddingHorizontal: pad }]}>
            <Text style={styles.err}>{error}</Text>
            <Pressable onPress={() => void loadList()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(n) => String(n.id)}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled
            contentContainerStyle={{
              paddingHorizontal: pad,
              paddingTop: spacing.sm,
              paddingBottom: Math.max(insets.bottom + spacing.xl, spacing.xxl),
              flexGrow: 1,
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={40} color="#94a3b8" />
                <Text style={styles.emptyTitle}>You're all caught up</Text>
                <Text style={styles.emptySub}>No notifications yet.</Text>
              </View>
            }
            SectionSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f1f5f9" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(99,102,241,0.12)",
    backgroundColor: "rgba(248,247,255,0.98)",
  },
  topBarRight: { minWidth: 8 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 15, fontWeight: "700", color: "#64748b" },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  pageTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  pageSub: { fontSize: 13, fontWeight: "700", color: "#6366f1", marginTop: 2 },
  pageSubMuted: { fontSize: 13, color: "#94a3b8", marginTop: 2, fontWeight: "600" },
  markAllBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "#6366f1",
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  markAllBtnDisabled: { opacity: 0.45 },
  markAllBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  hint: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
  err: { fontSize: 14, color: "#b91c1c", fontWeight: "600", textAlign: "center" },
  retryBtn: {
    marginTop: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: "#6366f1",
  },
  retryText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingTop: spacing.md,
    backgroundColor: "#f1f5f9",
  },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  card: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnread: { borderColor: "#c7d2fe", backgroundColor: "#fafbff" },
  cardPressed: { opacity: 0.94 },
  cardInner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  dotUnread: { backgroundColor: "#6366f1" },
  dotRead: { backgroundColor: "#e2e8f0" },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: 4 },
  catPill: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  time: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  title: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  body: { fontSize: 13, color: "#64748b", lineHeight: 19 },
  chevron: { marginTop: 4 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#475569" },
  emptySub: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
});
