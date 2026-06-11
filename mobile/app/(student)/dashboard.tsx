import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getDashboardSummary, getStudentAiMatchStatus, type StudentAiMatchStatus } from "@/api/dashboardApi";
import { getFollowing } from "@/api/followingApi";
import { getGraduationProjectsMyEnvelope } from "@/api/gradProjectApi";
import {
  acceptInvitation,
  getReceivedInvitations,
  rejectInvitation,
  type ReceivedProjectInvitation,
} from "@/api/invitationsApi";
import { getMe } from "@/api/meApi";
import {
  acceptTeamInvitation,
  getEligibleTeamInvitations,
  getEnrolledCourses,
  rejectTeamInvitation,
  type TeamInvitationItem,
} from "@/api/studentCoursesApi";
import { AiMatchStatusCard } from "@/components/dashboard/AiMatchStatusCard";
import { CoursesAreaCard } from "@/components/dashboard/CoursesAreaCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GraduationProjectCard } from "@/components/dashboard/GraduationProjectCard";
import { StudentInsightsGrid } from "@/components/dashboard/StudentInsightsGrid";
import { TeamInvitationsCard } from "@/components/dashboard/TeamInvitationsCard";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  mapCourseInvitations,
  mapGradProject,
  mapGraduationInvitations,
  parseInvitationId,
  type GraduationProjectView,
  type InsightMetric,
  type TeamInvitationView,
} from "@/lib/dashboardMappers";
import { getGraduationSectionTitle } from "@/lib/graduationProjectTypes";

