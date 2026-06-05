import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCommunicationFeed } from "@/api/feedApi";
import { FeedHeader } from "@/components/communication/FeedHeader";
import { FeedPostCard } from "@/components/communication/FeedPostCard";
import { FeedPostComposer } from "@/components/communication/FeedPostComposer";
import { FeedRecommendedCarousel } from "@/components/communication/FeedRecommendedCarousel";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { FeedItem } from "@/lib/feedTypes";

export default function CommunicationHubScreen() {
  const layout = useResponsiveLayout();
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

  const listHeader = (
    <View>
      <FeedHeader />
      <FeedRecommendedCarousel />
      <FeedPostComposer onPosted={() => void loadFeed(true)} />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={HUB_COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : loadFailed ? (
        <View style={[styles.emptyWrap, { paddingHorizontal: layout.horizontalPadding }]}>
          <Text style={styles.emptyTitle}>No activity available yet.</Text>
          <Text style={styles.emptyDescription}>
            We couldn&apos;t refresh the activity stream right now. Pull down to try again.
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={[styles.emptyWrap, { paddingHorizontal: layout.horizontalPadding }]}>
          <Text style={styles.emptyTitle}>Your feed is quiet.</Text>
          <Text style={styles.emptyDescription}>
            Follow companies and associations, or create a post to get started.
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedPostCard item={item} />}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingBottom: layout.space("xl"),
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={HUB_COLORS.primary}
            colors={[HUB_COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    color: HUB_COLORS.muted,
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: HUB_COLORS.foreground,
    textAlign: "center",
  },
  emptyDescription: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
