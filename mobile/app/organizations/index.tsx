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

import {
  followOrganization,
  getFollowingOrganizations,
  listPublicOrganizationsForDiscovery,
  parseApiErrorMessage,
  unfollowOrganization,
  type PublicOrganizationDiscovery,
} from "@/api/organizationsApi";
import { AssociationAvatar } from "@/components/organization/AssociationAvatar";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getItem } from "@/utils/authStorage";

function formatFollowers(count: number) {
  if (count === 1) return "1 follower";
  return `${count.toLocaleString()} followers`;
}

function OrganizationDiscoveryCard({
  org,
  isStudent,
  busy,
  onToggleFollow,
  onOpen,
}: {
  org: PublicOrganizationDiscovery;
  isStudent: boolean;
  busy: boolean;
  onToggleFollow: () => void;
  onOpen: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.cardCover} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <AssociationAvatar name={org.organizationName} logoUrl={org.logoUrl} size="md" />
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {org.organizationName}
            </Text>
            <Text style={styles.cardUsername}>@{org.username}</Text>
            {org.category ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{org.category}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {org.shortDescription ? (
          <Text style={styles.cardDesc} numberOfLines={3}>
            {org.shortDescription}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={styles.followersRow}>
            <Ionicons name="people-outline" size={14} color={assocColors.muted} />
            <Text style={styles.followersText}>{formatFollowers(org.followersCount)}</Text>
          </View>
          {isStudent ? (
            <Pressable
              style={[styles.followBtn, org.isFollowing && styles.followBtnActive]}
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleFollow();
              }}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator size="small" color={org.isFollowing ? "#fff" : assocColors.accentDark} />
              ) : (
                <>
                  <Ionicons
                    name={org.isFollowing ? "heart" : "heart-outline"}
                    size={14}
                    color={org.isFollowing ? "#fff" : assocColors.accentDark}
                  />
                  <Text style={[styles.followBtnText, org.isFollowing && styles.followBtnTextActive]}>
                    {org.isFollowing ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function StudentOrganizationsScreen() {
  const layout = useResponsiveLayout();
  const [isStudent, setIsStudent] = useState(false);
  const [organizations, setOrganizations] = useState<PublicOrganizationDiscovery[]>([]);
  const [following, setFollowing] = useState<PublicOrganizationDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [followBusyId, setFollowBusyId] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const role = ((await getItem("role")) ?? "").toLowerCase();
      setIsStudent(role === "student");
    })();
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const role = ((await getItem("role")) ?? "").toLowerCase();
      const student = role === "student";
      const [all, followed] = await Promise.all([
        listPublicOrganizationsForDiscovery(),
        student ? getFollowingOrganizations() : Promise.resolve([]),
      ]);
      setOrganizations(all);
      setFollowing(followed);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizations.filter((org) => {
      if (categoryFilter && (org.category ?? "") !== categoryFilter) return false;
      if (!q) return true;
      return (
        org.organizationName.toLowerCase().includes(q) ||
        org.username.toLowerCase().includes(q) ||
        (org.shortDescription ?? "").toLowerCase().includes(q) ||
        (org.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [organizations, search, categoryFilter]);

  const patchOrg = (id: number, isFollowing: boolean, delta: number) => {
    const map = (list: PublicOrganizationDiscovery[]) =>
      list.map((o) =>
        o.id === id
          ? { ...o, isFollowing, followersCount: Math.max(0, o.followersCount + delta) }
          : o,
      );
    setOrganizations((prev) => {
      const next = map(prev);
      const org = next.find((o) => o.id === id);
      if (org) {
        setFollowing((fPrev) => {
          if (isFollowing) {
            if (fPrev.some((p) => p.id === id)) return map(fPrev);
            return [...fPrev, org].sort((a, b) => a.organizationName.localeCompare(b.organizationName));
          }
          return fPrev.filter((p) => p.id !== id);
        });
      }
      return next;
    });
  };

  const handleFollowToggle = async (org: PublicOrganizationDiscovery) => {
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
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setFollowBusyId(null);
    }
  };

  const contentWidth = layout.isTablet ? 720 : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Organizations" subtitle="Discover student organizations" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.scroll, contentWidth ? { alignSelf: "center", width: contentWidth } : null]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadAll(); }} />}
        keyboardShouldPersistTaps="handled"
      >
        {!loading && isStudent && following.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My following organizations</Text>
            {following.map((org) => (
              <OrganizationDiscoveryCard
                key={`f-${org.id}`}
                org={org}
                isStudent={isStudent}
                busy={followBusyId === org.id}
                onToggleFollow={() => void handleFollowToggle(org)}
                onOpen={() => router.push(`/public-organizations/${org.id}` as Href)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={assocColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search organizations…"
            placeholderTextColor={assocColors.subtle}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {categories.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
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
                onPress={() => setCategoryFilter(c)}
              >
                <Text style={[styles.chipText, categoryFilter === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Text style={styles.sectionTitle}>Discover organizations</Text>

        {loading ? (
          <ActivityIndicator color={assocColors.accent} style={{ marginTop: spacing.xl }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No organizations found</Text>
            <Text style={styles.emptySub}>Try another search or category.</Text>
          </View>
        ) : (
          filtered.map((org) => (
            <OrganizationDiscoveryCard
              key={org.id}
              org={org}
              isStudent={isStudent}
              busy={followBusyId === org.id}
              onToggleFollow={() => void handleFollowToggle(org)}
              onOpen={() => router.push(`/public-organizations/${org.id}` as Href)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: assocColors.text,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: assocColors.surface,
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: assocColors.text,
    paddingVertical: spacing.xs,
  },
  chipsScroll: { marginBottom: spacing.lg, maxHeight: 40 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: assocColors.accentMuted,
    borderColor: assocColors.accentBorder,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: assocColors.muted },
  chipTextActive: { color: assocColors.accentDark },
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  cardCover: {
    height: 72,
    backgroundColor: assocColors.accentMuted,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
  },
  cardBody: { padding: spacing.lg },
  cardTop: { flexDirection: "row", gap: spacing.md },
  cardMeta: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: assocColors.text },
  cardUsername: { fontSize: 12, color: assocColors.muted, marginTop: 2 },
  categoryPill: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  categoryText: { fontSize: 11, fontWeight: "600", color: assocColors.accentDark },
  cardDesc: { marginTop: spacing.md, fontSize: 13, lineHeight: 19, color: assocColors.muted },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  followersRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  followersText: { fontSize: 12, fontWeight: "600", color: assocColors.muted },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
    minWidth: 100,
    justifyContent: "center",
  },
  followBtnActive: {
    backgroundColor: assocColors.accent,
    borderColor: assocColors.accent,
  },
  followBtnText: { fontSize: 12, fontWeight: "700", color: assocColors.accentDark },
  followBtnTextActive: { color: "#fff" },
  empty: {
    padding: spacing.xxl,
    alignItems: "center",
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: assocColors.text },
  emptySub: { marginTop: spacing.sm, fontSize: 13, color: assocColors.muted, textAlign: "center" },
});
