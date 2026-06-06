import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  followCompany,
  followOrganization,
  parseApiErrorMessage,
  searchCommunicationHub,
  unfollowCompany,
  unfollowOrganization,
  type FeedSearchResultRow,
  type HubSearchResults,
} from "@/api/feedApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import type { HubRoleType } from "@/constants/studentHubTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { feedPostRoleLabel } from "@/lib/feedPostDisplay";
import {
  hubSearchProfilePath,
  hubSearchShowsViewProfile,
  searchRowCanFollow,
  searchRowCanMessage,
  searchRowMessageTargetUserId,
} from "@/lib/hubSearchNavigation";
import { openFeedRecommendedMessage } from "@/lib/feedRecommendedMessage";

type Props = {
  visible: boolean;
  initialQuery: string;
  onClose: () => void;
  onQueryChange: (query: string) => void;
};

type SearchSection = {
  key: keyof HubSearchResults;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  data: FeedSearchResultRow[];
};

const GROUPS: {
  key: keyof HubSearchResults;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "students", title: "Students", icon: "person-outline" },
  { key: "doctors", title: "Doctors", icon: "medkit-outline" },
  { key: "companies", title: "Companies", icon: "business-outline" },
  { key: "associations", title: "Associations", icon: "people-outline" },
];

function roleFromEntityType(entityType: string): HubRoleType {
  const t = entityType.toLowerCase();
  if (t === "doctor") return "doctor";
  if (t === "company") return "company";
  if (t === "association") return "association";
  return "student";
}

function rowKey(row: FeedSearchResultRow): string {
  if (row.entityType === "company" && row.entityId <= 0 && row.userId) {
    return `company-orphan-${row.userId}`;
  }
  return `${row.entityType}-${row.entityId}`;
}

function displayUsername(row: FeedSearchResultRow): string | null {
  if (row.username?.trim()) return `@${row.username.trim()}`;
  if (row.email?.includes("@")) return `@${row.email.split("@")[0]}`;
  return null;
}

