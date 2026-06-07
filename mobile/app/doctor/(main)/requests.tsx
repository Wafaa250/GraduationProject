import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ArrowDownUp } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  acceptSupervisorRequest,
  getDoctorSupervisorRequests,
  getDoctorSupervisorRequestsSummary,
  rejectSupervisorRequest,
  type DoctorSupervisorRequest,
  type DoctorSupervisorRequestsSummary,
} from "@/api/doctorDashboardApi";
import { SupervisionRequestDetailSheet } from "@/components/doctor/supervision/SupervisionRequestDetailSheet";
import { SupervisionRequestListCard } from "@/components/doctor/supervision/SupervisionRequestListCard";
import { SupervisionRequestsEmptyState } from "@/components/doctor/supervision/SupervisionRequestsEmptyState";
import { SupervisionRequestsFilterBar } from "@/components/doctor/supervision/SupervisionRequestsFilterBar";
import { SupervisionRequestsListSkeleton } from "@/components/doctor/supervision/SupervisionRequestsListSkeleton";
import { SupervisionRequestsStatsStrip } from "@/components/doctor/supervision/SupervisionRequestsStatsStrip";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  filterSupervisionRequestsByTab,
  searchSupervisionRequests,
  sortSupervisionRequests,
  SORT_OPTIONS,
  supervisionTabCounts,
  type SupervisionRequestSort,
  type SupervisionRequestTab,
} from "@/lib/supervisionRequestUi";

const EMPTY_SUMMARY: DoctorSupervisorRequestsSummary = {
  pendingCount: 0,
  acceptedCount: 0,
  rejectedCount: 0,
  totalCount: 0,
};

export default function DoctorSupervisionRequestsScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<DoctorSupervisorRequest[]>([]);
  const [summary, setSummary] = useState<DoctorSupervisorRequestsSummary>(EMPTY_SUMMARY);
  const [activeTab, setActiveTab] = useState<SupervisionRequestTab>("all");
  const [sort, setSort] = useState<SupervisionRequestSort>("newest");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DoctorSupervisorRequest | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [list, counts] = await Promise.all([
        getDoctorSupervisorRequests(),
        getDoctorSupervisorRequestsSummary(),
      ]);
      setRequests(list);
      setSummary(counts);
    } catch (err) {
      Alert.alert("Could not load supervision requests", parseApiErrorMessage(err));
      setRequests([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const tabCounts = useMemo(() => supervisionTabCounts(requests), [requests]);

  const filteredRequests = useMemo(() => {
    let items = filterSupervisionRequestsByTab(requests, activeTab);
    items = searchSupervisionRequests(items, searchQuery);
    return sortSupervisionRequests(items, sort);
  }, [requests, activeTab, searchQuery, sort]);

  const sortLabel = SORT_OPTIONS.find((o) => o.id === sort)?.label ?? "Newest first";

  const openSortPicker = () => {
    const options = [...SORT_OPTIONS.map((o) => o.label), "Cancel"];
    const cancelIndex = options.length - 1;

    const applySort = (index: number) => {
      if (index >= 0 && index < SORT_OPTIONS.length) {
        setSort(SORT_OPTIONS[index].id);
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: "Sort requests" },
        applySort,
      );
      return;
    }

    Alert.alert(
      "Sort requests",
      undefined,
      [
        ...SORT_OPTIONS.map((option, index) => ({
          text: option.label,
          onPress: () => applySort(index),
        })),
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleAccept = async (requestId: number) => {
    setBusyId(requestId);
    try {
      await acceptSupervisorRequest(requestId);
      Alert.alert("Request accepted", "The project is now in Active Projects.");
      setDetailVisible(false);
      setSelectedRequest(null);
      await load(true);
    } catch (err) {
      Alert.alert("Accept failed", parseApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setBusyId(requestId);
    try {
      await rejectSupervisorRequest(requestId);
      Alert.alert("Request rejected");
      setDetailVisible(false);
      setSelectedRequest(null);
      await load(true);
    } catch (err) {
      Alert.alert("Reject failed", parseApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openDetails = (request: DoctorSupervisorRequest) => {
    setSelectedRequest(request);
    setDetailVisible(true);
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <SupervisionRequestsStatsStrip summary={summary} loading={loading && requests.length === 0} />

      <SupervisionRequestsFilterBar
        value={activeTab}
        counts={tabCounts}
        loading={loading && requests.length === 0}
        onChange={setActiveTab}
      />

      <View style={styles.metaBar}>
        <Text style={[styles.metaText, { fontSize: layout.scale(12) }]}>
          {filteredRequests.length} of {requests.length} requests
        </Text>
        <Pressable
          onPress={openSortPicker}
          style={styles.sortBtn}
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sortLabel}`}
        >
          <ArrowDownUp size={13} color={colors.muted} strokeWidth={2.2} />
          <Text style={[styles.sortText, { color: colors.muted, fontSize: layout.scale(12) }]}>
            {sortLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading && requests.length === 0) {
      return <SupervisionRequestsListSkeleton />;
    }

    return (
      <SupervisionRequestsEmptyState
        title={
          searchQuery.trim()
            ? "No matches found"
            : requests.length === 0
              ? "No supervision requests available"
              : "No requests in this filter"
        }
        description={
          searchQuery.trim()
            ? "Try a different student name, project title, or skill keyword."
            : requests.length === 0
              ? "When students submit supervision requests, they will appear here for review."
              : "Try another status filter or adjust your search."
        }
        compact
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader
          title="Requests"
          subtitle="Review student supervision requests"
          showBack={false}
          variant="compact"
          rightSlot={
            <Pressable
              onPress={() => {
                setSearchVisible((prev) => {
                  if (prev) setSearchQuery("");
                  return !prev;
                });
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={searchVisible ? "Close search" : "Search requests"}
              style={[styles.headerAction, { backgroundColor: colors.inputBg }]}
            >
              <Ionicons
                name={searchVisible ? "close" : "search-outline"}
                size={20}
                color={searchVisible ? colors.primary : colors.foreground}
              />
            </Pressable>
          }
        />

        {searchVisible ? (
          <View
            style={[
              styles.searchBar,
              {
                marginHorizontal: layout.horizontalPadding,
                marginTop: DOCTOR_SPACE.xs,
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search-outline" size={17} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search student, project, skill…"
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                color: colors.foreground,
                fontSize: layout.scale(15),
                paddingVertical: 10,
              }}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        ) : null}

        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.requestId)}
          renderItem={({ item }) => (
            <SupervisionRequestListCard request={item} onPress={() => openDetails(item)} />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: DOCTOR_SPACE.sm,
            paddingBottom: layout.space("xxl") + layout.insets.bottom,
            gap: DOCTOR_SPACE.sm,
            flexGrow: filteredRequests.length === 0 ? 1 : undefined,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <SupervisionRequestDetailSheet
          visible={detailVisible}
          request={selectedRequest}
          busy={busyId === selectedRequest?.requestId}
          onClose={() => {
            setDetailVisible(false);
            setSelectedRequest(null);
          }}
          onAccept={(id) => void handleAccept(id)}
          onReject={(id) => void handleReject(id)}
        />
      </DoctorScreen>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    headerAction: {
      width: 36,
      height: 36,
      borderRadius: DOCTOR_RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: DOCTOR_SPACE.xs,
      paddingHorizontal: 12,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
    listHeader: {
      gap: DOCTOR_SPACE.md,
      marginBottom: DOCTOR_SPACE.xs,
    },
    metaBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: DOCTOR_SPACE.sm,
    },
    metaText: {
      color: colors.muted,
      fontWeight: "500",
      flex: 1,
    },
    sortBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 2,
    },
    sortText: {
      fontWeight: "600",
    },
  });
