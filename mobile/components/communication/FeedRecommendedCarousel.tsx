import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  feedRecommendedRoleBadgeLabel,
  recommendedFollowHint,
  sortRecommendedForDisplay,
} from "@/lib/feedRecommendedDisplay";

export function FeedRecommendedCarousel() {
  const layout = useResponsiveLayout();
  const [items, setItems] = useState<FeedRecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
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

  const cardWidth = layout.scale(148);

  const renderCard = ({ item }: { item: FeedRecommendedItem }) => {
    const roleColor = HUB_COLORS[item.type];
    const hint = recommendedFollowHint(item.type);
    const showFollow = item.canFollow;
    const showMessage = item.canMessage;

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
        <View style={[styles.badge, { backgroundColor: HUB_COLORS.roleBg[item.type] }]}>
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
                <ActivityIndicator size="small" color={HUB_COLORS.primary} />
              ) : (
                <>
                  {!item.isFollowing ? (
                    <Ionicons name="person-add-outline" size={14} color={HUB_COLORS.primary} />
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
              onPress={() => router.push("/messages")}
            >
              <Ionicons name="chatbubble-outline" size={14} color={HUB_COLORS.foreground} />
              <Text style={styles.actionBtnText}>Message</Text>
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
          <ActivityIndicator color={HUB_COLORS.primary} />
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

const styles = StyleSheet.create({
  section: {
    width: "100%",
  },
  sectionTitle: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  empty: {
    color: HUB_COLORS.muted,
    fontSize: 14,
  },
  card: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    gap: 6,
    shadowColor: HUB_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardName: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    marginTop: 4,
  },
  cardSubtitle: {
    color: HUB_COLORS.muted,
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
    color: HUB_COLORS.muted,
    lineHeight: 15,
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: HUB_COLORS.primaryBorder,
    backgroundColor: HUB_COLORS.primarySoft,
    minHeight: 32,
  },
  actionBtnFollowing: {
    backgroundColor: HUB_COLORS.inputBg,
    borderColor: HUB_COLORS.border,
  },
  messageBtn: {
    backgroundColor: HUB_COLORS.inputBg,
    borderColor: HUB_COLORS.border,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: HUB_COLORS.primary,
  },
  actionBtnTextFollowing: {
    color: HUB_COLORS.muted,
  },
});
