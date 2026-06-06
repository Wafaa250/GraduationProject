import { router, type Href } from "expo-router";
import { BookOpen, ClipboardList, FolderKanban } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getConversations, sumConversationUnseen } from "@/api/conversationsApi";
import { getDoctorCoursesWithStats, type DoctorCourseWithStats } from "@/api/doctorCoursesApi";
import {
  acceptSupervisorRequest,
  getDoctorDashboardSummary,
  getDoctorSupervisedProjects,
  getDoctorSupervisorRequests,
  rejectSupervisorRequest,
  type DoctorDashboardSummary,
  type DoctorSupervisedProject,
  type DoctorSupervisorRequest,
} from "@/api/doctorDashboardApi";
import { getDoctorMe } from "@/api/meApi";
import { createDoctorHomeStyles } from "@/components/doctor/home/doctorHomeStyles";
import { DoctorHomeAnnouncements } from "@/components/doctor/home/DoctorHomeAnnouncements";
import { DoctorHomeCourseRow } from "@/components/doctor/home/DoctorHomeCourseRow";
import { DoctorHomeEmptyState } from "@/components/doctor/home/DoctorHomeEmptyState";
import { DoctorHomeHeader } from "@/components/doctor/home/DoctorHomeHeader";
import { DoctorHomeProjectRow } from "@/components/doctor/home/DoctorHomeProjectRow";
import { DoctorHomeRequestCard } from "@/components/doctor/home/DoctorHomeRequestCard";
import { DoctorHomeSection } from "@/components/doctor/home/DoctorHomeSection";
import { DoctorHomeSkeleton } from "@/components/doctor/home/DoctorHomeSkeleton";
import { DoctorHomeStatsStrip } from "@/components/doctor/home/DoctorHomeStatsStrip";
import { DoctorShareAnnouncementSheet } from "@/components/doctor/DoctorShareAnnouncementSheet";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import {
  countUniqueSupervisedStudents,
  mapCourseToCard,
  mapDoctorMeToHeaderProfile,
  mapSupervisedProjectToCard,
  mapSupervisorRequestToCard,
} from "@/lib/doctorHubMappers";
import { DOCTOR_ROUTES, type DoctorMetricKey } from "@/lib/doctorRoutes";

/** Dashboard shows a quick preview only — full lists live on dedicated tab screens. */
const DASHBOARD_PREVIEW_LIMITS = {
  requests: 3,
  courses: 3,
  projects: 3,
} as const;

