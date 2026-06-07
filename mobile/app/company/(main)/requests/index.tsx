import { router, useFocusEffect, type Href } from "expo-router";
import { FileText, Plus, Sparkles } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { listCompanyProjectRequests, parseApiErrorMessage, type CompanyProjectRequestSummary } from "@/api/companyApi";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanyRequestListCard } from "@/components/company/requests/CompanyRequestListCard";
import { CompanyRequestStatsStrip } from "@/components/company/requests/CompanyRequestStatsStrip";
import { createRequestStyles } from "@/components/company/requests/requestStyles";
import { CompanyWorkspaceToolbar } from "@/components/company/CompanyWorkspaceToolbar";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { countRequestStatuses } from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { COMPANY_REQUESTS_EMPTY, COMPANY_REQUESTS_SUBTITLE } from "@/lib/companyWorkspaceCopy";

export default function CompanyRequestsScreen() {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createRequestStyles(colors), [colors]);
  const [requests, setRequests] = useState<CompanyProjectRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await listCompanyProjectRequests(false);
      setRequests(data.filter((r) => r.status !== "draft"));
      setError(null);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(true); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const stats = useMemo(() => countRequestStatuses(requests), [requests]);
  const activeCount = stats.active;

  const listHeader = (
    <>
      <View style={styles.pageHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.pageTitle}>Requests</Text>
          <Text style={styles.pageSubtitle}>
            {activeCount} active · {COMPANY_REQUESTS_SUBTITLE}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(COMPANY_ROUTES.newRequest as Href)}
          style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9 }]}
          accessibilityLabel="Create new request"
        >
          <Plus size={22} color="#FFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {!loading && !error && requests.length > 0 ? (
        <CompanyRequestStatsStrip
          stats={[
            { label: "Total", value: stats.total, icon: FileText },
            { label: "Active", value: stats.active, icon: Sparkles, accent: true },
            { label: "Paused", value: stats.paused, icon: FileText },
            { label: "Closed", value: stats.closed, icon: FileText },
          ]}
        />
      ) : null}
    </>
  );

  return (
    <CompanyScreen edges={["top"]}>
      <CompanyWorkspaceToolbar />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={{ padding: HOME_SPACE.lg }}>
          <CompanyEmptyState icon={FileText} message={error} actionLabel="Retry" onAction={() => void load()} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: HOME_SPACE.xxxl, gap: HOME_SPACE.md }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={{ paddingHorizontal: HOME_SPACE.lg }}>
              <CompanyEmptyState
                icon={FileText}
                message={COMPANY_REQUESTS_EMPTY}
                actionLabel="Create Request"
                onAction={() => router.push(COMPANY_ROUTES.newRequest as Href)}
              />
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: HOME_SPACE.lg }}>
              <CompanyRequestListCard request={item} />
            </View>
          )}
        />
      )}
    </CompanyScreen>
  );
}
