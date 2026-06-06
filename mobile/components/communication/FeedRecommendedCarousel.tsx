import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  COMMUNICATION_HUB_SUGGESTIONS_REFRESH_MS,
  followCompany,
  followOrganization,
  getFeedRecommended,
  parseApiErrorMessage,
  unfollowCompany,
  unfollowOrganization,
  type FeedRecommendedItem,
} from "@/api/feedApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  feedRecommendedRoleBadgeLabel,
  recommendedFollowHint,
  sortRecommendedForDisplay,
} from "@/lib/feedRecommendedDisplay";
import { openFeedRecommendedMessage } from "@/lib/feedRecommendedMessage";
import {
  feedRecommendedProfilePath,
  feedRecommendedShowsViewProfile,
} from "@/lib/feedRecommendedNavigation";

export function FeedRecommendedCarousel() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<FeedRecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
  const [messageBusyId, setMessageBusyId] = useState<string | null>(null);
  const rotationRef = useRef(0);
  const excludeRef = useRef<string[]>([]);

  const loadRecommended = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getFeedRecommended({
        rotation: rotationRef.current,
        exclude: excludeRef.current,
      });
      const sorted = sortRecommendedForDisplay(response.items);
      setItems(sorted);
      excludeRef.current = sorted.map((i) => i.id);
    } catch (err) {
      if (!silent) {
        console.warn("Recommended feed failed", parseApiErrorMessage(err));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecommended();
  }, [loadRecommended]);

  useEffect(() => {
    const interval = setInterval(() => {
      rotationRef.current += 1;
      void loadRecommended(true);
    }, COMMUNICATION_HUB_SUGGESTIONS_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadRecommended]);

  const toggleFollow = async (item: FeedRecommendedItem) => {
    if (!item.canFollow || item.entityId <= 0 || followBusyId) return;
    setFollowBusyId(item.id);
    try {
      if (item.type === "company") {
        if (item.isFollowing) await unfollowCompany(item.entityId);
        else await followCompany(item.entityId);
      } else if (item.type === "association") {
        if (item.isFollowing) await unfollowOrganization(item.entityId);
        else await followOrganization(item.entityId);
      }
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, isFollowing: !entry.isFollowing } : entry,
        ),
      );
    } catch (err) {
      Alert.alert("Could not update follow", parseApiErrorMessage(err));
    } finally {
      setFollowBusyId(null);
    }
  };

  const handleMessage = async (item: FeedRecommendedItem) => {
    const userId = item.userId ?? 0;
    if (!item.canMessage || userId <= 0 || messageBusyId) return;
    setMessageBusyId(item.id);
    try {
      await openFeedRecommendedMessage(userId);
    } catch (err) {
      Alert.alert("Could not start conversation", parseApiErrorMessage(err));
    } finally {
      setMessageBusyId(null);
    }
  };

  const cardWidth = layout.scale(168);

  const renderCard = ({ item }: { item: FeedRecommendedItem }) => {
    const roleColor = colors[item.type];
    const hint = recommendedFollowHint(item.type);
    const showFollow = item.canFollow;
    const showMessage = item.canMessage && (item.userId ?? 0) > 0;
    const showViewProfile = feedRecommendedShowsViewProfile(item);

    return (
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            borderRadius: layout.radius.button,
            padding: layout.space("md"),
          },
        ]}
      >
        <FeedAvatar
          name={item.name}
          size={layout.scale(48)}
          avatarUrl={item.avatarUrl}
          avatarBase64={item.avatarBase64}
          roleType={item.type}
        />
        <Text style={[styles.cardName, { fontSize: layout.fontSize.label }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.subtitle ? (
          <Text style={[styles.cardSubtitle, { fontSize: layout.fontSize.footer }]} numberOfLines={2}>
            {item.subtitle}
          </Text>
        ) : null}
        <View style={[styles.badge, { backgroundColor: colors.roleBg[item.type] }]}>
          <Text style={[styles.badgeText, { color: roleColor, fontSize: layout.scale(11) }]}>
            {feedRecommendedRoleBadgeLabel(item.type)}
          </Text>
        </View>

        {hint ? (
          <Text style={[styles.hint, { fontSize: layout.scale(11) }]} numberOfLines={2}>
            {hint}
          </Text>
        ) : null}

        <View style={styles.cardActions}>
          {showViewProfile ? (
            <Pressable
              style={[styles.actionBtn, styles.viewProfileBtn, { borderRadius: layout.radius.input }]}
              onPress={() => router.push(feedRecommendedProfilePath(item) as never)}
            >
              <Ionicons name="person-outline" size={14} color={colors.primary} />
              <Text style={styles.actionBtnText}>View Profile</Text>
            </Pressable>
          ) : null}

          {showFollow ? (
            <Pressable
              style={[
                styles.actionBtn,
                item.isFollowing && styles.actionBtnFollowing,
                { borderRadius: layout.radius.input },
              ]}
              onPress={() => void toggleFollow(item)}
              disabled={followBusyId === item.id}
            >
              {followBusyId === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  {!item.isFollowing ? (
                    <Ionicons name="person-add-outline" size={14} color={colors.primary} />
                  ) : null}
                  <Text
                    style={[
                      styles.actionBtnText,
                      item.isFollowing && styles.actionBtnTextFollowing,
                    ]}
                  >
                    {item.isFollowing ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          {showMessage ? (
            <Pressable
              style={[styles.actionBtn, styles.messageBtn, { borderRadius: layout.radius.input }]}
              onPress={() => void handleMessage(item)}
              disabled={messageBusyId === item.id}
            >
              {messageBusyId === item.id ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={14} color={colors.foreground} />
                  <Text style={[styles.actionBtnText, styles.messageBtnText]}>Message</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.section, { paddingBottom: layout.space("md") }]}>
      <Text
        style={[
          styles.sectionTitle,
          {
            fontSize: layout.fontSize.label,
            paddingHorizontal: layout.horizontalPadding,
            marginBottom: layout.space("sm"),
          },
        ]}
      >
        Recommended For You
      </Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <Text style={[styles.empty, { paddingHorizontal: layout.horizontalPadding }]}>
          No recommendations yet. Check back soon.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            gap: layout.space("md"),
          }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  section: {
    width: "100%",
  },
  sectionTitle: {
    fontWeight: "700",
    color: colors.foreground,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardName: {
    fontWeight: "700",
    color: colors.foreground,
    marginTop: 4,
  },
  cardSubtitle: {
    color: colors.muted,
    lineHeight: 18,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  badgeText: {
    fontWeight: "600",
  },
  hint: {
    color: colors.muted,
    lineHeight: 15,
  },
  cardActions: {
    flexDirection: "column",
    gap: 6,
    marginTop: 4,
    width: "100%",
  },
  viewProfileBtn: {
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    minHeight: 32,
  },
  actionBtnFollowing: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
  },
  messageBtn: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    justifyContent: "center",
  },
  messageBtnText: {
    color: colors.foreground,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  actionBtnTextFollowing: {
    color: colors.muted,
  },
});