export default function DoctorDashboardScreen() {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createDoctorHomeStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcementsRefreshKey, setAnnouncementsRefreshKey] = useState(0);
  const [summary, setSummary] = useState<DoctorDashboardSummary | null>(null);
  const [requests, setRequests] = useState<DoctorSupervisorRequest[]>([]);
  const [projects, setProjects] = useState<DoctorSupervisedProject[]>([]);
  const [courses, setCourses] = useState<DoctorCourseWithStats[]>([]);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("Doctor");
  const [greetingName, setGreetingName] = useState("Doctor");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const openCompose = useCallback(() => setComposeOpen(true), []);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [summaryRes, requestsRes, projectsRes, coursesRes, conversationsRes, meRes] =
        await Promise.all([
          getDoctorDashboardSummary(),
          getDoctorSupervisorRequests(),
          getDoctorSupervisedProjects(),
          getDoctorCoursesWithStats(),
          getConversations(),
          getDoctorMe(),
        ]);

      const profile = mapDoctorMeToHeaderProfile(meRes);
      setSummary(summaryRes);
      setRequests(requestsRes);
      setProjects(projectsRes);
      setCourses(coursesRes);
      setMessagesUnread(sumConversationUnseen(conversationsRes));
      setProfileName(profile.displayName);
      setGreetingName(profile.greetingName);
      setProfilePhoto(profile.profilePhoto);
      setAnnouncementsRefreshKey((k) => k + 1);
    } catch (err) {
      Alert.alert("Could not load dashboard", parseApiErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
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

  const metricValues = useMemo(
    (): Record<DoctorMetricKey, number> => ({
      pending: summary?.pendingRequestsCount ?? 0,
      active: summary?.supervisedCount ?? 0,
      courses: courses.length,
      students: countUniqueSupervisedStudents(projects),
      messages: messagesUnread,
    }),
    [summary, courses.length, projects, messagesUnread],
  );

  const requestCards = useMemo(() => requests.map(mapSupervisorRequestToCard), [requests]);
  const projectCards = useMemo(() => projects.map(mapSupervisedProjectToCard), [projects]);
  const courseCards = useMemo(() => courses.map((c, i) => mapCourseToCard(c, i)), [courses]);

  const handleAccept = async (requestId: number) => {
    setBusyRequestId(requestId);
    try {
      await acceptSupervisorRequest(requestId);
      Alert.alert("Request accepted", "The project is now in Active Projects.");
      await loadDashboard(true);
    } catch (err) {
      Alert.alert("Accept failed", parseApiErrorMessage(err));
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setBusyRequestId(requestId);
    try {
      await rejectSupervisorRequest(requestId);
      Alert.alert("Request rejected");
      await loadDashboard(true);
    } catch (err) {
      Alert.alert("Reject failed", parseApiErrorMessage(err));
    } finally {
      setBusyRequestId(null);
    }
  };

  const pendingCancel = summary?.pendingCancelCount ?? 0;
  const pendingCount = summary?.pendingRequestsCount ?? 0;
  const activeCount = summary?.supervisedCount ?? 0;
  const previewRequests = requestCards.slice(0, DASHBOARD_PREVIEW_LIMITS.requests);
  const previewCourses = courseCards.slice(0, DASHBOARD_PREVIEW_LIMITS.courses);
  const previewProjects = projectCards.slice(0, DASHBOARD_PREVIEW_LIMITS.projects);

  if (loading) {
    return (
      <DoctorScreen edges={["top"]}>
        <View style={styles.scroll}>
          <DoctorHomeSkeleton />
        </View>
      </DoctorScreen>
    );
  }

  return (
    <DoctorScreen edges={["top"]}>
      <ScrollView
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
        <View style={styles.scroll}>
          <DoctorHomeHeader
            displayName={profileName}
            greetingName={greetingName}
            profilePhoto={profilePhoto}
            pendingCount={pendingCount}
            activeCount={activeCount}
            unreadMessages={messagesUnread}
            onComposePress={openCompose}
          />

          {pendingCancel > 0 ? (
            <Pressable onPress={() => router.push(DOCTOR_ROUTES.requests as Href)} style={styles.alertBanner}>
              <Text style={styles.alertText}>
                <Text style={styles.alertBold}>{pendingCancel}</Text> cancellation request
                {pendingCancel === 1 ? "" : "s"} need review
              </Text>
              <Text style={styles.alertAction}>Review</Text>
            </Pressable>
          ) : null}
        </View>

        <DoctorHomeStatsStrip values={metricValues} />

        <View style={styles.scroll}>
          <DoctorHomeSection
            title="Supervision Requests"
            subtitle="Review and respond to student teams"
            icon={ClipboardList}
            iconColor={colors.primary}
            count={pendingCount}
            onSeeAll={() => router.push(DOCTOR_ROUTES.requests as Href)}
          >
            {previewRequests.length > 0 ? (
              <View style={[styles.card, styles.cardShadow]}>
                {previewRequests.map((request, index) => (
                  <DoctorHomeRequestCard
                    key={request.id}
                    request={request}
                    busy={busyRequestId === request.requestId}
                    onAccept={(id) => void handleAccept(id)}
                    onReject={(id) => void handleReject(id)}
                    showDivider={index > 0}
                  />
                ))}
              </View>
            ) : (
              <DoctorHomeEmptyState
                icon={ClipboardList}
                title="No supervision requests"
                description="When students request you as a supervisor, they'll appear here for review."
                actionLabel="View all requests"
                onAction={() => router.push(DOCTOR_ROUTES.requests as Href)}
              />
            )}
          </DoctorHomeSection>

          <DoctorHomeSection
            title="My Courses"
            subtitle="Courses you're teaching this term"
            icon={BookOpen}
            iconColor="#A855F7"
            iconBg="rgba(168, 85, 247, 0.12)"
            count={courses.length}
            seeAllLabel="Manage"
            onSeeAll={() => router.push(DOCTOR_ROUTES.courses as Href)}
          >
            {previewCourses.length > 0 ? (
              <View style={[styles.card, styles.cardShadow]}>
                {previewCourses.map((course, index) => (
                  <DoctorHomeCourseRow key={course.courseId} course={course} showDivider={index > 0} />
                ))}
              </View>
            ) : (
              <DoctorHomeEmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Your assigned courses will show up here with section and student stats."
                actionLabel="Browse courses"
                onAction={() => router.push(DOCTOR_ROUTES.courses as Href)}
              />
            )}
          </DoctorHomeSection>

          <DoctorHomeSection
            title="Active Projects"
            subtitle="Graduation projects under your supervision"
            icon={FolderKanban}
            iconColor={colors.doctor}
            iconBg={colors.roleBg.doctor}
            count={activeCount}
            onSeeAll={() => router.push(DOCTOR_ROUTES.projects as Href)}
          >
            {previewProjects.length > 0 ? (
              <View style={[styles.card, styles.cardShadow]}>
                {previewProjects.map((project, index) => (
                  <DoctorHomeProjectRow key={project.id} project={project} showDivider={index > 0} />
                ))}
              </View>
            ) : (
              <DoctorHomeEmptyState
                icon={FolderKanban}
                title="No active projects"
                description="Accepted supervision requests will move here as active graduation projects."
                actionLabel="View projects"
                onAction={() => router.push(DOCTOR_ROUTES.projects as Href)}
              />
            )}
          </DoctorHomeSection>

          <DoctorHomeAnnouncements refreshKey={announcementsRefreshKey} />
        </View>
      </ScrollView>

      <DoctorShareAnnouncementSheet
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPublished={() => setAnnouncementsRefreshKey((k) => k + 1)}
      />
    </DoctorScreen>
  );
}