export function FeedSearchModal({ visible, initialQuery, onClose, onQueryChange }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<HubSearchResults>({
    students: [],
    doctors: [],
    companies: [],
    associations: [],
  });
  const [followBusyKey, setFollowBusyKey] = useState<string | null>(null);
  const [messageBusyKey, setMessageBusyKey] = useState<string | null>(null);
  const searchGenerationRef = useRef(0);

  useEffect(() => {
    if (visible) setQuery(initialQuery);
  }, [visible, initialQuery]);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults({ students: [], doctors: [], companies: [], associations: [] });
      setError(null);
      return;
    }

    const generation = ++searchGenerationRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await searchCommunicationHub(trimmed);
      if (generation !== searchGenerationRef.current) return;
      setResults(data);
    } catch (err) {
      if (generation !== searchGenerationRef.current) return;
      setError(parseApiErrorMessage(err));
      setResults({ students: [], doctors: [], companies: [], associations: [] });
    } finally {
      if (generation === searchGenerationRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => void runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, visible, runSearch]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onQueryChange(value);
  };

  const updateRowFollowing = (key: string, isFollowing: boolean) => {
    setResults((prev) => {
      const next = { ...prev };
      for (const group of GROUPS) {
        next[group.key] = prev[group.key].map((row) =>
          rowKey(row) === key ? { ...row, isFollowing } : row,
        );
      }
      return next;
    });
  };

  const handleViewProfile = (row: FeedSearchResultRow) => {
    if (!hubSearchShowsViewProfile(row)) return;
    const path = hubSearchProfilePath(row);
    onClose();
    router.push(path as Href);
  };

  const handleMessage = async (row: FeedSearchResultRow) => {
    const key = rowKey(row);
    if (!searchRowCanMessage(row) || messageBusyKey) return;
    const targetUserId = searchRowMessageTargetUserId(row);
    if (targetUserId <= 0) return;
    setMessageBusyKey(key);
    try {
      onClose();
      await openFeedRecommendedMessage(targetUserId);
    } catch (err) {
      Alert.alert("Could not start conversation", parseApiErrorMessage(err));
    } finally {
      setMessageBusyKey(null);
    }
  };

  const handleFollow = async (row: FeedSearchResultRow) => {
    const key = rowKey(row);
    if (!searchRowCanFollow(row) || followBusyKey) return;
    setFollowBusyKey(key);
    try {
      const type = row.entityType.toLowerCase();
      if (type === "company") {
        if (row.isFollowing) await unfollowCompany(row.entityId);
        else await followCompany(row.entityId);
      } else if (type === "association") {
        if (row.isFollowing) await unfollowOrganization(row.entityId);
        else await followOrganization(row.entityId);
      }
      updateRowFollowing(key, !row.isFollowing);
    } catch (err) {
      Alert.alert("Could not update follow", parseApiErrorMessage(err));
    } finally {
      setFollowBusyKey(null);
    }
  };

  const sections: SearchSection[] = GROUPS.map((group) => ({
    ...group,
    data: results[group.key],
  })).filter((section) => section.data.length > 0);

  const hasResults = sections.length > 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View
          style={[
            styles.header,
            { paddingHorizontal: layout.horizontalPadding, gap: layout.space("sm") },
          ]}
        >
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close search">
            <Ionicons name="arrow-back" size={layout.iconSize + 4} color={colors.foreground} />
          </Pressable>
          <View style={[styles.searchWrap, { borderRadius: layout.radius.input, flex: 1 }]}>
            <Ionicons name="search" size={layout.iconSize} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search students, doctors, companies..."
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { fontSize: layout.fontSize.body }]}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => handleQueryChange("")} hitSlop={8}>
                <Ionicons name="close-circle" size={layout.iconSize} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Searching…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !hasResults && query.trim() ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No results found.</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => rowKey(item)}
            contentContainerStyle={{
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: insets.bottom + layout.space("xl"),
            }}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <View style={[styles.sectionHeader, { marginTop: layout.space("md") }]}>
                <Ionicons name={section.icon} size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { fontSize: layout.fontSize.label }]}>
                  {section.title} ({section.data.length})
                </Text>
              </View>
            )}
            renderItem={({ item }) => {
              const role = roleFromEntityType(item.entityType);
              const username = displayUsername(item);
              const key = rowKey(item);
              const showProfile = hubSearchShowsViewProfile(item);
              const showMessage = searchRowCanMessage(item);
              const showFollow = searchRowCanFollow(item);
              const followBusy = followBusyKey === key;
              const messageBusy = messageBusyKey === key;

              return (
                <View style={[styles.resultCard, { borderRadius: layout.radius.input }]}>
                  <View style={styles.resultTop}>
                    <FeedAvatar
                      name={item.name}
                      size={layout.scale(44)}
                      avatarUrl={item.avatarUrl}
                      avatarBase64={item.avatarBase64}
                      roleType={role}
                    />
                    <View style={styles.resultMeta}>
                      <Text style={[styles.resultName, { fontSize: layout.fontSize.label }]}>
                        {item.name}
                      </Text>
                      {username ? (
                        <Text style={[styles.resultUsername, { fontSize: layout.fontSize.footer }]}>
                          {username}
                        </Text>
                      ) : null}
                      <Text style={[styles.resultSubtitle, { fontSize: layout.fontSize.footer }]}>
                        {item.subtitle || feedPostRoleLabel(role)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.actionRow, { gap: layout.space("sm") }]}>
                    {showProfile ? (
                      <Pressable
                        style={[styles.actionBtn, { borderRadius: layout.radius.input }]}
                        onPress={() => handleViewProfile(item)}
                      >
                        <Text style={styles.actionBtnText}>View Profile</Text>
                      </Pressable>
                    ) : null}
                    {showMessage ? (
                      <Pressable
                        style={[styles.actionBtn, { borderRadius: layout.radius.input }]}
                        onPress={() => void handleMessage(item)}
                        disabled={messageBusy}
                      >
                        <Text style={styles.actionBtnText}>
                          {messageBusy ? "Opening…" : "Message"}
                        </Text>
                      </Pressable>
                    ) : null}
                    {showFollow ? (
                      <Pressable
                        style={[
                          styles.actionBtn,
                          item.isFollowing && styles.actionBtnFollowing,
                          { borderRadius: layout.radius.input },
                        ]}
                        onPress={() => void handleFollow(item)}
                        disabled={followBusy}
                      >
                        <Text
                          style={[
                            styles.actionBtnText,
                            item.isFollowing && styles.actionBtnTextFollowing,
                          ]}
                        >
                          {followBusy
                            ? "Updating…"
                            : item.isFollowing
                              ? "Following"
                              : "Follow"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    padding: 0,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  errorText: {
    color: "#DC2626",
    textAlign: "center",
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontWeight: "700",
    color: colors.foreground,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  resultTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  resultName: {
    fontWeight: "700",
    color: colors.foreground,
  },
  resultUsername: {
    color: colors.primary,
    fontWeight: "600",
  },
  resultSubtitle: {
    color: colors.muted,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  actionBtnFollowing: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
  },
  actionBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  actionBtnTextFollowing: {
    color: colors.foreground,
  },
});