export default function StudentDashboardScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<InsightMetric[]>([]);
  const [gradProject, setGradProject] = useState<GraduationProjectView | null>(null);
  const [gradSectionTitle, setGradSectionTitle] = useState("Graduation Project");
  const [gradCourseLabels, setGradCourseLabels] = useState<string[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [partnerActivity, setPartnerActivity] = useState(0);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<StudentAiMatchStatus | null>(null);
  const [matchStatusLoading, setMatchStatusLoading] = useState(true);
  const [followingCompanyCount, setFollowingCompanyCount] = useState(0);
  const [followingAssociationCount, setFollowingAssociationCount] = useState(0);
  const [gradInvitations, setGradInvitations] = useState<ReceivedProjectInvitation[]>([]);
  const [courseInvitations, setCourseInvitations] = useState<TeamInvitationItem[]>([]);

  const refreshGradProjectState = useCallback(async () => {
    const [me, gradEnvelope] = await Promise.all([getMe(), getGraduationProjectsMyEnvelope()]);
    setGradSectionTitle(getGraduationSectionTitle(me.faculty, me.major));
    setGradCourseLabels(me.graduationProjectCourses ?? []);
    setGradProject(
      gradEnvelope.project ? mapGradProject(gradEnvelope.project, me.faculty, me.major) : null,
    );
  }, []);

  const mergedInvitations = useMemo(
    () => [...mapGraduationInvitations(gradInvitations), ...mapCourseInvitations(courseInvitations)],
    [gradInvitations, courseInvitations],
  );

  const fetchGraduationInvitations = useCallback(async () => {
    try {
      const received = await getReceivedInvitations();
      const pendingOnly = received.filter((i) => i.status?.toLowerCase() === "pending");
      setGradInvitations(pendingOnly);
      return pendingOnly;
    } catch {
      return null;
    }
  }, []);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setMatchStatusLoading(true);
      const [me, summary, gradEnvelope, receivedInvites, teamInvites, enrolled, aiMatch, following] =
        await Promise.all([
          getMe(),
          getDashboardSummary(),
          getGraduationProjectsMyEnvelope(),
          getReceivedInvitations().catch(() => [] as ReceivedProjectInvitation[]),
          getEligibleTeamInvitations(),
          getEnrolledCourses(),
          getStudentAiMatchStatus().catch(() => null),
          getFollowing().catch(() => ({ companies: [], associations: [] })),
        ]);

      const teammatesCount =
        summary.suggestedTeammatesCount ?? summary.suggestedTeammates?.length ?? 0;
      const matchedCount = summary.matchedGraduationProjectsCount ?? 0;
      const bestMatch =
        summary.bestTeammateMatchPercent ??
        (summary.suggestedTeammates?.[0]?.matchScore != null
          ? summary.suggestedTeammates[0].matchScore
          : null);
      const pendingGradInvites = receivedInvites.filter(
        (i) => i.status?.toLowerCase() === "pending",
      );
      const pendingInvites = pendingGradInvites.length + teamInvites.length;

      setInsights([
        {
          key: "teammates",
          label: "Suggested Teammates",
          value: String(teammatesCount),
          hint: "AI-matched to your skills",
          icon: "people",
          tint: colors.primarySoft,
          iconColor: colors.primary,
        },
        {
          key: "projects",
          label: "Matched Projects",
          value: String(matchedCount),
          hint: "Open for collaboration",
          icon: "folder",
          tint: "rgba(16, 185, 129, 0.12)",
          iconColor: colors.association,
        },
        {
          key: "match",
          label: "Best Match",
          value: bestMatch != null ? `${bestMatch}%` : "—",
          hint: "Top project fit",
          icon: "sparkles",
          tint: "rgba(168, 85, 247, 0.12)",
          iconColor: "#A855F7",
        },
        {
          key: "invites",
          label: "Team Invitations",
          value: String(pendingInvites),
          hint: "Awaiting your reply",
          icon: "mail",
          tint: "rgba(14, 165, 233, 0.12)",
          iconColor: colors.doctor,
        },
      ]);

      setGradInvitations(pendingGradInvites);
      setCourseInvitations(teamInvites);
      setGradSectionTitle(getGraduationSectionTitle(me.faculty, me.major));
      setGradCourseLabels(me.graduationProjectCourses ?? []);
      setGradProject(
        gradEnvelope.project ? mapGradProject(gradEnvelope.project, me.faculty, me.major) : null,
      );
      setEnrolledCount(enrolled.length);
      setPartnerActivity(teammatesCount);
      setMatchStatus(aiMatch);
      setFollowingCompanyCount(following.companies.length);
      setFollowingAssociationCount(following.associations.length);
    } catch (err) {
      Alert.alert("Could not load dashboard", parseApiErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
      setMatchStatusLoading(false);
    }
  }, [colors]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      void fetchGraduationInvitations();
      void refreshGradProjectState();
    }, [fetchGraduationInvitations, refreshGradProjectState]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void fetchGraduationInvitations();
      }
    });
    return () => subscription.remove();
  }, [fetchGraduationInvitations]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchGraduationInvitations();
    }, 10_000);
    return () => clearInterval(interval);
  }, [fetchGraduationInvitations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard(true);
    setRefreshing(false);
  }, [loadDashboard]);

  const handleAccept = async (id: string) => {
    const parsed = parseInvitationId(id);
    if (!parsed) return;
    setBusyInviteId(id);
    try {
      if (parsed.source === "graduation") {
        await acceptInvitation(parsed.invitationId);
        setGradInvitations((prev) =>
          prev.filter((inv) => inv.invitationId !== parsed.invitationId),
        );
        Alert.alert("Invitation accepted", "You joined the graduation project team.");
        await refreshGradProjectState();
      } else {
        await acceptTeamInvitation(parsed.invitationId);
        setCourseInvitations((prev) =>
          prev.filter((inv) => inv.invitationId !== parsed.invitationId),
        );
        Alert.alert("Invitation accepted", "You joined the team.");
      }
      await loadDashboard(true);
    } catch (err) {
      Alert.alert("Could not accept invitation", parseApiErrorMessage(err));
    } finally {
      setBusyInviteId(null);
    }
  };

  const handleDecline = async (id: string) => {
    const parsed = parseInvitationId(id);
    if (!parsed) return;
    setBusyInviteId(id);
    try {
      if (parsed.source === "graduation") {
        await rejectInvitation(parsed.invitationId);
        setGradInvitations((prev) =>
          prev.filter((inv) => inv.invitationId !== parsed.invitationId),
        );
      } else {
        await rejectTeamInvitation(parsed.invitationId);
        setCourseInvitations((prev) =>
          prev.filter((inv) => inv.invitationId !== parsed.invitationId),
        );
      }
      Alert.alert("Invitation declined");
      await loadDashboard(true);
    } catch (err) {
      Alert.alert("Could not decline invitation", parseApiErrorMessage(err));
    } finally {
      setBusyInviteId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: layout.space("md"),
          paddingBottom: layout.space("xl"),
          maxWidth: layout.maxContentWidth,
          width: "100%",
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <DashboardHeader />
        <StudentInsightsGrid metrics={insights} />
        <TeamInvitationsCard
          invitations={mergedInvitations}
          busyId={busyInviteId}
          onAccept={(id) => void handleAccept(id)}
          onDecline={(id) => void handleDecline(id)}
        />
        <GraduationProjectCard
          project={gradProject}
          sectionTitle={gradSectionTitle}
          courseLabels={gradCourseLabels}
        />
        <CoursesAreaCard enrolled={enrolledCount} partners={partnerActivity} />
        <AiMatchStatusCard
          status={matchStatus}
          loading={matchStatusLoading}
          followingCompanyCount={followingCompanyCount}
          followingAssociationCount={followingAssociationCount}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    loadingText: {
      color: colors.muted,
      fontSize: 14,
    },
  });
