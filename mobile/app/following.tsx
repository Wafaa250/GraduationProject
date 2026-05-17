import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";

import {
  getFollowingOrganizations,
  parseApiErrorMessage,
  unfollowOrganization,
  type PublicOrganizationDiscovery,
} from "@/api/organizationsApi";
import { OrganizationDiscoveryCard } from "@/components/organization/OrganizationDiscoveryCard";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function FollowingScreen() {
  const layout = useResponsiveLayout();
  const [items, setItems] = useState<PublicOrganizationDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followBusyId, setFollowBusyId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const data = await getFollowingOrganizations();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleUnfollow = async (org: PublicOrganizationDiscovery) => {
    if (followBusyId != null) return;
    setFollowBusyId(org.id);
    try {
      await unfollowOrganization(org.id);
      setItems((prev) => prev.filter((o) => o.id !== org.id));
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setFollowBusyId(null);
    }
  };

  const contentWidth = layout.isTablet ? 720 : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Following" subtitle="Your campus communities" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, contentWidth ? { alignSelf: "center", width: contentWidth } : null]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadAll(); }} />}
      >
        {loading ? (
          <ActivityIndicator color={assocColors.accent} style={{ marginTop: spacing.xl }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>You&apos;re not following anyone yet</Text>
            <Text style={styles.emptySub}>
              Follow organizations to stay updated with events and opportunities on campus.
            </Text>
            <Text style={styles.cta} onPress={() => router.push("/organizations" as Href)}>
              Discover organizations →
            </Text>
          </View>
        ) : (
          items.map((org) => (
            <OrganizationDiscoveryCard
              key={org.id}
              org={{ ...org, isFollowing: true }}
              followBusy={followBusyId === org.id}
              onToggleFollow={() => void handleUnfollow(org)}
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
  empty: {
    padding: spacing.xxl,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: assocColors.text, textAlign: "center" },
  emptySub: { marginTop: spacing.sm, fontSize: 13, color: assocColors.muted, textAlign: "center", lineHeight: 19 },
  cta: { marginTop: spacing.lg, fontSize: 14, fontWeight: "700", color: assocColors.accentDark },
});
