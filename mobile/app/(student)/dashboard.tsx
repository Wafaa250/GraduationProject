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

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getDashboardSummary, getStudentAiMatchStatus, type StudentAiMatchStatus } from "@/api/dashboardApi";
import { getFollowing } from "@/api/followingApi";
import { getGraduationProjectsMyEnvelope } from "@/api/gradProjectApi";
import { getMe } from "@/api/meApi";
import {
  acceptTeamInvitation,
  getEligibleTeamInvitations,
  getEnrolledCourses,
  rejectTeamInvitation,
} from "@/api/studentCoursesApi";
import { AiMatchStatusCard } from "@/components/dashboard/AiMatchStatusCard";
import { CoursesAreaCard } from "@/components/dashboard/CoursesAreaCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GraduationProjectCard } from "@/components/dashboard/GraduationProjectCard";
import { StudentInsightsGrid } from "@/components/dashboard/StudentInsightsGrid";
import { TeamInvitationsCard } from "@/components/dashboard/TeamInvitationsCard";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  mapGradProject,
  mapInvitations,
  type GraduationProjectView,
  type InsightMetric,
  type TeamInvitationView,
} from "@/lib/dashboardMappers";
import { getGraduationSectionTitle } from "@/lib/graduationProjectTypes";

export default function StudentDashboardScreen() {
  const layout = useResponsiveLayout();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<InsightMetric[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitationView[]>([]);
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

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setMatchStatusLoading(true);
      const [me, summary, gradEnvelope, teamInvites, enrolled, aiMatch, following] = await Promise.all([
        getMe(),
        getDashboardSummary(),
        getGraduationProjectsMyEnvelope(),
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
      const pendingInvites = teamInvites.length;

      setInsights([
        {
          key: "teammates",
          label: "Suggested Teammates",
          value: String(teammatesCount),
          hint: "AI-matched to your skills",
          icon: "people",
          tint: HUB_COLORS.primarySoft,
          iconColor: HUB_COLORS.primary,
        },
        {
          key: "projects",
          label: "Matched Projects",
          value: String(matchedCount),
          hint: "Open for collaboration",
          icon: "folder",
          tint: "rgba(16, 185, 129, 0.12)",
          iconColor: HUB_COLORS.association,
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
          iconColor: HUB_COLORS.doctor,
        },
      ]);

      setInvitations(mapInvitations(teamInvites));
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
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard(true);
    setRefreshing(false);
  }, [loadDashboard]);

  const handleAccept = async (id: string) => {
    setBusyInviteId(id);
    try {
      await acceptTeamInvitation(Number(id));
      Alert.alert("Invitation accepted", "You joined the team.");
      await loadDashboard(true);
    } catch (err) {
      Alert.alert("Could not accept invitation", parseApiErrorMessage(err));
    } finally {
      setBusyInviteId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setBusyInviteId(id);
    try {
      await rejectTeamInvitation(Number(id));
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
          <ActivityIndicator size="large" color={HUB_COLORS.primary} />
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
            tintColor={HUB_COLORS.primary}
            colors={[HUB_COLORS.primary]}
          />
        }
      >
        <DashboardHeader />
        <StudentInsightsGrid metrics={insights} />
        <TeamInvitationsCard
          invitations={invitations}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: HUB_COLORS.muted,
    fontSize: 14,
  },
});
