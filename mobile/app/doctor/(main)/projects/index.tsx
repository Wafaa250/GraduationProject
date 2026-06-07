import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getConversations } from "@/api/conversationsApi";
import { getDoctorDashboardSummary, getDoctorSupervisedProjects } from "@/api/doctorDashboardApi";
import { getDoctorMe } from "@/api/meApi";
import { ActiveProjectListCard } from "@/components/doctor/projects/ActiveProjectListCard";
import { ActiveProjectsEmptyState } from "@/components/doctor/projects/ActiveProjectsEmptyState";
import { ActiveProjectsFilterBar } from "@/components/doctor/projects/ActiveProjectsFilterBar";
import { ActiveProjectsListSkeleton } from "@/components/doctor/projects/ActiveProjectsListSkeleton";
import { ActiveProjectsStatsStrip } from "@/components/doctor/projects/ActiveProjectsStatsStrip";
import { DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  attachTeamChatFlags,
  computeActiveProjectMetrics,
  filterActiveProjectsByStatus,
  mapSupervisedToActiveProject,
  projectFilterCounts,
  type ActiveProjectCardModel,
  type ProjectStatusFilter,
} from "@/lib/doctorActiveProjectUi";
import { doctorProjectChatPath, doctorProjectPath } from "@/lib/doctorRoutes";

export default function DoctorActiveProjectsScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<ActiveProjectCardModel[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all");
  const [summarySupervised, setSummarySupervised] = useState<number | undefined>();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [supervised, summary, conversations, me] = await Promise.all([
        getDoctorSupervisedProjects(),
        getDoctorDashboardSummary(),
        getConversations(),
        getDoctorMe().catch(() => null),
      ]);

      const doctorUserId = me?.userId ?? me?.user?.userId ?? 0;
      const mapped = await Promise.all(supervised.map(mapSupervisedToActiveProject));
      const withChats = attachTeamChatFlags(mapped, conversations, doctorUserId);

      setSummarySupervised(summary.supervisedCount);
      setProjects(withChats);
    } catch (err) {
      Alert.alert("Could not load projects", parseApiErrorMessage(err));
      setProjects([]);
      setSummarySupervised(undefined);
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

  const metrics = useMemo(
    () => computeActiveProjectMetrics(projects, summarySupervised),
    [projects, summarySupervised],
  );
  const filterCounts = useMemo(() => projectFilterCounts(projects), [projects]);
  const filtered = useMemo(
    () => filterActiveProjectsByStatus(projects, statusFilter),
    [projects, statusFilter],
  );

  const listHeader = (
    <View style={styles.listHeader}>
      <ActiveProjectsStatsStrip
        supervised={metrics.supervised}
        teamsComplete={metrics.teamsComplete}
        teamChats={metrics.teamChats}
        loading={loading && projects.length === 0}
      />
      {projects.length > 0 ? (
        <ActiveProjectsFilterBar
          value={statusFilter}
          counts={filterCounts}
          loading={loading && projects.length === 0}
          onChange={setStatusFilter}
        />
      ) : null}
      {projects.length > 0 ? (
        <Text style={[styles.metaText, { fontSize: layout.scale(12) }]}>
          {filtered.length} of {projects.length} projects
        </Text>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (loading && projects.length === 0) {
      return <ActiveProjectsListSkeleton />;
    }

    return (
      <ActiveProjectsEmptyState
        title={projects.length === 0 ? "No active projects" : "No projects in this filter"}
        description={
          projects.length === 0
            ? "Projects will appear here once you accept supervision requests from students."
            : "Try another status filter to see more projects."
        }
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.flex}>
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader
          title="Projects"
          subtitle="Supervised graduation projects"
          variant="compact"
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ActiveProjectListCard
              project={item}
              onOpen={() => router.push(doctorProjectPath(item.id) as Href)}
              onChat={() => router.push(doctorProjectChatPath(item.id) as Href)}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: DOCTOR_SPACE.sm,
            paddingBottom: layout.space("xxl") + layout.insets.bottom,
            gap: DOCTOR_SPACE.sm,
            flexGrow: filtered.length === 0 ? 1 : undefined,
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
          showsVerticalScrollIndicator={false}
        />
      </DoctorScreen>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    listHeader: {
      gap: DOCTOR_SPACE.md,
      marginBottom: DOCTOR_SPACE.xs,
    },
    metaText: {
      color: colors.muted,
      fontWeight: "500",
    },
  });
