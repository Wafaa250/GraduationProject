import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  followCompany,
  followOrganization,
  getFeedRecommended,
  parseApiErrorMessage,
  unfollowCompany,
  unfollowOrganization,
  type FeedRecommendedItem,
} from "@/api/feedApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { HubButton } from "@/components/hub/HubButton";
import { HubRecommendedSkeleton } from "@/components/hub/HubSkeleton";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubDesign } from "@/hooks/use-hub-design";
import {
  feedRecommendedRoleBadgeLabel,
  sortRecommendedForDisplay,
} from "@/lib/feedRecommendedDisplay";
import { openFeedRecommendedMessage } from "@/lib/feedRecommendedMessage";
import {
  feedRecommendedProfilePath,
  feedRecommendedShowsFollow,
  feedRecommendedShowsMessage,
  feedRecommendedShowsViewProfile,
} from "@/lib/feedRecommendedNavigation";
import { getHubRoleAccent } from "@/lib/hubRoleAccent";
import {
  bumpRecommendedRotationTick,
  FEED_RECOMMENDED_DISPLAY_COUNT,
  FEED_RECOMMENDED_ROTATE_MS,
  getStoredRecommendedRotationTick,
  readLastRecommendedIds,
  saveLastRecommendedIds,
} from "@/lib/feedRecommendedRotation";

export function FeedRecommendedCarousel() {
  const hub = useHubDesign();
  const { colors, layout } = hub;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<FeedRecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
  const [messageBusyId, setMessageBusyId] = useState<string | null>(null);
  const rotationRef = useRef(0);
  const itemsRef = useRef<FeedRecommendedItem[]>([]);

  const loadRecommended = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      rotationRef.current = await bumpRecommendedRotationTick(rotationRef.current);

      const excludeIds =
        silent && itemsRef.current.length > 0
          ? itemsRef.current.map((i) => i.id)
          : await readLastRecommendedIds();

      const response = await getFeedRecommended({
        rotation: rotationRef.current,
        exclude: excludeIds.length > 0 ? excludeIds : undefined,
      });
      const sorted = sortRecommendedForDisplay(response.items).slice(
        0,
        FEED_RECOMMENDED_DISPLAY_COUNT,
      );
      itemsRef.current = sorted;
      setItems(sorted);
      await saveLastRecommendedIds(sorted.map((i) => i.id));
    } catch (err) {
      if (!silent) {
        console.warn("Recommended feed failed", parseApiErrorMessage(err));
        itemsRef.current = [];
        setItems([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      rotationRef.current = await getStoredRecommendedRotationTick();
      await loadRecommended();
    })();
  }, [loadRecommended]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadRecommended(true);
    }, FEED_RECOMMENDED_ROTATE_MS);
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

  const cardWidth = layout.scale(152);

  const renderCard = ({ item }: { item: FeedRecommendedItem }) => {
    const showFollow = feedRecommendedShowsFollow(item.type) && item.canFollow && item.entityId > 0;
    const showMessage = feedRecommendedShowsMessage(item);
    const showViewProfile = feedRecommendedShowsViewProfile(item);
    const matchLabel = item.matchScore > 0 ? `${item.matchScore}% match` : null;
    const roleLabel = feedRecommendedRoleBadgeLabel(item.type);
    const roleAccent = getHubRoleAccent(colors, item.type);

    return (
      <View
        style={[
          styles.card,
          hub.shadow,
          {
            width: cardWidth,
            borderRadius: hub.card.radius,
            padding: hub.card.padding - 2,
            borderColor: roleAccent.border,
          },
        ]}
      >
        <View
          style={[
            styles.cardAccent,
            {
              backgroundColor: roleAccent.fg,
              borderTopLeftRadius: hub.card.radius,
              borderTopRightRadius: hub.card.radius,
            },
          ]}
        />
        <FeedAvatar
          name={item.name}
          size={hub.avatar.recommended}
          avatarUrl={item.avatarUrl}
          avatarBase64={item.avatarBase64}
          roleType={item.type}
        />

        <Text style={[styles.cardName, hub.type.author]} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.subtitle?.trim() || roleLabel}
        </Text>

        {matchLabel ? <Text style={styles.matchLabel}>{matchLabel}</Text> : null}

        <View style={styles.cardActions}>
          {showViewProfile ? (
            <HubButton
              label="View Profile"
              variant="primary"
              size="sm"
              icon="person-outline"
              fullWidth
              accent={item.type}
              onPress={() => router.push(feedRecommendedProfilePath(item) as never)}
            />
          ) : null}

          {(showFollow || showMessage) && (
            <View style={styles.secondaryRow}>
              {showFollow ? (
                <HubButton
                  label={item.isFollowing ? "Following" : "Follow"}
                  variant="secondary"
                  size="sm"
                  icon={item.isFollowing ? undefined : "person-add-outline"}
                  loading={followBusyId === item.id}
                  active={item.isFollowing}
                  accent={item.type}
                  onPress={() => void toggleFollow(item)}
                />
              ) : null}
              {showMessage ? (
                <HubButton
                  label="Message"
                  variant="secondary"
                  size="sm"
                  icon="chatbubble-outline"
                  loading={messageBusyId === item.id}
                  accent={item.type}
                  onPress={() => void handleMessage(item)}
                />
              ) : null}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.section, { paddingBottom: layout.space("sm") }]}>
      <Text
        style={[
          styles.sectionTitle,
          hub.type.sectionTitle,
          {
            paddingHorizontal: layout.horizontalPadding,
            marginBottom: layout.space("sm"),
          },
        ]}
      >
        Recommended for you
      </Text>

      {loading ? (
        <HubRecommendedSkeleton />
      ) : items.length === 0 ? (
        <Text style={[styles.empty, { paddingHorizontal: layout.horizontalPadding }]}>
          No recommendations yet.
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
            gap: layout.space("sm") + 4,
          }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    section: { width: "100%" },
    sectionTitle: { color: colors.foreground },
    empty: { color: colors.muted, fontSize: 13 },
    card: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      alignItems: "center",
      gap: 4,
      overflow: "hidden",
    },
    cardAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
    },
    cardName: {
      color: colors.foreground,
      marginTop: 6,
      textAlign: "center",
      width: "100%",
    },
    cardSubtitle: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      textAlign: "center",
      width: "100%",
    },
    matchLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "500",
      marginTop: 2,
    },
    cardActions: {
      width: "100%",
      gap: 6,
      marginTop: 8,
    },
    secondaryRow: {
      flexDirection: "row",
      gap: 6,
      width: "100%",
    },
  });
