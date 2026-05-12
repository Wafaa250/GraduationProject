import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import api, { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  acceptPartnerRequest,
  acceptTeamInvitation,
  fetchSectionChatMessages,
  fetchStudentCourseProjects,
  getCourseById,
  getCoursePartnerRequests,
  getCourseStudents,
  getTeamInvitations,
  postSectionChatMessage,
  rejectPartnerRequest,
  rejectTeamInvitation,
  type AcceptTeamInvitationResponse,
  type CourseDetails,
  type CourseStudent,
  type PartnerRequest,
  type SectionChatMessageDto,
  type StudentCourseProject,
  type TeamInvitationItem,
} from "@/api/studentCoursesApi";
import { markChatScopeRead } from "@/api/notificationsApi";
import { fetchMyCourseTeam, type MyCourseTeamResponse } from "@/api/studentTeamApi";
import { normApiStatus } from "@/components/student-dashboard/courseTeamsHelpers";
import { subscribeInboxNotificationCreated } from "@/lib/notificationsHubInbox";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  asText,
  computeIsDoctorAssignedProject,
  formatSectionSchedule,
  getAuthUserIdFromMe,
  getCourseStudentProfileId,
  getStudentProfileIdFromUser,
} from "@/utils/courseStudentUi";
import type { CourseSection } from "@/api/doctorCoursesApi";

type CourseTab = "section" | "teams" | "projects" | "chat";

type CourseBundle = {
  detail: CourseDetails;
  roster: CourseStudent[];
};

function pickNumericParam(v: string | string[] | undefined): number | null {
  if (v == null) return null;
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickTab(v: string | string[] | undefined): CourseTab {
  const s = (Array.isArray(v) ? v[0] : v)?.trim().toLowerCase();
  if (s === "chat" || s === "projects" || s === "teams" || s === "section") return s;
  return "section";
}

function hubPayloadShouldRefreshCourseTeamInvites(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as { category?: string; eventType?: string };
  const cat = String(p.category ?? "")
    .trim()
    .toLowerCase();
  const ev = String(p.eventType ?? "")
    .trim()
    .toLowerCase();
  if (cat !== "course") return false;
  return ev.includes("teammate") && ev.includes("invitation");
}

function formatInviteAt(iso: string): string | null {
  if (!iso || typeof iso !== "string" || iso.trim() === "") return null;
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso.trim();
  }
}

function isCourseTeamInvitePending(i: TeamInvitationItem): boolean {
  const raw = i.status;
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) return true;
  return normApiStatus(raw) === "pending";
}

