import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { getCommunicationFeed } from "@/api/feedApi";
import type { StudentPost } from "@/api/studentPostsApi";
import { FeedHeader } from "@/components/communication/FeedHeader";
import { FeedPostCard } from "@/components/communication/FeedPostCard";
import { FeedPostComposer } from "@/components/communication/FeedPostComposer";
import { FeedRecommendedCarousel } from "@/components/communication/FeedRecommendedCarousel";
import { HubFeedSkeleton } from "@/components/hub/HubSkeleton";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useHubDesign } from "@/hooks/use-hub-design";
import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";
import { studentPostToFeedItem } from "@/lib/studentPostFeed";

function HubEmptyState({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const hub = useHubDesign();
  const { colors } = hub;

  return (
    <View style={[emptyStyles.wrap, { paddingHorizontal: hub.layout.horizontalPadding }]}>
      <View style={[emptyStyles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[emptyStyles.description, { color: colors.muted }]}>{description}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
});

export default function CommunicationHubScreen() {
  const hub = useHubDesign();
  const { colors } = hub;
  const { colors: themeColors } = useHubTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadFailed(false);
    try {
      const data = await getCommunicationFeed();
      setItems(data.items);
    } catch (err) {
      console.error("Communication Hub feed failed to load", err);
      setItems([]);
      setLoadFailed(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed(true);
    setRefreshing(false);
  }, [loadFeed]);

  const handleSocialPostUpdated = useCallback((post: StudentPost) => {
    setItems((prev) =>
      prev.map((entry) => {
        if (entry.relatedEntityId !== post.id) return entry;
        if (entry.relatedEntityType !== FEED_SOURCE_TYPES.studentPost) return entry;
        return studentPostToFeedItem(post, entry);
      }),
    );
  }, []);

  const handleSocialPostDeleted = useCallback((postId: number) => {
    setItems((prev) =>
      prev.filter(
        (entry) =>
          !(
            entry.relatedEntityType === FEED_SOURCE_TYPES.studentPost &&
            entry.relatedEntityId === postId
          ),
      ),
    );
  }, []);

  const listHeader = (
    <View>
      <FeedHeader />
      <FeedRecommendedCarousel />
      <FeedPostComposer onPosted={() => void loadFeed(true)} />

      {loading ? (
        <View style={styles.skeletonStack}>
          <HubFeedSkeleton />
          <HubFeedSkeleton />
        </View>
      ) : loadFailed ? (
        <HubEmptyState
          icon="cloud-offline-outline"
          title="Couldn't load your feed"
          description="Pull down to refresh and try again."
        />
      ) : items.length === 0 ? (
        <HubEmptyState
          icon="newspaper-outline"
          title="Your feed is quiet"
          description="Follow companies and associations, or share an update to get started."
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedPostCard
            item={item}
            onSocialPostUpdated={handleSocialPostUpdated}
            onSocialPostDeleted={handleSocialPostDeleted}
          />
        )}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingBottom: hub.layout.space("xl"),
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.cardBg}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    skeletonStack: {
      gap: 0,
    },
  });
