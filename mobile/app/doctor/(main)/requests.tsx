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
  acceptSupervisorCancelRequest,
  acceptSupervisorRequest,
  getDoctorSupervisorCancelRequests,
  getDoctorSupervisorRequests,
  rejectSupervisorCancelRequest,
  rejectSupervisorRequest,
  type DoctorSupervisorCancelRequest,
  type DoctorSupervisorRequest,
  type DoctorSupervisorRequestsSummary,
} from "@/api/doctorDashboardApi";
import { CancellationRequestListCard } from "@/components/doctor/supervision/CancellationRequestListCard";
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
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  cancelRequestTabCounts,
  filterCancelRequestsByTab,
  inboxActionKey,
  mergeDoctorRequestRows,
  type DoctorRequestInboxKind,
} from "@/lib/doctorRequestInbox";
import {
  filterSupervisionRequestsByTab,
  searchSupervisionRequests,
  sortSupervisionRequests,
  SORT_OPTIONS,
  supervisionTabCounts,
  type SupervisionRequestSort,
  type SupervisionRequestTab,
} from "@/lib/supervisionRequestUi";

type RequestListEntry =
  | { kind: "supervision"; request: DoctorSupervisorRequest }
  | { kind: "cancellation"; request: DoctorSupervisorCancelRequest };

function listEntryKey(entry: RequestListEntry): string {
  return entry.kind === "supervision"
    ? `supervision-${entry.request.requestId}`
    : `cancellation-${entry.request.requestId}`;
}

function entryMatchesSearch(entry: RequestListEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (entry.kind === "supervision") {
    return searchSupervisionRequests([entry.request], query).length > 0;
  }
  const hay = [entry.request.studentName, entry.request.projectName].join(" ").toLowerCase();
  return hay.includes(q);
}

export default function DoctorSupervisionRequestsScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<DoctorSupervisorRequest[]>([]);
  const [cancelRequests, setCancelRequests] = useState<DoctorSupervisorCancelRequest[]>([]);
  const [activeTab, setActiveTab] = useState<SupervisionRequestTab>("all");
  const [sort, setSort] = useState<SupervisionRequestSort>("newest");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DoctorSupervisorRequest | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [supervisionResult, cancelResult] = await Promise.allSettled([
        getDoctorSupervisorRequests(),
        getDoctorSupervisorCancelRequests(),
      ]);

      const supervisionList =
        supervisionResult.status === "fulfilled" ? supervisionResult.value : [];
      const cancelList = cancelResult.status === "fulfilled" ? cancelResult.value : [];

      if (supervisionResult.status === "rejected" && cancelResult.status === "rejected") {
        throw supervisionResult.reason;
      }

      if (supervisionResult.status === "rejected") {
        Alert.alert(
          "Could not load supervision requests",
          parseApiErrorMessage(supervisionResult.reason),
        );
      }

      if (cancelResult.status === "rejected") {
        Alert.alert(
          "Could not load cancellation requests",
          parseApiErrorMessage(cancelResult.reason),
        );
      }

      setRequests(supervisionList);
      setCancelRequests(cancelList);
    } catch (err) {
      Alert.alert("Could not load requests", parseApiErrorMessage(err));
      setRequests([]);
      setCancelRequests([]);
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

  const supervisionCounts = useMemo(() => supervisionTabCounts(requests), [requests]);
  const cancelCounts = useMemo(() => cancelRequestTabCounts(cancelRequests), [cancelRequests]);

  const summary = useMemo<DoctorSupervisorRequestsSummary>(
    () => ({
      pendingCount: supervisionCounts.pending + cancelCounts.pending,
      acceptedCount: supervisionCounts.accepted + cancelCounts.accepted,
      rejectedCount: supervisionCounts.rejected + cancelCounts.rejected,
      totalCount: supervisionCounts.all + cancelCounts.all,
    }),
    [supervisionCounts, cancelCounts],
  );

  const tabCounts = useMemo(
    () => ({
      all: supervisionCounts.all + cancelCounts.all,
      pending: mergeDoctorRequestRows(requests, cancelRequests).length,
      accepted: supervisionCounts.accepted + cancelCounts.accepted,
      rejected: supervisionCounts.rejected + cancelCounts.rejected,
    }),
    [requests, cancelRequests, supervisionCounts, cancelCounts],
  );

  const filteredEntries = useMemo((): RequestListEntry[] => {
    let entries: RequestListEntry[];

    if (activeTab === "pending") {
      const merged = mergeDoctorRequestRows(requests, cancelRequests);
      const supervisionById = new Map(requests.map((r) => [r.requestId, r]));
      const cancelById = new Map(cancelRequests.map((r) => [r.requestId, r]));

      entries = merged.flatMap((row): RequestListEntry[] => {
        if (row.kind === "supervision") {
          const request = supervisionById.get(row.requestId);
          return request ? [{ kind: "supervision", request }] : [];
        }
        const request = cancelById.get(row.requestId);
        return request ? [{ kind: "cancellation", request }] : [];
      });
    } else {
      const supervisionFiltered = filterSupervisionRequestsByTab(requests, activeTab);
      const cancelFiltered = filterCancelRequestsByTab(cancelRequests, activeTab);

      entries = [
        ...supervisionFiltered.map(
          (request): RequestListEntry => ({ kind: "supervision", request }),
        ),
        ...cancelFiltered.map(
          (request): RequestListEntry => ({ kind: "cancellation", request }),
        ),
      ].sort((a, b) => b.request.requestId - a.request.requestId);
    }

    if (searchQuery.trim()) {
      entries = entries.filter((entry) => entryMatchesSearch(entry, searchQuery));
    }

    if (activeTab !== "pending" && sort !== "newest") {
      const supervisionOnly = entries.filter(
        (e): e is { kind: "supervision"; request: DoctorSupervisorRequest } =>
          e.kind === "supervision",
      );
      const cancellations = entries.filter((e) => e.kind === "cancellation");
      const sortedSupervision = sortSupervisionRequests(
        supervisionOnly.map((e) => e.request),
        sort,
      ).map((request): RequestListEntry => ({ kind: "supervision", request }));
      return [...sortedSupervision, ...cancellations].sort(
        (a, b) => b.request.requestId - a.request.requestId,
      );
    }

    return entries;
  }, [requests, cancelRequests, activeTab, searchQuery, sort]);

  const totalVisibleCount = requests.length + cancelRequests.length;
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

  const runAction = async (
    kind: DoctorRequestInboxKind,
    requestId: number,
    action: "accept" | "reject",
  ) => {
    const key = inboxActionKey(kind, requestId, action);
    setBusyKey(key);
    try {
      if (kind === "supervision") {
        if (action === "accept") {
          await acceptSupervisorRequest(requestId);
          Alert.alert("Request accepted", "The project is now in Active Projects.");
        } else {
          await rejectSupervisorRequest(requestId);
          Alert.alert("Request rejected");
        }
        setDetailVisible(false);
        setSelectedRequest(null);
      } else if (action === "accept") {
        await acceptSupervisorCancelRequest(requestId);
        Alert.alert("Cancellation accepted", "Supervision has been removed for this project.");
      } else {
        await rejectSupervisorCancelRequest(requestId);
        Alert.alert("Cancellation rejected");
      }
      await load(true);
    } catch (err) {
      Alert.alert("Action failed", parseApiErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const isEntryBusy = (entry: RequestListEntry) =>
    busyKey === inboxActionKey(entry.kind, entry.request.requestId, "accept") ||
    busyKey === inboxActionKey(entry.kind, entry.request.requestId, "reject");

  const openDetails = (request: DoctorSupervisorRequest) => {
    setSelectedRequest(request);
    setDetailVisible(true);
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <SupervisionRequestsStatsStrip summary={summary} loading={loading && totalVisibleCount === 0} />

      <SupervisionRequestsFilterBar
        value={activeTab}
        counts={tabCounts}
        loading={loading && totalVisibleCount === 0}
        onChange={setActiveTab}
      />

      <View style={styles.metaBar}>
        <Text style={[styles.metaText, { fontSize: layout.scale(12) }]}>
          {filteredEntries.length} of {totalVisibleCount} requests
        </Text>
        {activeTab !== "pending" ? (
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
        ) : (
          <Text style={[styles.sortText, { color: colors.muted, fontSize: layout.scale(11) }]}>
            Supervision before cancellation
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading && totalVisibleCount === 0) {
      return <SupervisionRequestsListSkeleton />;
    }

    return (
      <SupervisionRequestsEmptyState
        title={
          searchQuery.trim()
            ? "No matches found"
            : totalVisibleCount === 0
              ? "No supervision requests available"
              : "No requests in this filter"
        }
        description={
          searchQuery.trim()
            ? "Try a different student name, project title, or skill keyword."
            : totalVisibleCount === 0
              ? "When students submit supervision or cancellation requests, they will appear here."
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
          subtitle="Review supervision and cancellation requests"
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
          data={filteredEntries}
          keyExtractor={listEntryKey}
          renderItem={({ item }) =>
            item.kind === "supervision" ? (
              <SupervisionRequestListCard
                request={item.request}
                onPress={() => openDetails(item.request)}
              />
            ) : (
              <CancellationRequestListCard
                request={item.request}
                busy={isEntryBusy(item)}
                onAccept={(id) => void runAction("cancellation", id, "accept")}
                onReject={(id) => void runAction("cancellation", id, "reject")}
              />
            )
          }
          ListHeaderComponent={listHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: DOCTOR_SPACE.sm,
            paddingBottom: layout.space("xxl") + layout.insets.bottom,
            gap: DOCTOR_SPACE.sm,
            flexGrow: filteredEntries.length === 0 ? 1 : undefined,
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
          busy={
            selectedRequest != null &&
            (busyKey === inboxActionKey("supervision", selectedRequest.requestId, "accept") ||
              busyKey === inboxActionKey("supervision", selectedRequest.requestId, "reject"))
          }
          onClose={() => {
            setDetailVisible(false);
            setSelectedRequest(null);
          }}
          onAccept={(id) => void runAction("supervision", id, "accept")}
          onReject={(id) => void runAction("supervision", id, "reject")}
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