export default function CourseDetailRoute() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId: string | string[]; tab?: string | string[] }>();
  const courseId = pickNumericParam(params.courseId);
  const { horizontalPadding, maxDashboardWidth } = useResponsiveLayout();

  const [user, setUser] = useState<unknown>(null);
  const [bundle, setBundle] = useState<CourseBundle | null>(null);
  const [allProjects, setAllProjects] = useState<StudentCourseProject[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<CourseTab>(() => pickTab(params.tab));

  const [messages, setMessages] = useState<SectionChatMessageDto[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSending, setChatSending] = useState(false);
  const [input, setInput] = useState("");

  const [teamInvites, setTeamInvites] = useState<TeamInvitationItem[]>([]);
  const [teamsInvitesLoading, setTeamsInvitesLoading] = useState(false);
  const [teamInvitesError, setTeamInvitesError] = useState<string | null>(null);
  const [teamInvitesHasLoaded, setTeamInvitesHasLoaded] = useState(false);
  const [partnerReq, setPartnerReq] = useState<{ incoming: PartnerRequest[]; outgoing: PartnerRequest[] } | null>(
    null,
  );
  const [teamsPartnersLoading, setTeamsPartnersLoading] = useState(false);
  const [projectTeams, setProjectTeams] = useState<Record<number, MyCourseTeamResponse | null>>({});
  const [projectTeamsLoading, setProjectTeamsLoading] = useState(false);

  const [inviteBusyId, setInviteBusyId] = useState<number | null>(null);
  const [inviteStatusById, setInviteStatusById] = useState<Record<number, "accepted" | "rejected">>({});
  const [acceptInviteResult, setAcceptInviteResult] = useState<Record<number, AcceptTeamInvitationResponse>>({});

  const [partnerBusyKey, setPartnerBusyKey] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const loadTeamsDataRef = useRef<(() => Promise<void>) | null>(null);

  const pad = horizontalPadding;
  const colMax = maxDashboardWidth;

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/courses" as Href);
  }, [router]);

  useEffect(() => {
    setActiveTab(pickTab(params.tab));
  }, [params.tab]);

  const loadDetail = useCallback(async () => {
    if (courseId == null) return;
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const [meRes, detail, roster, projects] = await Promise.all([
        api.get<unknown>("/me"),
        getCourseById(courseId),
        getCourseStudents(courseId),
        fetchStudentCourseProjects(courseId),
      ]);
      setUser(meRes.data);
      setBundle({ detail, roster });
      setAllProjects(projects);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) setDetailsError("This course is no longer available.");
      else if (status === 403) setDetailsError("You do not have permission to view this course.");
      else setDetailsError("We could not load this course right now. Please try again.");
      setBundle(null);
      setAllProjects([]);
    } finally {
      setDetailsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId == null) return;
    void loadDetail();
  }, [courseId, loadDetail]);

  const myStudent = useMemo(() => {
    if (!bundle) return null;
    const pid = getStudentProfileIdFromUser(user);
    if (pid == null) return null;
    return bundle.roster.find((s) => getCourseStudentProfileId(s) === pid) ?? null;
  }, [bundle, user]);

  const mySectionId = useMemo(() => {
    if (!myStudent) return null;
    return myStudent.sectionId ?? myStudent.SectionId ?? null;
  }, [myStudent]);

  const mySection = useMemo((): CourseSection | null => {
    if (!bundle || mySectionId == null) return null;
    const sections = bundle.detail.sections ?? [];
    return sections.find((s) => s.id === mySectionId) ?? null;
  }, [bundle, mySectionId]);

  const courseStudents = useMemo(() => bundle?.roster ?? [], [bundle]);

  const mySectionProjects = useMemo((): StudentCourseProject[] => {
    if (allProjects.length === 0) return [];
    if (mySectionId == null) return allProjects.filter((p) => p.applyToAllSections);
    return allProjects.filter(
      (p) => p.applyToAllSections || p.sections.some((s) => s.sectionId === mySectionId),
    );
  }, [allProjects, mySectionId]);

  const mySectionStudents = useMemo(() => {
    if (!bundle) return [];
    if (mySectionId == null) return courseStudents;
    return courseStudents.filter((s) => {
      const sid = s.sectionId ?? s.SectionId ?? null;
      return sid === mySectionId;
    });
  }, [bundle, courseStudents, mySectionId]);

  const currentSectionId = mySectionId;

  const authUserId = useMemo(() => getAuthUserIdFromMe(user), [user]);

  const fetchChat = useCallback(async (sectionId: number) => {
    setChatLoading(true);
    setChatError(null);
    try {
      const rows = await fetchSectionChatMessages(sectionId, 100);
      setMessages(rows);
      await markChatScopeRead(`section:${sectionId}`);
    } catch (err) {
      setChatError(parseApiErrorMessage(err));
    } finally {
      setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "chat" || currentSectionId == null) return;
    void fetchChat(currentSectionId);
  }, [activeTab, currentSectionId, fetchChat]);

  const loadTeamsData = useCallback(async () => {
    if (courseId == null) return;
    setTeamsInvitesLoading(true);
    setTeamsPartnersLoading(true);
    setTeamInvitesError(null);
    try {
      const settled = await Promise.allSettled([
        getTeamInvitations(),
        getCoursePartnerRequests(courseId),
      ]);
      const invRes = settled[0];
      const prRes = settled[1];
      if (invRes.status === "fulfilled") {
        setTeamInvites(invRes.value);
      } else {
        setTeamInvites([]);
        setTeamInvitesError(parseApiErrorMessage(invRes.reason));
      }
      if (prRes.status === "fulfilled") {
        setPartnerReq(prRes.value);
      } else {
        setPartnerReq(null);
      }
    } finally {
      setTeamsInvitesLoading(false);
      setTeamsPartnersLoading(false);
      setTeamInvitesHasLoaded(true);
    }

    const withTeam = mySectionProjects.filter((p) => p.hasTeam);
    if (withTeam.length === 0) {
      setProjectTeams({});
      return;
    }
    setProjectTeamsLoading(true);
    try {
      const entries = await Promise.all(
        withTeam.map(async (p) => {
          try {
            const t = await fetchMyCourseTeam(p.id);
            return [p.id, t] as const;
          } catch {
            return [p.id, null] as const;
          }
        }),
      );
      setProjectTeams(Object.fromEntries(entries));
    } finally {
      setProjectTeamsLoading(false);
    }
  }, [courseId, mySectionProjects]);

  loadTeamsDataRef.current = loadTeamsData;

  useFocusEffect(
    useCallback(() => {
      if (courseId == null || activeTab !== "teams") return undefined;
      void loadTeamsData();
      return undefined;
    }, [activeTab, courseId, loadTeamsData]),
  );

  useEffect(() => {
    if (activeTab !== "teams" || courseId == null) return;
    void loadTeamsData();
  }, [activeTab, courseId, loadTeamsData]);

  useEffect(() => {
    return subscribeInboxNotificationCreated((payload: unknown) => {
      if (!hubPayloadShouldRefreshCourseTeamInvites(payload)) return;
      if (courseId == null) return;
      void loadTeamsDataRef.current?.();
    });
  }, [courseId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || currentSectionId == null || chatSending) return;
    setInput("");
    setChatSending(true);
    try {
      const created = await postSectionChatMessage(currentSectionId, text);
      setMessages((prev) => [...prev, created]);
    } catch (err) {
      setChatError(parseApiErrorMessage(err));
      setInput(text);
    } finally {
      setChatSending(false);
    }
  }, [chatSending, currentSectionId, input]);

  const handleAcceptInvite = useCallback(
    async (id: number) => {
      setInviteBusyId(id);
      try {
        const res = await acceptTeamInvitation(id);
        setAcceptInviteResult((prev) => ({ ...prev, [id]: res }));
        setInviteStatusById((prev) => ({ ...prev, [id]: "accepted" }));
        await loadTeamsData();
        Alert.alert("Invitation accepted", "You joined the team.");
      } catch (err) {
        setActionBanner(parseApiErrorMessage(err));
      } finally {
        setInviteBusyId(null);
      }
    },
    [loadTeamsData],
  );

  const handleRejectInvite = useCallback(
    async (id: number) => {
      setInviteBusyId(id);
      try {
        const res = await rejectTeamInvitation(id);
        setInviteStatusById((prev) => ({ ...prev, [id]: "rejected" }));
        await loadTeamsData();
        Alert.alert("Invitation declined", res.message?.trim() ? res.message : "You declined the invitation.");
      } catch (err) {
        setActionBanner(parseApiErrorMessage(err));
      } finally {
        setInviteBusyId(null);
      }
    },
    [loadTeamsData],
  );

  const handleAcceptPartner = useCallback(
    async (requestId: number) => {
      if (courseId == null) return;
      setPartnerBusyKey(`in-${requestId}`);
      try {
        await acceptPartnerRequest(courseId, requestId);
        await loadTeamsData();
      } catch (err) {
        setActionBanner(parseApiErrorMessage(err));
      } finally {
        setPartnerBusyKey(null);
      }
    },
    [courseId, loadTeamsData],
  );

  const handleRejectPartner = useCallback(
    async (requestId: number) => {
      if (courseId == null) return;
      setPartnerBusyKey(`in-${requestId}`);
      try {
        await rejectPartnerRequest(courseId, requestId);
        await loadTeamsData();
      } catch (err) {
        setActionBanner(parseApiErrorMessage(err));
      } finally {
        setPartnerBusyKey(null);
      }
    },
    [courseId, loadTeamsData],
  );

  const handleRejectOutgoingPartner = useCallback(
    async (requestId: number) => {
      if (courseId == null) return;
      setPartnerBusyKey(`out-${requestId}`);
      try {
        await rejectPartnerRequest(courseId, requestId);
        await loadTeamsData();
      } catch (err) {
        setActionBanner(parseApiErrorMessage(err));
      } finally {
        setPartnerBusyKey(null);
      }
    },
    [courseId, loadTeamsData],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDetail();
      if (activeTab === "teams") await loadTeamsData();
      if (activeTab === "chat" && currentSectionId != null) await fetchChat(currentSectionId);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, currentSectionId, fetchChat, loadDetail, loadTeamsData]);

  const filteredInvites = useMemo(() => {
    if (courseId == null) return [];
    return teamInvites.filter(
      (i) => i.courseId === courseId && isCourseTeamInvitePending(i),
    );
  }, [courseId, teamInvites]);

  useEffect(() => {
    setTeamInvitesHasLoaded(false);
    setTeamInvitesError(null);
    setTeamInvites([]);
  }, [courseId]);

  const setTab = useCallback((tab: CourseTab) => {
    setActionBanner(null);
    setActiveTab(tab);
  }, []);

  const tabBtn = (tab: CourseTab, label: string) => (
    <Pressable
      key={tab}
      onPress={() => setTab(tab)}
      style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
    >
      <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{label}</Text>
    </Pressable>
  );

  if (courseId == null) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.err}>Invalid course.</Text>
        <Pressable onPress={handleBack} style={styles.retryBtn}>
          <Text style={styles.retryTxt}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.topBar, { paddingHorizontal: pad }]}>
        <Pressable onPress={handleBack} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#64748b" />
        </Pressable>
        <View style={styles.topBarTitle}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {bundle ? asText(bundle.detail.name) : "Course"}
          </Text>
          {bundle ? (
            <Text style={styles.topSub} numberOfLines={1}>
              Code: {asText(bundle.detail.code)}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={[styles.tabRow, { paddingHorizontal: pad }]}
      >
        {tabBtn("section", "My section")}
        {tabBtn("teams", "Teams")}
        {tabBtn("projects", "Projects")}
        {tabBtn("chat", "Chat")}
      </ScrollView>

      {actionBanner ? (
        <View style={[styles.actionBanner, { marginHorizontal: pad }]}>
          <Text style={styles.actionBannerText}>{actionBanner}</Text>
          <Pressable onPress={() => setActionBanner(null)} hitSlop={8}>
            <Ionicons name="close" size={20} color="#64748b" />
          </Pressable>
        </View>
      ) : null}

      {detailsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.note}>Loading course details…</Text>
        </View>
      ) : null}

      {detailsError ? (
        <View style={[styles.banner, { marginHorizontal: pad }]}>
          <Text style={styles.err}>{detailsError}</Text>
          <Pressable onPress={() => void loadDetail()} style={styles.retryBtn}>
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!detailsLoading && !detailsError && bundle ? (
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          {activeTab === "section" ? (
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: pad,
                paddingBottom: insets.bottom + spacing.xl,
                maxWidth: colMax,
                alignSelf: "center",
                width: "100%",
              }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
            >
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>{asText(bundle.detail.name)}</Text>
                <View style={styles.metaRow}>
                  {bundle.detail.semester ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>Semester: {asText(bundle.detail.semester, "")}</Text>
                    </View>
                  ) : null}
                  {bundle.detail.doctorName && bundle.detail.doctorId ? (
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/DoctorPublicProfilePage?doctorId=${encodeURIComponent(String(bundle.detail.doctorId))}` as Href,
                        )
                      }
                      style={styles.badge}
                    >
                      <Text style={styles.badgeTxt}>Doctor: {asText(bundle.detail.doctorName)}</Text>
                    </Pressable>
                  ) : bundle.detail.doctorName ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>Doctor: {asText(bundle.detail.doctorName)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {mySection ? (
                <>
                  <Text style={styles.blockTitle}>Section info</Text>
                  <View style={styles.card}>
                    <Text style={styles.bold}>{asText(mySection.name)}</Text>
                    <Text style={styles.meta}>
                      {formatSectionSchedule(mySection.days, mySection.timeFrom, mySection.timeTo)}
                    </Text>
                    <Text style={styles.meta}>
                      Capacity: <Text style={styles.bold}>{mySection.capacity}</Text>
                    </Text>
                  </View>
                  <Text style={styles.blockTitle}>Students in my section ({mySectionStudents.length})</Text>
                  <View style={styles.card}>
                    {mySectionStudents.length === 0 ? (
                      <Text style={styles.note}>No students found in your section.</Text>
                    ) : (
                      mySectionStudents.map((st, idx) => {
                        const uid = st.userId ?? st.UserId;
                        const name = asText(st.name ?? st.Name, "Student");
                        return (
                          <View key={`${name}-${idx}`} style={styles.studentRow}>
                            <View style={styles.av}>
                              <Text style={styles.avTxt}>{name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              {typeof uid === "number" && uid > 0 ? (
                                <Pressable
                                  onPress={() =>
                                    router.push(`/StudentPublicProfilePage?userId=${encodeURIComponent(String(uid))}` as Href)
                                  }
                                >
                                  <Text style={styles.stName}>{name}</Text>
                                </Pressable>
                              ) : (
                                <Text style={styles.stName}>{name}</Text>
                              )}
                              {st.email || st.Email ? (
                                <Text style={styles.stEmail}>{String(st.email ?? st.Email)}</Text>
                              ) : null}
                            </View>
                            {typeof uid === "number" && uid > 0 ? (
                              <Pressable
                                onPress={() =>
                                  router.push(`/ChatPage?userId=${encodeURIComponent(String(uid))}` as Href)
                                }
                                style={styles.msgMini}
                              >
                                <Ionicons name="chatbubble-outline" size={18} color="#6366f1" />
                              </Pressable>
                            ) : null}
                          </View>
                        );
                      })
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.blockTitle}>Section info</Text>
                  <View style={styles.card}>
                    <Text style={styles.note}>
                      You are not assigned yet, but here are course students.
                    </Text>
                  </View>
                  <Text style={styles.blockTitle}>Course students</Text>
                  <View style={styles.card}>
                    {courseStudents.length === 0 ? (
                      <Text style={styles.note}>No students found for this course.</Text>
                    ) : (
                      courseStudents.map((st, idx) => {
                        const uid = st.userId ?? st.UserId;
                        const name = asText(st.name ?? st.Name, "Student");
                        return (
                          <View key={`${name}-c-${idx}`} style={styles.studentRow}>
                            <View style={styles.av}>
                              <Text style={styles.avTxt}>{name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              {typeof uid === "number" && uid > 0 ? (
                                <Pressable
                                  onPress={() =>
                                    router.push(`/StudentPublicProfilePage?userId=${encodeURIComponent(String(uid))}` as Href)
                                  }
                                >
                                  <Text style={styles.stName}>{name}</Text>
                                </Pressable>
                              ) : (
                                <Text style={styles.stName}>{name}</Text>
                              )}
                              {st.email || st.Email ? (
                                <Text style={styles.stEmail}>{String(st.email ?? st.Email)}</Text>
                              ) : null}
                            </View>
                            {typeof uid === "number" && uid > 0 ? (
                              <Pressable
                                onPress={() =>
                                  router.push(`/ChatPage?userId=${encodeURIComponent(String(uid))}` as Href)
                                }
                                style={styles.msgMini}
                              >
                                <Ionicons name="chatbubble-outline" size={18} color="#6366f1" />
                              </Pressable>
                            ) : null}
                          </View>
                        );
                      })
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          ) : null}

          {activeTab === "teams" ? (
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: pad,
                paddingBottom: insets.bottom + spacing.xl,
                maxWidth: colMax,
                alignSelf: "center",
                width: "100%",
              }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
            >
              <Text style={styles.blockTitle}>Team invitations</Text>
              <View style={styles.card}>
                {teamsInvitesLoading && !teamInvitesHasLoaded ? (
                  <View style={styles.inviteStateBox}>
                    <ActivityIndicator color="#6366f1" />
                    <Text style={styles.note}>Loading invitations…</Text>
                  </View>
                ) : teamInvitesError ? (
                  <View style={styles.inviteStateBox}>
                    <Text style={styles.err}>{teamInvitesError}</Text>
                    <Pressable onPress={() => void loadTeamsData()} style={styles.inviteRetryBtn}>
                      <Text style={styles.inviteRetryTxt}>Try again</Text>
                    </Pressable>
                  </View>
                ) : filteredInvites.length === 0 ? (
                  <Text style={styles.note}>No pending team invitations for this course.</Text>
                ) : (
                  filteredInvites.map((item) => {
                    const st = inviteStatusById[item.invitationId];
                    const busy = inviteBusyId === item.invitationId;
                    const whenLabel = formatInviteAt(item.invitedAt);
                    return (
                      <View key={item.invitationId} style={styles.inviteCard}>
                        <Text style={styles.projTitle}>{item.projectTitle}</Text>
                        <Text style={styles.meta}>Course: {item.courseName}</Text>
                        <View style={styles.inviteFromRow}>
                          <Text style={styles.meta}>From: </Text>
                          <Pressable
                            onPress={() =>
                              router.push(
                                `/StudentPublicProfilePage?profileId=${encodeURIComponent(String(item.senderId))}` as Href,
                              )
                            }
                            hitSlop={6}
                          >
                            <Text style={styles.inviteLinkName}>{item.senderName}</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.meta}>Section: {item.senderSection}</Text>
                        {item.senderSkills && item.senderSkills.length > 0 ? (
                          <Text style={styles.meta}>Skills: {item.senderSkills.join(", ")}</Text>
                        ) : null}
                        {item.message ? <Text style={styles.inviteMessage}>{item.message}</Text> : null}
                        {whenLabel ? (
                          <Text style={styles.inviteDate}>{whenLabel}</Text>
                        ) : null}
                        {st === "accepted" ? (
                          <View style={styles.row}>
                            <Text style={styles.okBadge}>Joined team</Text>
                            <Pressable
                              onPress={() => {
                                const r = acceptInviteResult[item.invitationId];
                                const cid = r?.courseId ?? item.courseId;
                                const pid = r?.projectId ?? item.projectId;
                                router.push(`/StudentTeamPage?projectId=${encodeURIComponent(String(pid))}` as Href);
                              }}
                              style={styles.purpleBtn}
                            >
                              <Text style={styles.purpleBtnTxt}>View my team</Text>
                            </Pressable>
                          </View>
                        ) : st === "rejected" ? (
                          <Text style={styles.warnTxt}>Invitation rejected</Text>
                        ) : (
                          <View style={styles.row}>
                            <Pressable
                              disabled={busy}
                              onPress={() => void handleAcceptInvite(item.invitationId)}
                              style={[styles.purpleBtn, busy && styles.disabled]}
                            >
                              {busy ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <Text style={styles.purpleBtnTxt}>Accept</Text>
                              )}
                            </Pressable>
                            <Pressable
                              disabled={busy}
                              onPress={() => void handleRejectInvite(item.invitationId)}
                              style={[styles.outlineDanger, busy && styles.disabled]}
                            >
                              {busy ? (
                                <ActivityIndicator color="#be123c" size="small" />
                              ) : (
                                <Text style={styles.outlineDangerTxt}>Reject</Text>
                              )}
                            </Pressable>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>

              {teamsPartnersLoading && partnerReq == null ? (
                <ActivityIndicator color="#6366f1" style={{ marginVertical: spacing.sm }} />
              ) : null}

              <Text style={styles.blockTitle}>Partner requests</Text>
              <View style={styles.card}>
                {!partnerReq ? (
                  <Text style={styles.note}>Could not load partner requests.</Text>
                ) : (
                  <>
                    <Text style={styles.subHead}>Incoming</Text>
                    {partnerReq.incoming.length === 0 ? (
                      <Text style={styles.note}>None.</Text>
                    ) : (
                      partnerReq.incoming.map((r) => {
                        const k = `in-${r.requestId}`;
                        const busy = partnerBusyKey === k;
                        const st = (r.status ?? "").toLowerCase();
                        const pending = st === "pending" || !r.status;
                        return (
                          <View key={k} style={styles.prRow}>
                            <Text style={styles.stName}>
                              From {asText(r.sender?.name ?? r.sender?.Name, "Student")}
                            </Text>
                            {pending ? (
                              <View style={styles.row}>
                                <Pressable
                                  disabled={busy}
                                  onPress={() => void handleAcceptPartner(r.requestId)}
                                  style={[styles.purpleBtn, busy && styles.disabled]}
                                >
                                  <Text style={styles.purpleBtnTxt}>Accept</Text>
                                </Pressable>
                                <Pressable
                                  disabled={busy}
                                  onPress={() => void handleRejectPartner(r.requestId)}
                                  style={[styles.outlineDanger, busy && styles.disabled]}
                                >
                                  <Text style={styles.outlineDangerTxt}>Reject</Text>
                                </Pressable>
                              </View>
                            ) : (
                              <Text style={styles.meta}>Status: {st}</Text>
                            )}
                          </View>
                        );
                      })
                    )}
                    <Text style={[styles.subHead, { marginTop: spacing.md }]}>Outgoing</Text>
                    {partnerReq.outgoing.length === 0 ? (
                      <Text style={styles.note}>None.</Text>
                    ) : (
                      partnerReq.outgoing.map((r) => {
                        const k = `out-${r.requestId}`;
                        const busy = partnerBusyKey === k;
                        const st = (r.status ?? "").toLowerCase();
                        const pending = st === "pending" || !r.status;
                        return (
                          <View key={k} style={styles.prRow}>
                            <Text style={styles.stName}>
                              To {asText(r.receiver?.name ?? r.receiver?.Name, "Student")}
                            </Text>
                            {pending ? (
                              <Pressable
                                disabled={busy}
                                onPress={() => void handleRejectOutgoingPartner(r.requestId)}
                                style={[styles.outlineDanger, busy && styles.disabled]}
                              >
                                <Text style={styles.outlineDangerTxt}>Cancel</Text>
                              </Pressable>
                            ) : (
                              <Text style={styles.meta}>Status: {st}</Text>
                            )}
                          </View>
                        );
                      })
                    )}
                  </>
                )}
              </View>

              <Text style={styles.blockTitle}>Project teams</Text>
              {projectTeamsLoading ? <ActivityIndicator color="#6366f1" /> : null}
              {mySectionProjects.filter((p) => p.hasTeam).length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.note}>No project teams yet for visible projects.</Text>
                </View>
              ) : (
                mySectionProjects
                  .filter((p) => p.hasTeam)
                  .map((p) => {
                    const team = projectTeams[p.id];
                    return (
                      <View key={p.id} style={[styles.card, { marginBottom: spacing.md }]}>
                        <Text style={styles.projTitle}>{p.title}</Text>
                        {!team ? (
                          <Text style={styles.note}>Could not load team.</Text>
                        ) : (
                          team.members.map((m) => (
                            <View key={m.studentId} style={styles.studentRow}>
                              <View style={styles.av}>
                                <Text style={styles.avTxt}>{m.name.charAt(0).toUpperCase()}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Pressable
                                  onPress={() =>
                                    router.push(
                                      `/StudentPublicProfilePage?userId=${encodeURIComponent(String(m.userId))}` as Href,
                                    )
                                  }
                                >
                                  <Text style={styles.stName}>{m.name}</Text>
                                </Pressable>
                              </View>
                              <Pressable
                                onPress={() =>
                                  router.push(`/ChatPage?userId=${encodeURIComponent(String(m.userId))}` as Href)
                                }
                              >
                                <Ionicons name="chatbubble-outline" size={18} color="#6366f1" />
                              </Pressable>
                            </View>
                          ))
                        )}
                        <Pressable
                          onPress={() =>
                            router.push(`/StudentTeamPage?projectId=${encodeURIComponent(String(p.id))}` as Href)
                          }
                          style={[styles.purpleBtn, { marginTop: spacing.sm, alignSelf: "flex-start" }]}
                        >
                          <Text style={styles.purpleBtnTxt}>Open team workspace</Text>
                        </Pressable>
                      </View>
                    );
                  })
              )}
            </ScrollView>
          ) : null}

          {activeTab === "projects" ? (
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: pad,
                paddingBottom: insets.bottom + spacing.xl,
                maxWidth: colMax,
                alignSelf: "center",
                width: "100%",
              }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
            >
              {mySectionProjects.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.note}>No projects posted yet for your section.</Text>
                </View>
              ) : (
                mySectionProjects.map((project) => {
                  const sectionName = project.applyToAllSections
                    ? "All sections"
                    : asText(mySection?.name, "My section");
                  const isDoctorAssigned = computeIsDoctorAssignedProject(project);
                  const hasTeam = project.hasTeam === true;
                  return (
                    <View key={project.id} style={[styles.card, { marginBottom: spacing.md }]}>
                      <Text style={styles.projTitle}>{project.title}</Text>
                      <Text style={styles.meta}>Team size: {project.teamSize}</Text>
                      <Text style={styles.meta}>Section: {sectionName}</Text>
                      <View style={styles.rowWrap}>
                        <View style={[styles.badge, isDoctorAssigned ? styles.badgePurple : styles.badgeBlue]}>
                          <Text style={styles.badgeTxt}>
                            {isDoctorAssigned ? "Assigned by doctor" : "Student selection"}
                          </Text>
                        </View>
                        <View style={styles.badge}>
                          <Text style={styles.badgeTxt}>
                            AI: {project.aiMode === "doctor" ? "Doctor mode" : "Student mode"}
                          </Text>
                        </View>
                      </View>
                      {project.description ? <Text style={styles.desc}>{project.description}</Text> : null}
                      {project.allowCrossSectionTeams ? (
                        <Text style={styles.hint}>Cross-section teams allowed</Text>
                      ) : null}
                      <Text style={styles.hint}>
                        {project.applyToAllSections
                          ? "You can choose teammates from the whole course."
                          : "You can choose teammates from your section only."}
                      </Text>
                      <View style={styles.row}>
                        {isDoctorAssigned || hasTeam ? (
                          <Pressable
                            onPress={() =>
                              router.push(`/StudentTeamPage?projectId=${encodeURIComponent(String(project.id))}` as Href)
                            }
                            style={styles.purpleBtn}
                          >
                            <Text style={styles.purpleBtnTxt}>View my team</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={() =>
                              router.push(
                                `/StudentTeamChoicePage?courseId=${encodeURIComponent(String(courseId))}&projectId=${encodeURIComponent(String(project.id))}&projectTitle=${encodeURIComponent(project.title)}` as Href,
                              )
                            }
                            style={styles.purpleBtn}
                          >
                            <Text style={styles.purpleBtnTxt}>Generate team</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          ) : null}

          {activeTab === "chat" ? (
            <View style={styles.flex1}>
              {currentSectionId == null ? (
                <View style={[styles.card, { marginHorizontal: pad }]}>
                  <Text style={styles.note}>You need to be assigned to a section to use chat.</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.chatHeader, { paddingHorizontal: pad }]}>
                    <Text style={styles.stName}>{mySection?.name ?? "Section chat"}</Text>
                    <View style={styles.row}>
                      {chatLoading ? <Text style={styles.meta}>Loading…</Text> : null}
                      <Pressable onPress={() => void fetchChat(currentSectionId)} style={styles.iconBtn}>
                        <Ionicons name="refresh" size={20} color="#6366f1" />
                      </Pressable>
                    </View>
                  </View>
                  {chatError ? (
                    <Text style={[styles.err, { paddingHorizontal: pad }]}>{chatError}</Text>
                  ) : null}
                  <FlatList
                    data={messages}
                    keyExtractor={(m) => String(m.id)}
                    contentContainerStyle={{
                      paddingHorizontal: pad,
                      paddingBottom: spacing.md,
                      flexGrow: 1,
                    }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
                    onContentSizeChange={() => {}}
                    renderItem={({ item: msg }) => {
                      const mine = msg.senderUserId === authUserId;
                      return (
                        <View
                          style={[styles.chatRow, mine ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}
                        >
                          {!mine ? (
                            <Text style={styles.metaSmall}>{msg.senderName}</Text>
                          ) : null}
                          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                            <Text style={mine ? styles.bubbleTxtMine : styles.bubbleTxtOther}>{msg.text}</Text>
                          </View>
                          <Text style={styles.metaSmall}>
                            {new Date(msg.sentAt).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      );
                    }}
                    ListEmptyComponent={
                      !chatLoading ? (
                        <Text style={[styles.note, { textAlign: "center", marginTop: spacing.xl }]}>
                          Start chatting with your section
                        </Text>
                      ) : null
                    }
                  />
                  <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm, paddingHorizontal: pad }]}>
                    <TextInput
                      style={styles.input}
                      value={input}
                      onChangeText={setInput}
                      placeholder="Type a message…"
                      placeholderTextColor="#94a3b8"
                      editable={!chatSending}
                    />
                    <Pressable
                      onPress={() => void sendMessage()}
                      disabled={chatSending || !input.trim()}
                      style={[styles.sendBtn, (!input.trim() || chatSending) && styles.disabled]}
                    >
                      <Ionicons name="send" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  flex1: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(99,102,241,0.12)",
    backgroundColor: "rgba(248,247,255,0.98)",
  },
  iconBtn: { padding: 4 },
  topBarTitle: { flex: 1, minWidth: 0 },
  topTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  topSub: { fontSize: 12, color: "#64748b", fontWeight: "600", marginTop: 2 },
  tabScroll: { maxHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  tabRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  tabBtnActive: { backgroundColor: "#ede9fe", borderColor: "#c4b5fd" },
  tabBtnText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  tabBtnTextActive: { color: "#5b21b6" },
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: "#fef2f2",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  actionBannerText: { flex: 1, color: "#b91c1c", fontWeight: "700", fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  note: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  banner: { padding: spacing.md, backgroundColor: "#fef2f2", borderRadius: radius.md, borderWidth: 1, borderColor: "#fecaca" },
  err: { color: "#b91c1c", fontWeight: "700" },
  retryBtn: { marginTop: spacing.sm, alignSelf: "flex-start", backgroundColor: "#6366f1", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  retryTxt: { color: "#fff", fontWeight: "800" },
  hero: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: spacing.md,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#ede9fe",
    borderWidth: 1,
    borderColor: "#ddd6fe",
  },
  badgePurple: { backgroundColor: "#f3e8ff", borderColor: "#e9d5ff" },
  badgeBlue: { backgroundColor: "#dbeafe", borderColor: "#bfdbfe" },
  badgeTxt: { fontSize: 11, fontWeight: "700", color: "#6d28d9" },
  blockTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: spacing.sm },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bold: { fontWeight: "800", color: "#0f172a" },
  meta: { marginTop: 6, fontSize: 13, color: "#64748b", fontWeight: "500" },
  metaSmall: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  studentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f1f5f9" },
  av: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#ede9fe", alignItems: "center", justifyContent: "center" },
  avTxt: { fontSize: 13, fontWeight: "800", color: "#7c3aed" },
  stName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  stEmail: { fontSize: 12, color: "#64748b", marginTop: 2 },
  msgMini: { padding: 6 },
  inviteStateBox: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  inviteRetryBtn: {
    marginTop: spacing.sm,
    alignSelf: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  inviteRetryTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  inviteCard: { paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f1f5f9" },
  inviteFromRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 6 },
  inviteLinkName: { fontSize: 13, color: "#6366f1", fontWeight: "800", textDecorationLine: "underline" },
  inviteMessage: { marginTop: spacing.sm, fontSize: 13, color: "#334155", lineHeight: 20, fontWeight: "500" },
  inviteDate: { marginTop: spacing.xs, fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  projTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  purpleBtn: { backgroundColor: "#7c3aed", paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md },
  purpleBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  outlineDanger: { borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff1f2", paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md },
  outlineDangerTxt: { color: "#be123c", fontWeight: "800", fontSize: 13 },
  okBadge: { fontSize: 12, fontWeight: "800", color: "#166534" },
  warnTxt: { color: "#be123c", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  subHead: { fontSize: 13, fontWeight: "800", color: "#334155" },
  prRow: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f1f5f9" },
  desc: { marginTop: spacing.sm, fontSize: 13, color: "#64748b", lineHeight: 20 },
  hint: { marginTop: spacing.sm, fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  chatRow: { maxWidth: "85%", marginBottom: spacing.sm },
  bubble: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
  bubbleMine: { backgroundColor: "#7c3aed" },
  bubbleOther: { backgroundColor: "#e5e7eb" },
  bubbleTxtMine: { color: "#fff", fontSize: 14 },
  bubbleTxtOther: { color: "#0f172a", fontSize: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e2e8f0", paddingTop: spacing.sm },
  input: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fff", fontSize: 14, color: "#0f172a" },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center" },
});
