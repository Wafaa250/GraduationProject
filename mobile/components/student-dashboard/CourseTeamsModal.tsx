import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  acceptPartnerRequest,
  createPartnerRequest,
  getCourseById,
  getCoursePartnerRequests,
  getCourseProjectSetting,
  getCourseStudents,
  getEnrolledCourses,
  getMyTeam,
  getRecommendedPartners,
  leaveCourse,
  normalizeCourseProjectsFromDetail,
  rejectPartnerRequest,
  removeTeamMember,
  type CourseDetails,
  type CourseProjectSetting,
  type CourseProjectSummary,
  type CourseStudent,
  type EnrolledCourse,
  type MyTeamResponse,
  type PartnerRequest,
  type PartnerRequestsResponse,
  type RecommendedPartner,
  type RecommendedPartnerMode,
  type TeamMember,
} from "@/api/studentCoursesApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getCourseId } from "@/utils/getCourseId";

import * as H from "./courseTeamsHelpers";

export type CourseTeamsModalProps = {
  visible: boolean;
  onClose: () => void;
  myUserId: number | null;
  onToast: (message: string, variant: "success" | "error") => void;
  onDashCountsNeedRefresh: () => void;
};

export function CourseTeamsModal({
  visible,
  onClose,
  myUserId,
  onToast,
  onDashCountsNeedRefresh,
}: CourseTeamsModalProps) {
  const insets = useSafeAreaInsets();
  const { width, maxDashboardWidth } = useResponsiveLayout();

  const [ctCourses, setCtCourses] = useState<EnrolledCourse[]>([]);
  const [ctNoValidCourseIds, setCtNoValidCourseIds] = useState(false);
  const [ctSelectedCourseId, setCtSelectedCourseId] = useState<number | null>(null);
  const [ctSelectedCourseProjectId, setCtSelectedCourseProjectId] = useState<number | null>(null);
  const [ctCoursesLoading, setCtCoursesLoading] = useState(false);
  const [ctCoursesError, setCtCoursesError] = useState<string | null>(null);
  const [ctDetailsLoading, setCtDetailsLoading] = useState(false);
  const [ctDetailsError, setCtDetailsError] = useState<string | null>(null);
  const [ctCourseDetail, setCtCourseDetail] = useState<CourseDetails | null>(null);
  const [ctProjectSetting, setCtProjectSetting] = useState<CourseProjectSetting | null>(null);
  const [ctMyTeam, setCtMyTeam] = useState<MyTeamResponse | null>(null);
  const [ctPartnerRequests, setCtPartnerRequests] = useState<PartnerRequestsResponse | null>(null);
  const [ctCourseStudents, setCtCourseStudents] = useState<CourseStudent[]>([]);
  const [ctRecommendedMode, setCtRecommendedMode] = useState<RecommendedPartnerMode>("complementary");
  const [ctRecommendedSort, setCtRecommendedSort] = useState<"best" | "lowest">("best");
  const [aiLoaded, setAiLoaded] = useState(false);
  const [ctRecommendedPartners, setCtRecommendedPartners] = useState<RecommendedPartner[]>([]);
  const [ctRecommendedLoading, setCtRecommendedLoading] = useState(false);
  const [ctSendingReceiverUniversityId, setCtSendingReceiverUniversityId] = useState<string | null>(null);
  const [ctIncomingRowAction, setCtIncomingRowAction] = useState<Record<number, "accept" | "reject">>({});
  const [ctRemovingMemberStudentId, setCtRemovingMemberStudentId] = useState<number | null>(null);
  const [ctLeavingCourse, setCtLeavingCourse] = useState(false);

  const ctIncomingBusyRef = useRef<Set<number>>(new Set());

  const resetState = useCallback(() => {
    setCtCourses([]);
    setCtNoValidCourseIds(false);
    setCtSelectedCourseId(null);
    setCtSelectedCourseProjectId(null);
    setCtCoursesLoading(false);
    setCtCoursesError(null);
    setCtDetailsLoading(false);
    setCtDetailsError(null);
    setCtCourseDetail(null);
    setCtProjectSetting(null);
    setCtMyTeam(null);
    setCtPartnerRequests(null);
    setCtCourseStudents([]);
    setCtRecommendedMode("complementary");
    setCtRecommendedSort("best");
    setAiLoaded(false);
    setCtRecommendedPartners([]);
    setCtRecommendedLoading(false);
    setCtSendingReceiverUniversityId(null);
    setCtIncomingRowAction({});
    ctIncomingBusyRef.current.clear();
    setCtRemovingMemberStudentId(null);
    setCtLeavingCourse(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const run = async () => {
      setCtCoursesLoading(true);
      setCtCoursesError(null);
      try {
        const data = await getEnrolledCourses();
        const validCourses = data.filter((c) => getCourseId(c) !== null);
        if (cancelled) return;
        setCtCourses(validCourses);
        setCtNoValidCourseIds(data.length > 0 && validCourses.length === 0);
        setCtSelectedCourseId((prev) => {
          if (prev != null && validCourses.some((c) => getCourseId(c) === prev)) return prev;
          return getCourseId(validCourses[0]) ?? null;
        });
      } catch (err) {
        if (!cancelled) setCtCoursesError(parseApiErrorMessage(err));
      } finally {
        if (!cancelled) setCtCoursesLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !ctSelectedCourseId) return;
    const selectedCourseId = ctSelectedCourseId;
    let cancelled = false;
    const run = async () => {
      setCtDetailsLoading(true);
      setCtDetailsError(null);
      try {
        const [courseRes, myTeamRes, requestsRes, studentsRes] = await Promise.all([
          getCourseById(selectedCourseId),
          getMyTeam(selectedCourseId),
          getCoursePartnerRequests(selectedCourseId),
          getCourseStudents(selectedCourseId),
        ]);
        let settingRes: CourseProjectSetting | null = null;
        try {
          settingRes = await getCourseProjectSetting(selectedCourseId);
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) settingRes = null;
          else throw err;
        }
        if (cancelled) return;
        setCtCourseDetail(courseRes);
        setCtProjectSetting(settingRes);
        setCtMyTeam(myTeamRes);
        setCtPartnerRequests(requestsRes);
        setCtCourseStudents(studentsRes);
      } catch (err) {
        if (!cancelled) {
          setCtCourseDetail(null);
          setCtProjectSetting(null);
          setCtMyTeam(null);
          setCtPartnerRequests(null);
          setCtCourseStudents([]);
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            setCtDetailsError("Course data not found");
            onToast("Course data not found", "error");
          } else if (status === 403) {
            setCtDetailsError("You are not allowed to access this course");
            onToast("You are not allowed to access this course", "error");
          } else {
            setCtDetailsError("We could not load this course right now. Please try again.");
            onToast("We could not load this course right now. Please try again.", "error");
          }
        }
      } finally {
        if (!cancelled) setCtDetailsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [visible, ctSelectedCourseId, onToast]);

  useEffect(() => {
    setAiLoaded(false);
    setCtRecommendedPartners([]);
    setCtRecommendedLoading(false);
  }, [ctSelectedCourseId, ctRecommendedMode, ctSelectedCourseProjectId]);

  const ctCourseProjects = useMemo((): CourseProjectSummary[] => {
    if (!ctCourseDetail || ctCourseDetail.courseId !== ctSelectedCourseId) return [];
    return normalizeCourseProjectsFromDetail(ctCourseDetail);
  }, [ctCourseDetail, ctSelectedCourseId]);

  useEffect(() => {
    setCtSelectedCourseProjectId(null);
  }, [ctSelectedCourseId]);

  useEffect(() => {
    if (!ctCourseDetail || ctCourseDetail.courseId !== ctSelectedCourseId) return;
    const projects = normalizeCourseProjectsFromDetail(ctCourseDetail);
    if (projects.length === 0) {
      setCtSelectedCourseProjectId(null);
      return;
    }
    if (projects.length === 1) {
      setCtSelectedCourseProjectId(projects[0].id);
      return;
    }
    setCtSelectedCourseProjectId((prev) => {
      if (prev != null && projects.some((p) => p.id === prev)) return prev;
      return projects[0].id;
    });
  }, [ctCourseDetail, ctSelectedCourseId]);

  const ctPartnerRequestBlockedNoSection = useMemo(() => {
    const uid = myUserId;
    if (uid == null) return false;
    const me = ctCourseStudents.find((raw) => {
      const rowUserId = H.ctCourseStudentUserId(raw);
      return rowUserId != null && rowUserId === uid;
    });
    if (!me) return false;
    const sid = me.sectionId ?? me.SectionId;
    return sid === null || sid === undefined;
  }, [ctCourseStudents, myUserId]);

  const fetchRecommendations = useCallback(async () => {
    if (!ctSelectedCourseId) return;
    setCtRecommendedLoading(true);
    try {
      const recs = await getRecommendedPartners(ctSelectedCourseId, ctRecommendedMode);
      setCtRecommendedPartners(Array.isArray(recs) ? recs : []);
    } catch {
      setCtRecommendedPartners([]);
    } finally {
      setCtRecommendedLoading(false);
    }
  }, [ctSelectedCourseId, ctRecommendedMode]);

  const handleCourseTeamsSendPartnerRequest = useCallback(
    async (receiverUniversityId: string) => {
      const uid = receiverUniversityId.trim();
      if (!ctSelectedCourseId || !uid) return;
      if (ctPartnerRequestBlockedNoSection) return;
      const selectedCourseId = ctSelectedCourseId;
      setCtSendingReceiverUniversityId(uid);
      try {
        await createPartnerRequest(selectedCourseId, {
          receiverStudentId: uid,
          ...(ctSelectedCourseProjectId != null ? { courseProjectId: ctSelectedCourseProjectId } : {}),
        });
        const pr = await getCoursePartnerRequests(selectedCourseId);
        setCtPartnerRequests(pr);
        await onDashCountsNeedRefresh();
      } catch (err) {
        onToast(parseApiErrorMessage(err), "error");
      } finally {
        setCtSendingReceiverUniversityId(null);
      }
    },
    [ctSelectedCourseId, ctSelectedCourseProjectId, ctPartnerRequestBlockedNoSection, onToast, onDashCountsNeedRefresh],
  );

  const handleCtAcceptIncoming = useCallback(
    async (requestId: number) => {
      if (!ctSelectedCourseId) return;
      if (ctIncomingBusyRef.current.has(requestId)) return;
      ctIncomingBusyRef.current.add(requestId);
      const selectedCourseId = ctSelectedCourseId;
      setCtIncomingRowAction((prev) => ({ ...prev, [requestId]: "accept" }));
      try {
        await acceptPartnerRequest(selectedCourseId, requestId);
        setCtPartnerRequests((prev) => H.ctStripIncomingPartnerRequestById(prev, requestId));
        const [pr, team, courseRes] = await Promise.all([
          getCoursePartnerRequests(selectedCourseId),
          getMyTeam(selectedCourseId),
          getCourseById(selectedCourseId),
        ]);
        setCtPartnerRequests(pr);
        setCtMyTeam(team);
        setCtCourseDetail(courseRes);
        await onDashCountsNeedRefresh();
      } catch (err) {
        onToast(parseApiErrorMessage(err), "error");
        try {
          const [pr, team] = await Promise.all([
            getCoursePartnerRequests(selectedCourseId),
            getMyTeam(selectedCourseId),
          ]);
          setCtPartnerRequests(pr);
          setCtMyTeam(team);
        } catch {
          /* ignore */
        }
      } finally {
        ctIncomingBusyRef.current.delete(requestId);
        setCtIncomingRowAction((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
      }
    },
    [ctSelectedCourseId, onToast, onDashCountsNeedRefresh],
  );

  const handleCtRejectIncoming = useCallback(
    async (requestId: number) => {
      if (!ctSelectedCourseId) return;
      if (ctIncomingBusyRef.current.has(requestId)) return;
      ctIncomingBusyRef.current.add(requestId);
      const selectedCourseId = ctSelectedCourseId;
      setCtIncomingRowAction((prev) => ({ ...prev, [requestId]: "reject" }));
      try {
        await rejectPartnerRequest(selectedCourseId, requestId);
        setCtPartnerRequests((prev) => H.ctStripIncomingPartnerRequestById(prev, requestId));
        const pr = await getCoursePartnerRequests(selectedCourseId);
        setCtPartnerRequests(pr);
        await onDashCountsNeedRefresh();
      } catch (err) {
        onToast(parseApiErrorMessage(err), "error");
      } finally {
        ctIncomingBusyRef.current.delete(requestId);
        setCtIncomingRowAction((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
      }
    },
    [ctSelectedCourseId, onToast, onDashCountsNeedRefresh],
  );

  const handleCtRemoveTeamMember = useCallback(
    async (teamId: number, memberStudentId: number) => {
      if (!ctSelectedCourseId) return;
      Alert.alert("Remove member", "Are you sure you want to remove this member?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const selectedCourseId = ctSelectedCourseId;
            setCtRemovingMemberStudentId(memberStudentId);
            try {
              await removeTeamMember(selectedCourseId, teamId, memberStudentId);
              const [team, pr, students, courseRes] = await Promise.all([
                getMyTeam(selectedCourseId),
                getCoursePartnerRequests(selectedCourseId),
                getCourseStudents(selectedCourseId),
                getCourseById(selectedCourseId),
              ]);
              setCtMyTeam(team);
              setCtPartnerRequests(pr);
              setCtCourseStudents(students);
              setCtCourseDetail(courseRes);
              await onDashCountsNeedRefresh();
            } catch (err) {
              onToast(parseApiErrorMessage(err), "error");
            } finally {
              setCtRemovingMemberStudentId(null);
            }
          },
        },
      ]);
    },
    [ctSelectedCourseId, onToast, onDashCountsNeedRefresh],
  );

  const handleCourseTeamsLeaveCourse = useCallback(() => {
    if (!ctSelectedCourseId) return;
    Alert.alert("Leave course", "Are you sure you want to leave this course?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          const leftCourseId = ctSelectedCourseId;
          setCtLeavingCourse(true);
          try {
            await leaveCourse(leftCourseId);
            onToast("You left the course.", "success");
            const fresh = await getEnrolledCourses();
            setCtCourses(fresh.filter((c) => getCourseId(c) !== null));
            await onDashCountsNeedRefresh();
            handleClose();
          } catch (err) {
            onToast(parseApiErrorMessage(err), "error");
          } finally {
            setCtLeavingCourse(false);
          }
        },
      },
    ]);
  }, [ctSelectedCourseId, onToast, onDashCountsNeedRefresh, handleClose]);

  const selectedCourse = useMemo(
    () => ctCourses.find((x) => getCourseId(x) === ctSelectedCourseId),
    [ctCourses, ctSelectedCourseId],
  );

  const detailBody = useMemo(() => {
    if (!ctSelectedCourseId) {
      return (
        <View style={styles.padded}>
          <Text style={styles.muted}>Select a course to view details.</Text>
        </View>
      );
    }
    if (ctDetailsLoading) {
      return (
        <View style={styles.padded}>
          <ActivityIndicator color="#6366f1" />
          <Text style={styles.muted}>Loading course data…</Text>
        </View>
      );
    }
    if (ctDetailsError) {
      return (
        <View style={styles.padded}>
          <Text style={styles.err}>{ctDetailsError}</Text>
        </View>
      );
    }
    const courseObj = H.ctAsRecord(ctCourseDetail);
    const settingObj = H.ctAsRecord(ctProjectSetting);
    const myTeamObj = H.ctAsRecord(ctMyTeam);
    const settingTitle = H.ctReadTextField(settingObj, ["title", "Title", "projectTitle", "ProjectTitle"]);
    const settingDescription = H.ctReadTextField(settingObj, [
      "description",
      "Description",
      "projectDescription",
      "ProjectDescription",
    ]);
    const settingTeamSize = H.ctReadNumberField(settingObj, ["teamSize", "TeamSize", "maxTeamSize", "MaxTeamSize"]);
    const myRoleStr = H.ctReadTextField(myTeamObj, ["myRole", "MyRole", "role", "Role"]);
    const ctPendingIncomingList = (ctPartnerRequests?.incoming ?? []).filter(H.ctIsIncomingPartnerRequestPending);
    const incomingCt = ctPendingIncomingList.length;
    const outgoingCt = (ctPartnerRequests?.outgoing ?? []).filter(H.ctIsOutgoingPendingPartnerRequest).length;

    const teamMemberDbIds = new Set<number>();
    for (const m of ctMyTeam?.members ?? []) {
      if (typeof m.studentId === "number" && Number.isFinite(m.studentId)) {
        teamMemberDbIds.add(m.studentId);
      }
    }
    const outgoingPendingReceiverDbIds = new Set<number>();
    for (const r of ctPartnerRequests?.outgoing ?? []) {
      if (!H.ctIsOutgoingPendingPartnerRequest(r)) continue;
      const rid = H.ctPartnerRequestReceiverDbId(r);
      if (rid != null) outgoingPendingReceiverDbIds.add(rid);
    }

    const ctCourseTeamIsLeader = H.normApiStatus(myRoleStr) === "leader";
    let ctMyCourseTeamSelfStudentId: number | null = null;
    for (const m of ctMyTeam?.members ?? []) {
      if (myUserId != null && m.userId === myUserId) {
        ctMyCourseTeamSelfStudentId = m.studentId;
        break;
      }
    }

    return (
      <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
        {ctPartnerRequestBlockedNoSection ? (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>You must be assigned to a section first</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Course overview</Text>
        <Text style={styles.sectionSub}>Basic information for the course you have selected.</Text>
        <View style={styles.grid2}>
          <KV label="Course" value={selectedCourse?.name ?? H.ctReadTextField(courseObj, ["name", "Name"])} />
          <KV label="Code" value={selectedCourse?.code ?? H.ctReadTextField(courseObj, ["code", "Code"])} />
          <KV label="Section" value={selectedCourse?.section ?? H.ctReadTextField(courseObj, ["section", "Section"])} />
          <KV label="Semester" value={selectedCourse?.semester ?? H.ctReadTextField(courseObj, ["semester", "Semester"])} />
        </View>

        {ctCourseProjects.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.labelSm}>Course project</Text>
            {ctCourseProjects.length > 1 ? (
              <>
                <Text style={styles.hint}>
                  This course has multiple projects. Choose which one you are working in — partner actions will use
                  this selection.
                </Text>
                <View style={styles.projectChips}>
                  {ctCourseProjects.map((p) => {
                    const sel = ctSelectedCourseProjectId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setCtSelectedCourseProjectId(p.id)}
                        style={[styles.projectChip, sel && styles.projectChipOn]}
                      >
                        <Text style={[styles.projectChipText, sel && styles.projectChipTextOn]} numberOfLines={2}>
                          {p.title?.trim() || `Project #${p.id}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={styles.bodyStrong}>
                {ctCourseProjects[0]?.title?.trim() || `Project #${ctCourseProjects[0]?.id}`}
              </Text>
            )}
          </View>
        ) : null}

        <Pressable
          onPress={() => void handleCourseTeamsLeaveCourse()}
          disabled={ctLeavingCourse}
          style={[styles.leaveBtn, ctLeavingCourse && styles.disabled]}
        >
          <Text style={styles.leaveBtnText}>{ctLeavingCourse ? "Leaving…" : "Leave Course"}</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Project setting</Text>
        <Text style={styles.sectionSub}>What your instructor configured for this course project.</Text>
        {ctProjectSetting === null ? (
          <Text style={styles.muted}>No project setting yet</Text>
        ) : (
          <View style={styles.grid2}>
            <KV label="Title" value={settingTitle} />
            <KV label="Team size" value={settingTeamSize === null ? "—" : String(settingTeamSize)} />
            <View style={{ width: "100%" }}>
              <Text style={styles.labelSm}>Description</Text>
              <Text style={styles.body}>{settingDescription}</Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>My team</Text>
        {!ctMyTeam ? (
          <Text style={styles.muted}>No team data yet.</Text>
        ) : (
          <>
            <Text style={styles.mutedSmall}>
              Team ID {ctMyTeam.teamId} · {H.normApiStatus(myRoleStr) === "leader" ? "You are the team leader" : "Member"}
            </Text>
            {(ctMyTeam.members ?? []).map((m) => {
              const canRemove =
                ctCourseTeamIsLeader &&
                m.role !== "leader" &&
                ctMyCourseTeamSelfStudentId != null &&
                m.studentId !== ctMyCourseTeamSelfStudentId;
              return (
                <View key={`${m.studentId}-${m.universityId}`} style={styles.memberRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.memberName}>{H.ctMemberDisplayName(m)}</Text>
                    <Text style={styles.mutedSmall}>{m.email ?? ""}</Text>
                  </View>
                  {canRemove ? (
                    <Pressable
                      onPress={() => void handleCtRemoveTeamMember(ctMyTeam.teamId, m.studentId)}
                      disabled={ctRemovingMemberStudentId === m.studentId}
                      style={styles.removeMini}
                    >
                      <Text style={styles.removeMiniText}>
                        {ctRemovingMemberStudentId === m.studentId ? "…" : "Remove"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </>
        )}

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Partner requests</Text>
        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Incoming (pending)</Text>
            <Text style={styles.statValue}>{incomingCt}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Outgoing (pending)</Text>
            <Text style={styles.statValue}>{outgoingCt}</Text>
          </View>
        </View>

        {ctPendingIncomingList.map((req) => {
          const rid = H.ctPartnerRequestRowId(req);
          if (rid == null) return null;
          const sender = H.ctIncomingSenderRow(req.sender);
          const busy = ctIncomingRowAction[rid];
          return (
            <View key={rid} style={styles.incomingCard}>
              <Text style={styles.incomingTitle}>Request from {sender.name}</Text>
              <Text style={styles.mutedSmall}>{sender.university}</Text>
              <View style={styles.rowGap}>
                <Pressable
                  disabled={!!busy}
                  onPress={() => void handleCtAcceptIncoming(rid)}
                  style={[styles.acceptBtn, busy === "accept" && styles.disabled]}
                >
                  <Text style={styles.acceptBtnText}>{busy === "accept" ? "…" : "Accept"}</Text>
                </Pressable>
                <Pressable
                  disabled={!!busy}
                  onPress={() => void handleCtRejectIncoming(rid)}
                  style={[styles.rejectBtn, busy === "reject" && styles.disabled]}
                >
                  <Text style={styles.rejectBtnText}>{busy === "reject" ? "…" : "Decline"}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>AI partner recommendations</Text>
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setCtRecommendedMode("complementary")}
            style={[styles.modeChip, ctRecommendedMode === "complementary" && styles.modeChipOn]}
          >
            <Text style={styles.modeChipText}>Complementary</Text>
          </Pressable>
          <Pressable
            onPress={() => setCtRecommendedMode("similar")}
            style={[styles.modeChip, ctRecommendedMode === "similar" && styles.modeChipOn]}
          >
            <Text style={styles.modeChipText}>Similar</Text>
          </Pressable>
        </View>
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setCtRecommendedSort("best")}
            style={[styles.modeChip, ctRecommendedSort === "best" && styles.modeChipOn]}
          >
            <Text style={styles.modeChipText}>Best match</Text>
          </Pressable>
          <Pressable
            onPress={() => setCtRecommendedSort("lowest")}
            style={[styles.modeChip, ctRecommendedSort === "lowest" && styles.modeChipOn]}
          >
            <Text style={styles.modeChipText}>Lowest match</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => {
            setAiLoaded(true);
            void fetchRecommendations();
          }}
          disabled={ctRecommendedLoading || !ctSelectedCourseId}
          style={[styles.genBtn, (ctRecommendedLoading || !ctSelectedCourseId) && styles.disabled]}
        >
          <Text style={styles.genBtnText}>Generate</Text>
        </Pressable>
        {!aiLoaded ? (
          <Text style={styles.muted}>Click Generate to get recommendations</Text>
        ) : ctRecommendedLoading ? (
          <Text style={styles.muted}>Loading AI recommendations…</Text>
        ) : ctRecommendedPartners.length === 0 ? (
          <Text style={styles.muted}>No AI recommendations available yet</Text>
        ) : (
          [...ctRecommendedPartners]
            .sort((a, b) => {
              const scoreA = typeof a.matchScore === "number" && Number.isFinite(a.matchScore) ? a.matchScore : null;
              const scoreB = typeof b.matchScore === "number" && Number.isFinite(b.matchScore) ? b.matchScore : null;
              if (scoreA === null && scoreB === null) return 0;
              if (scoreA === null) return 1;
              if (scoreB === null) return -1;
              return ctRecommendedSort === "best" ? scoreB - scoreA : scoreA - scoreB;
            })
            .map((rec, idx) => {
              const recDbId =
                typeof rec.studentId === "number" && Number.isFinite(rec.studentId) ? rec.studentId : null;
              const matchedCourseStudent =
                recDbId != null
                  ? ctCourseStudents.find((s) => H.ctCourseStudentDbId(s) === recDbId)
                  : typeof rec.userId === "number" && Number.isFinite(rec.userId)
                    ? ctCourseStudents.find((s) => H.ctCourseStudentUserId(s) === rec.userId)
                    : undefined;
              const matchedStudentDbId =
                matchedCourseStudent != null ? H.ctCourseStudentDbId(matchedCourseStudent) : null;
              const receiverUniversityId = (
                matchedCourseStudent?.universityId ??
                matchedCourseStudent?.UniversityId ??
                ""
              ).trim();
              const receiverExistsInCourseStudents = receiverUniversityId !== "";
              const isSelf = myUserId != null && typeof rec.userId === "number" && rec.userId === myUserId;
              const inTeam = matchedStudentDbId != null && teamMemberDbIds.has(matchedStudentDbId);
              const pendingOut =
                matchedStudentDbId != null && outgoingPendingReceiverDbIds.has(matchedStudentDbId);
              const isSendingThisRow =
                ctSendingReceiverUniversityId != null &&
                receiverUniversityId !== "" &&
                ctSendingReceiverUniversityId === receiverUniversityId;
              const recSkills = Array.isArray(rec.skills) ? rec.skills.filter((s): s is string => typeof s === "string") : [];

              return (
                <View key={`rec-${idx}-${rec.studentId ?? rec.userId ?? idx}`} style={styles.recCard}>
                  <View style={styles.recTop}>
                    <Text style={styles.recName}>{rec.name ?? "—"}</Text>
                    {typeof rec.matchScore === "number" ? (
                      <Text style={styles.recScore}>{Math.round(rec.matchScore)}%</Text>
                    ) : null}
                  </View>
                  {rec.reason ? <Text style={styles.mutedSmall}>{rec.reason}</Text> : null}
                  {recSkills.length > 0 ? (
                    <View style={styles.chipsWrap}>
                      {recSkills.slice(0, 8).map((sk) => (
                        <View key={sk} style={styles.skillChip}>
                          <Text style={styles.skillChipText}>{sk}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {!isSelf && !inTeam && !pendingOut && receiverExistsInCourseStudents ? (
                    <Pressable
                      onPress={() => void handleCourseTeamsSendPartnerRequest(receiverUniversityId)}
                      disabled={isSendingThisRow || ctPartnerRequestBlockedNoSection}
                      style={[styles.inviteRowBtn, (isSendingThisRow || ctPartnerRequestBlockedNoSection) && styles.disabled]}
                    >
                      <Text style={styles.inviteRowBtnText}>{isSendingThisRow ? "Sending…" : "Send request"}</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.mutedSmall}>
                      {isSelf ? "This is you" : inTeam ? "Already on your team" : pendingOut ? "Request pending" : "—"}
                    </Text>
                  )}
                </View>
              );
            })
        )}
      </ScrollView>
    );
  }, [
    ctSelectedCourseId,
    ctDetailsLoading,
    ctDetailsError,
    ctCourseDetail,
    ctProjectSetting,
    ctMyTeam,
    ctPartnerRequests,
    ctCourseStudents,
    ctCourseProjects,
    ctSelectedCourseProjectId,
    ctPartnerRequestBlockedNoSection,
    selectedCourse,
    ctIncomingRowAction,
    ctRecommendedPartners,
    ctRecommendedLoading,
    ctRecommendedMode,
    ctRecommendedSort,
    aiLoaded,
    ctSendingReceiverUniversityId,
    myUserId,
    ctRemovingMemberStudentId,
    ctLeavingCourse,
    fetchRecommendations,
    handleCourseTeamsLeaveCourse,
    handleCourseTeamsSendPartnerRequest,
    handleCtAcceptIncoming,
    handleCtRejectIncoming,
    handleCtRemoveTeamMember,
  ]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={[styles.sheet, { maxWidth: maxDashboardWidth, width: width - spacing.lg * 2 }]}>
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>Course Teams</Text>
              <Text style={styles.subtitle}>
                Pick a course to see project details, your team, classmates, and partner requests — all in one
                workspace.
              </Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeHit}>
              <Text style={styles.closeX}>✕</Text>
            </Pressable>
          </View>

          {ctCoursesLoading ? (
            <View style={styles.padded}>
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : ctCoursesError ? (
            <Text style={styles.err}>{ctCoursesError}</Text>
          ) : ctNoValidCourseIds && ctCourses.length === 0 ? (
            <Text style={styles.muted}>No valid courses found (invalid IDs)</Text>
          ) : ctCourses.length === 0 ? (
            <Text style={styles.muted}>You are not enrolled in any courses yet.</Text>
          ) : (
            <>
              <Text style={styles.labelSm}>Enrolled courses</Text>
              <FlatList
                horizontal
                data={ctCourses}
                keyExtractor={(c, index) => {
                  const id = getCourseId(c);
                  return id != null ? `course-${id}` : `course-idx-${index}`;
                }}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.courseList}
                renderItem={({ item: c }) => {
                  const id = getCourseId(c);
                  if (id == null) return null;
                  const sel = ctSelectedCourseId === id;
                  return (
                    <Pressable
                      onPress={() => setCtSelectedCourseId(id)}
                      style={[styles.courseChip, sel && styles.courseChipOn]}
                    >
                      <Text style={[styles.courseChipTitle, sel && styles.courseChipTitleOn]} numberOfLines={2}>
                        {c.name ?? `Course #${id}`}
                      </Text>
                      <Text style={[styles.courseChipMeta, sel && styles.courseChipMetaOn]} numberOfLines={1}>
                        {c.code ?? ""}
                        {c.section ? ` · ${c.section}` : ""}
                      </Text>
                    </Pressable>
                  );
                }}
              />
              {detailBody}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.labelSm}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: spacing.lg,
  },
  sheet: {
    flex: 1,
    marginTop: spacing.xl,
    backgroundColor: "#fff",
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  subtitle: { marginTop: 6, fontSize: 12, color: "#64748b", lineHeight: 18 },
  closeHit: { padding: spacing.sm },
  closeX: { fontSize: 18, color: "#64748b", fontWeight: "700" },
  padded: { padding: spacing.lg, alignItems: "center", gap: spacing.sm },
  muted: { fontSize: 13, color: "#64748b", lineHeight: 20 },
  mutedSmall: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  err: { color: "#dc2626", fontSize: 13, fontWeight: "600" },
  labelSm: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  sectionSub: { fontSize: 12, color: "#64748b", marginBottom: spacing.md, lineHeight: 18 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  kv: { width: "47%", minWidth: 120 },
  kvValue: { marginTop: 4, fontSize: 13, fontWeight: "600", color: "#0f172a" },
  block: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  hint: { fontSize: 12, color: "#475569", marginBottom: spacing.sm, lineHeight: 18 },
  projectChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  projectChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    maxWidth: "100%",
  },
  projectChipOn: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  projectChipText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  projectChipTextOn: { color: "#4338ca" },
  bodyStrong: { marginTop: spacing.sm, fontSize: 13, fontWeight: "700", color: "#0f172a" },
  body: { marginTop: 4, fontSize: 13, color: "#334155", lineHeight: 20 },
  leaveBtn: {
    marginTop: spacing.lg,
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff",
  },
  leaveBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 12 },
  disabled: { opacity: 0.55 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: spacing.md,
  },
  memberName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  removeMini: { padding: spacing.sm },
  removeMiniText: { color: "#ef4444", fontWeight: "700", fontSize: 12 },
  statRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md, flexWrap: "wrap" },
  statPill: {
    flex: 1,
    minWidth: 120,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statLabel: { fontSize: 11, color: "#64748b", fontWeight: "700" },
  statValue: { marginTop: 4, fontSize: 20, fontWeight: "800", color: "#0f172a" },
  incomingCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "#faf5ff",
    borderWidth: 1,
    borderColor: "#e9d5ff",
    marginBottom: spacing.sm,
  },
  incomingTitle: { fontSize: 14, fontWeight: "700", color: "#334155" },
  rowGap: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  acceptBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  rejectBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  rejectBtnText: { color: "#64748b", fontWeight: "700", fontSize: 12 },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  modeChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  modeChipOn: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  modeChipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  genBtn: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    marginBottom: spacing.md,
  },
  genBtnText: { color: "#4338ca", fontWeight: "700", fontSize: 12 },
  recCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    marginBottom: spacing.sm,
  },
  recTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  recName: { flex: 1, fontSize: 15, fontWeight: "700", color: "#0f172a" },
  recScore: { fontSize: 12, fontWeight: "700", color: "#6366f1", paddingHorizontal: spacing.sm, paddingVertical: 4 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: spacing.sm },
  skillChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#faf5ff",
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  skillChipText: { fontSize: 10, color: "#a855f7", fontWeight: "600" },
  inviteRowBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    alignSelf: "flex-start",
  },
  inviteRowBtnText: { color: "#6366f1", fontWeight: "700", fontSize: 12 },
  warnBanner: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: spacing.md,
  },
  warnText: { color: "#92400e", fontSize: 13, fontWeight: "600", lineHeight: 20 },
  courseList: { paddingVertical: spacing.sm, gap: spacing.sm },
  courseChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    marginRight: spacing.sm,
    maxWidth: 220,
  },
  courseChipOn: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  courseChipTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  courseChipTitleOn: { color: "#312e81" },
  courseChipMeta: { fontSize: 11, color: "#64748b", marginTop: 2 },
  courseChipMetaOn: { color: "#4338ca" },
  detailScroll: { paddingBottom: spacing.xxl },
});
