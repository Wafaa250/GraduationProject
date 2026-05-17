import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { loadCommunityFeed, type CommunityFeedPayload } from "@/api/communitiesFeedApi";
import {
  followOrganization,
  getFollowingOrganizations,
  listPublicOrganizationsForDiscovery,
  parseApiErrorMessage,
  unfollowOrganization,
  type PublicOrganizationDiscovery,
} from "@/api/organizationsApi";
import { OrganizationDiscoveryCard } from "@/components/organization/OrganizationDiscoveryCard";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getItem } from "@/utils/authStorage";

const emptyFeed: CommunityFeedPayload = { events: [], recruitment: [], activity: [] };

function FeedSection({
  title,
  hint,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionHint}>{hint}</Text>
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction}>
            <Text style={styles.sectionLink}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function EmptyBlock({ icon, title, message }: { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  return (
    <View style={styles.emptyBlock}>
      <Ionicons name={icon} size={28} color={assocColors.accent} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

export default function CommunitiesHubScreen() {
  const layout = useResponsiveLayout();
  const [isStudent, setIsStudent] = useState(false);
  const [organizations, setOrganizations] = useState<PublicOrganizationDiscovery[]>([]);
  const [following, setFollowing] = useState<PublicOrganizationDiscovery[]>([]);
  const [feedData, setFeedData] = useState<CommunityFeedPayload>(emptyFeed);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followBusyId, setFollowBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const reloadFeed = useCallback(
    async (orgList: PublicOrganizationDiscovery[], followList: PublicOrganizationDiscovery[]) => {
      setFeedLoading(true);
      try {
        const payload = await loadCommunityFeed(orgList, followList);
        setFeedData(payload);
      } catch {
        setFeedData(emptyFeed);
      } finally {
        setFeedLoading(false);
      }
    },
    [],
  );

  const loadAll = useCallback(async () => {
    try {
      const role = ((await getItem("role")) ?? "").toLowerCase();
      const student = role === "student";
      setIsStudent(student);
      const [all, followed] = await Promise.all([
        listPublicOrganizationsForDiscovery(),
        student ? getFollowingOrganizations() : Promise.resolve([]),
      ]);
      const orgList = Array.isArray(all) ? all : [];
      const followList = Array.isArray(followed) ? followed : [];
      setOrganizations(orgList);
      setFollowing(followList);
      await reloadFeed(orgList, followList);
    } catch {
      setOrganizations([]);
      setFollowing([]);
      setFeedData(emptyFeed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reloadFeed]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    organizations.forEach((o) => {
      if (o.category?.trim()) set.add(o.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [organizations]);

  const suggested = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...organizations]
      .filter((org) => {
        if (categoryFilter && (org.category ?? "") !== categoryFilter) return false;
        if (!q) return true;
        const name = (org.organizationName ?? "").toLowerCase();
        return (
          name.includes(q) ||
          (org.username ?? "").toLowerCase().includes(q) ||
          (org.shortDescription ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0));
  }, [organizations, search, categoryFilter]);

  const patchOrg = (id: number, isFollowing: boolean, delta: number) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, isFollowing, followersCount: Math.max(0, (o.followersCount ?? 0) + delta) }
          : o,
      ),
    );
    setFollowing((prev) => {
      const org = organizations.find((o) => o.id === id);
      if (!org) return prev;
      const updated = {
        ...org,
        isFollowing,
        followersCount: Math.max(0, (org.followersCount ?? 0) + delta),
      };
      if (isFollowing) {
        if (prev.some((p) => p.id === id)) return prev.map((p) => (p.id === id ? updated : p));
        return [...prev, updated];
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleFollow = async (org: PublicOrganizationDiscovery) => {
    if (!isStudent || followBusyId != null) return;
    setFollowBusyId(org.id);
    try {
      if (org.isFollowing) {
        await unfollowOrganization(org.id);
        patchOrg(org.id, false, -1);
      } else {
        await followOrganization(org.id);
        patchOrg(org.id, true, 1);
      }
      const nextFollowing = org.isFollowing
        ? following.filter((f) => f.id !== org.id)
        : [...following, { ...org, isFollowing: true, followersCount: (org.followersCount ?? 0) + 1 }];
      const nextOrgs = organizations.map((o) =>
        o.id === org.id
          ? {
              ...o,
              isFollowing: !org.isFollowing,
              followersCount: Math.max(0, (o.followersCount ?? 0) + (org.isFollowing ? -1 : 1)),
            }
          : o,
      );
      await reloadFeed(nextOrgs, nextFollowing);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setFollowBusyId(null);
    }
  };

  const contentWidth = layout.isTablet ? 720 : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Communities" subtitle="Campus discovery feed" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, contentWidth ? { alignSelf: "center", width: contentWidth } : null]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadAll();
            }}
          />
        }
      >
        <Text style={styles.pageTitle}>Communities</Text>
        <Text style={styles.pageSub}>
          Discover organizations, events, recruitment, and updates from communities you follow.
        </Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={assocColors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search organizations…"
            placeholderTextColor={assocColors.muted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Pressable
            style={[styles.chip, !categoryFilter && styles.chipActive]}
            onPress={() => setCategoryFilter("")}
          >
            <Text style={[styles.chipText, !categoryFilter && styles.chipTextActive]}>All</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, categoryFilter === c && styles.chipActive]}
              onPress={() => setCategoryFilter(categoryFilter === c ? "" : c)}
            >
              <Text style={[styles.chipText, categoryFilter === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <FeedSection
          title="Suggested communities"
          hint="From the public organizations directory"
          actionLabel="Explore all"
          onAction={() => router.push("/organizations" as Href)}
        >
          {loading ? (
            <ActivityIndicator color={assocColors.accent} />
          ) : suggested.length === 0 ? (
            <EmptyBlock icon="business-outline" title="No organizations" message="Nothing matches your filters yet." />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {suggested.map((org) => (
                <View key={org.id} style={styles.hCard}>
                  <OrganizationDiscoveryCard
                    org={org}
                    isStudent={isStudent}
                    followBusy={followBusyId === org.id}
                    onToggleFollow={() => void handleFollow(org)}
                    onOpen={() => router.push(`/public-organizations/${org.id}` as Href)}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </FeedSection>

        <FeedSection title="Upcoming events" hint="Published by student organizations">
          {feedLoading ? (
            <ActivityIndicator color={assocColors.accent} />
          ) : feedData.events.length === 0 ? (
            <EmptyBlock
              icon="calendar-outline"
              title="No upcoming events"
              message="Organizations have not published upcoming events yet."
            />
          ) : (
            feedData.events.map((event) => (
              <Pressable
                key={`${event.organizationId}-${event.id}`}
                style={styles.listCard}
                onPress={() =>
                  router.push(
                    `/public-organizations/${event.organizationId}/events/${event.id}` as Href,
                  )
                }
              >
                <Text style={styles.listMeta}>{event.organizationName}</Text>
                <Text style={styles.listTitle}>{event.title}</Text>
                <Text style={styles.muted}>
                  {new Date(event.eventDate).toLocaleString()} ·{" "}
                  {event.registrationStatus === "open"
                    ? "Registration open"
                    : event.registrationStatus === "closed"
                      ? "Registration closed"
                      : "View details"}
                </Text>
              </Pressable>
            ))
          )}
        </FeedSection>

        <FeedSection title="Recruitment opportunities" hint="Open published campaigns">
          {feedLoading ? (
            <ActivityIndicator color={assocColors.accent} />
          ) : feedData.recruitment.length === 0 ? (
            <EmptyBlock
              icon="megaphone-outline"
              title="No open recruitment"
              message="No published campaigns with open deadlines right now."
            />
          ) : (
            feedData.recruitment.map((item) => (
              <Pressable
                key={`${item.organizationId}-${item.id}`}
                style={styles.listCard}
                onPress={() =>
                  router.push(
                    `/public-organizations/${item.organizationId}/recruitment-campaigns/${item.id}` as Href,
                  )
                }
              >
                <Text style={styles.listMeta}>{item.organizationName}</Text>
                <Text style={styles.listTitle}>{item.roleTitle}</Text>
                <Text style={styles.muted}>
                  Apply by {new Date(item.applicationDeadline).toLocaleDateString()}
                </Text>
              </Pressable>
            ))
          )}
        </FeedSection>

        {isStudent ? (
          <FeedSection
            title="Following activity"
            hint="Events and recruitment from orgs you follow"
            actionLabel={following.length > 0 ? "Manage" : "Discover"}
            onAction={() =>
              router.push((following.length > 0 ? "/following" : "/organizations") as Href)
            }
          >
            {feedLoading && following.length > 0 ? (
              <ActivityIndicator color={assocColors.accent} />
            ) : following.length === 0 ? (
              <EmptyBlock
                icon="people-outline"
                title="Nothing in your feed"
                message="Follow organizations to see their updates here."
              />
            ) : feedData.activity.length === 0 ? (
              <EmptyBlock
                icon="radio-outline"
                title="No recent activity"
                message="No new events or recruitment from organizations you follow."
              />
            ) : (
              feedData.activity.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.listCard}
                  onPress={() => router.push(item.href as Href)}
                >
                  <Text style={styles.listMeta}>
                    {item.organizationName} · {item.detail}
                  </Text>
                  <Text style={styles.listTitle}>{item.title}</Text>
                </Pressable>
              ))
            )}
          </FeedSection>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  pageTitle: { fontSize: 28, fontWeight: "800", color: assocColors.text },
  pageSub: { marginTop: spacing.sm, fontSize: 14, lineHeight: 20, color: assocColors.muted, marginBottom: spacing.lg },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 14, color: assocColors.text, padding: 0 },
  chipRow: { gap: spacing.sm, marginBottom: spacing.xl, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
  },
  chipActive: { borderColor: assocColors.accentBorder, backgroundColor: assocColors.accentMuted },
  chipText: { fontSize: 12, fontWeight: "600", color: assocColors.muted },
  chipTextActive: { color: assocColors.accentDark },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md, gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: assocColors.text },
  sectionHint: { marginTop: 2, fontSize: 12, color: assocColors.muted },
  sectionLink: { fontSize: 13, fontWeight: "600", color: assocColors.accentDark },
  hRow: { gap: spacing.md, paddingRight: spacing.lg },
  hCard: { width: 280 },
  listCard: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
  },
  listMeta: { fontSize: 11, fontWeight: "600", color: assocColors.muted, marginBottom: 4 },
  listTitle: { fontSize: 15, fontWeight: "700", color: assocColors.text },
  emptyBlock: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: assocColors.text },
  muted: { fontSize: 13, color: assocColors.muted, textAlign: "center" },
});
