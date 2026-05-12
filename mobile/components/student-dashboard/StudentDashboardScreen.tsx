import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import api, { parseApiErrorMessage } from "@/api/axiosInstance";
import { aiApi } from "@/api/ai";
import { getDashboardSummary, getGraduationProjectsMyEnvelope } from "@/api/dashboardApi";
import type { SuggestedTeammate } from "@/api/dashboardApi";
import {
  abstractForApi,
  changeProjectLeader,
  createGraduationProject,
  getRecommendedStudents,
  getRecommendedSupervisors as fetchGraduationRecommendedSupervisors,
  isEngineeringOrITFaculty,
  projectTypeForApi,
  removeProjectMember,
  updateGraduationProject,
  type GradProject,
  type GradProjectMember,
  type GradProjectRecommendedStudent,
  type GradProjectRecommendedSupervisor,
  type GraduationProjectType,
} from "@/api/gradProjectApi";
import { acceptInvitation, getReceivedInvitations, rejectInvitation, sendInvitation } from "@/api/invitationsApi";
import {
  fetchTotalUnreadNotificationCount,
  fetchUnreadChatNotificationCount,
} from "@/api/notificationsApi";
import { getRecommendedSupervisors, requestSupervisor } from "@/api/supervisorApi";
import type { Supervisor } from "@/api/supervisorApi";
import { getEnrolledCourses, getCoursePartnerRequests } from "@/api/studentCoursesApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { subscribeInboxNotificationCreated } from "@/lib/notificationsHubInbox";
import { clearSession, getItem } from "@/utils/authStorage";
import { getCourseId } from "@/utils/getCourseId";

import { CourseTeamsModal } from "./CourseTeamsModal";
import {
  enrichAiSupervisorsWithRecommended,
  mergeAiSupervisorCardRequestState,
  type AiSupervisionSnapshot,
  type AiSupervisorCardRequestState,
  type AiSupervisorRecommendUiState,
  type EnrichedAiSupervisorRow,
} from "./enrichAiSupervisors";
import { normApiStatus } from "./courseTeamsHelpers";

function formatSupervisorDoctorName(raw: string): string {
  const t = raw.trim();
  if (!t) return "—";
  if (/^dr\.?\s/i.test(t)) return t;
  return `Dr. ${t}`;
}

interface StudentProfile {
  name: string;
  email: string;
  role: string;
  university?: string;
  faculty?: string;
  major?: string;
  academicYear?: string;
  gpa?: string;
  generalSkills?: string[];
  majorSkills?: string[];
  profilePic?: string | null;
}

interface GlobalSearchStudentResult {
  id: number;
  name: string;
  email: string;
  major: string;
}

interface GlobalSearchDoctorResult {
  id: number;
  name: string;
  email: string;
  specialization: string;
}

interface GlobalSearchResponse {
  students: GlobalSearchStudentResult[];
  doctors: GlobalSearchDoctorResult[];
}

interface RecommendedProject {
  id: number;
  title: string;
  description: string | null;
  abstract?: string | null;
  lookingFor: string[];
  matchScore: number;
  maxTeamSize: number | null;
  dueDate: string | null;
  formationMode: "students" | "doctor";
}

interface Invitation {
  id: number;
  project: string;
  invitedBy: string;
}

interface Application {
  id: number;
  project: string;
  status: string;
}

export function StudentDashboardScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, maxDashboardWidth, isCompact, isTablet, innerWidth } = useResponsiveLayout();

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = useCallback((msg: string, variant: "success" | "error") => {
    setToast({ msg, ok: variant === "success" });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResponse | null>(null);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);

  const [user, setUser] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [teammates, setTeammates] = useState<SuggestedTeammate[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<RecommendedProject[]>([]);
  const [applications] = useState<Application[]>([]);
  const [inviteLoading, setInviteLoading] = useState<number | null>(null);
  const [inviteMsg, setInviteMsg] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  const [removeMsg, setRemoveMsg] = useState<{ msg: string; ok: boolean } | null>(null);
  const [promotingId, setPromotingId] = useState<number | null>(null);
  const [leaderMsg, setLeaderMsg] = useState<{ msg: string; ok: boolean } | null>(null);

  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [courseTeamsModalOpen, setCourseTeamsModalOpen] = useState(false);

  const [ctDashCardCoursesCount, setCtDashCardCoursesCount] = useState<number | null>(null);
  const [ctDashCardRequestsCount, setCtDashCardRequestsCount] = useState<number | null>(null);

  const [gradProject, setGradProject] = useState<GradProject | null>(null);
  const [gradLoading, setGradLoading] = useState(false);
  const [gradModalOpen, setGradModalOpen] = useState(false);
  const [gradModalMode, setGradModalMode] = useState<"create" | "edit">("create");
  const [gradForm, setGradForm] = useState<{
    name: string;
    abstract: string;
    skills: string;
    teamSize: string;
    projectType: GraduationProjectType;
  }>({ name: "", abstract: "", skills: "", teamSize: "", projectType: "GP" });
  const [gradFormError, setGradFormError] = useState<string | null>(null);
  const [gradFormFieldErrors, setGradFormFieldErrors] = useState<{ abstract?: string; skills?: string }>({});
  const [gradSubmitting, setGradSubmitting] = useState(false);
  const [addTeammatesOpen, setAddTeammatesOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [aiStudents, setAiStudents] = useState<GradProjectRecommendedStudent[]>([]);
  const [aiSupervisors, setAiSupervisors] = useState<GradProjectRecommendedSupervisor[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [aiStudentsError, setAiStudentsError] = useState<string | null>(null);
  const [aiSupervisorsError, setAiSupervisorsError] = useState<string | null>(null);

  const [myRole, setMyRole] = useState<"owner" | "leader" | "member" | null>(null);
  const myUserIdRef = useRef<number | null>(null);
  const [myStudentId, setMyStudentId] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<GradProjectMember[]>([]);
  const [currentMembers, setCurrentMembers] = useState(0);
  const [isFull, setIsFull] = useState(false);

  const [aiRecommendUiState, setAiRecommendUiState] = useState<AiSupervisorRecommendUiState>("idle");
  const [aiRecommendItems, setAiRecommendItems] = useState<EnrichedAiSupervisorRow[]>([]);
  const [aiRecommendError, setAiRecommendError] = useState<string | null>(null);
  const [aiSupervisorCardRequests, setAiSupervisorCardRequests] = useState<
    Record<number, AiSupervisorCardRequestState>
  >({});

  const [aiCardInviteLoadingId, setAiCardInviteLoadingId] = useState<number | null>(null);
  const [aiCardSupervisorLoadingId, setAiCardSupervisorLoadingId] = useState<number | null>(null);

  const [totalNotifUnread, setTotalNotifUnread] = useState(0);
  const [chatNotifCount, setChatNotifCount] = useState(0);

  const [projectPreview, setProjectPreview] = useState<RecommendedProject | null>(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const supervisionUi = useMemo(() => {
    if (!gradProject) return { mode: "none" as const };
    if (gradProject.supervisor) {
      return { mode: "assigned" as const, supervisor: gradProject.supervisor };
    }
    const sr = normApiStatus(gradProject.supervisorRequestStatus);
    if (sr === "rejected") return { mode: "rejected" as const };
    if (sr === "pending") {
      const doctorName = gradProject.pendingSupervisor?.name?.trim() || "—";
      return { mode: "pending" as const, doctorName };
    }
    return { mode: "none" as const };
  }, [gradProject]);

  useEffect(() => {
    setAiRecommendUiState("idle");
    setAiRecommendItems([]);
    setAiRecommendError(null);
    setAiSupervisorCardRequests({});
  }, [gradProject?.id]);

  const aiSupervisionSnapshot = useMemo((): AiSupervisionSnapshot => {
    if (!gradProject) {
      return { hasAssignedSupervisor: false, requestStatusNorm: "", pendingDoctorId: null };
    }
    const requestStatusNorm = normApiStatus(gradProject.supervisorRequestStatus);
    const pendingDoctorId =
      requestStatusNorm === "pending" ? (gradProject.pendingSupervisor?.doctorId ?? null) : null;
    return {
      hasAssignedSupervisor: !!gradProject.supervisor,
      requestStatusNorm,
      pendingDoctorId,
    };
  }, [gradProject]);

  const fetchInvitations = useCallback(async () => {
    try {
      const received = await getReceivedInvitations();
      const pendingOnly = received
        .filter((i) => i.status?.toLowerCase() === "pending")
        .map((i) => ({
          id: i.invitationId,
          project: i.projectName,
          invitedBy: i.senderName,
        }));
      setInvitations(pendingOnly);
    } catch {
      /* non-critical */
    }
  }, []);

  const refreshCourseTeamsDashCardCounts = useCallback(async () => {
    try {
      const courses = await getEnrolledCourses();
      setCtDashCardCoursesCount(courses.length);
      if (courses.length === 0) {
        setCtDashCardRequestsCount(0);
        return;
      }
      const validCourseIds = courses.map((course) => getCourseId(course)).filter((id): id is number => id !== null);
      const prs = await Promise.all(validCourseIds.map((courseId) => getCoursePartnerRequests(courseId)));
      let total = 0;
      for (const pr of prs) {
        const inc = (pr.incoming ?? []).filter(
          (r) => normApiStatus(r.status ?? (r as { Status?: string }).Status) === "pending",
        ).length;
        const out = (pr.outgoing ?? []).filter((r) => {
          const st = normApiStatus(r.status ?? (r as { Status?: string }).Status);
          return st === "pending" || st === "";
        }).length;
        total += inc + out;
      }
      setCtDashCardRequestsCount(total);
    } catch {
      setCtDashCardRequestsCount(null);
    }
  }, []);

  useEffect(() => {
    if (courseTeamsModalOpen) return;
    void refreshCourseTeamsDashCardCounts();
  }, [courseTeamsModalOpen, refreshCourseTeamsDashCardCounts]);

  const refetchGradProject = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      try {
        if (!silent) setGradLoading(true);
        const { project, role } = await getGraduationProjectsMyEnvelope();
        setGradProject(project ?? null);
        setMyRole(role as "owner" | "leader" | "member" | null);
        if (project) {
          const members = project.members ?? [];
          setTeamMembers(members);
          setCurrentMembers(project.currentMembers ?? 0);
          setIsFull(project.isFull ?? false);
          const myRow = members.find((m) => m.userId === myUserIdRef.current);
          setMyStudentId(myRow?.studentId ?? null);
        } else {
          setTeamMembers([]);
          setCurrentMembers(0);
          setIsFull(false);
          setMyStudentId(null);
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          await clearSession();
          router.replace("/login");
        }
        setGradProject(null);
        setMyRole(null);
        setTeamMembers([]);
        setCurrentMembers(0);
        setIsFull(false);
        setMyStudentId(null);
      } finally {
        if (!silent) setGradLoading(false);
      }
    },
    [],
  );

  const refreshGradProjectAfterSupervisorRequest = useCallback(async () => {
    await refetchGradProject({ silent: true });
    setAiSupervisorCardRequests({});
    setTimeout(() => {
      void refetchGradProject({ silent: true });
    }, 450);
  }, [refetchGradProject]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setGlobalSearchResults(null);
      setGlobalSearchLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setGlobalSearchLoading(true);
        const res = await api.get<GlobalSearchResponse>("/search", { params: { query: q } });
        setGlobalSearchResults(res.data);
      } catch {
        setGlobalSearchResults({ students: [], doctors: [] });
      } finally {
        setGlobalSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const load = async () => {
      const token = await getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const profileRes = await api.get("/me");
        const data = profileRes.data as Record<string, unknown>;
        myUserIdRef.current = (data.id as number) ?? null;
        setUser({
          name: (data.name as string) || (data.fullName as string) || "",
          email: String(data.email ?? ""),
          role: String(data.role ?? (await getItem("role")) ?? "student"),
          university: data.university as string | undefined,
          faculty: data.faculty as string | undefined,
          major: data.major as string | undefined,
          academicYear: data.academicYear as string | undefined,
          gpa: data.gpa != null ? String(data.gpa) : undefined,
          generalSkills: (data.generalSkills as string[]) || [],
          majorSkills: (data.majorSkills as string[]) || [],
          profilePic: (data.profilePictureBase64 as string | null) ?? null,
        });
        try {
          const dashData = await getDashboardSummary();
          setTeammates(
            dashData.suggestedTeammates?.length > 0 ? dashData.suggestedTeammates : [],
          );
        } catch {
          setTeammates([]);
        }
        await refetchGradProject();
        await fetchInvitations();
      } catch {
        setUser({
          name: (await getItem("name")) ?? "",
          email: (await getItem("email")) ?? "",
          role: (await getItem("role")) ?? "student",
          generalSkills: [],
          majorSkills: [],
        });
        setTeammates([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [refetchGradProject, fetchInvitations]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const channelsRes = await api.get("/channels/my");
        const channels: { id: number }[] = channelsRes.data;
        const projectArrays = await Promise.all(
          channels.map((ch) =>
            api.get(`/channels/${ch.id}/projects`).then((r) => r.data).catch(() => []),
          ),
        );
        const mapped: RecommendedProject[] = projectArrays.flat().map((p: Record<string, unknown>) => ({
          id: Number(p.id),
          title: String(p.name ?? ""),
          description: (p.description as string | null) ?? null,
          abstract: (p.abstract as string | null) ?? null,
          lookingFor: (p.requiredSkills as string[]) ?? [],
          matchScore: 0,
          maxTeamSize: p.maxTeamSize != null ? Number(p.maxTeamSize) : null,
          dueDate: (p.dueDate as string | null) ?? null,
          formationMode: (p.formationMode as "students" | "doctor") ?? "students",
        }));
        setRecommendedProjects(mapped);
      } catch {
        setRecommendedProjects([]);
      }
    };
    void fetchProjects();
  }, []);

  useEffect(() => {
    const onChange = (s: AppStateStatus) => {
      if (s === "active") void fetchInvitations();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [fetchInvitations]);

  useEffect(() => {
    const interval = setInterval(fetchInvitations, 10_000);
    return () => clearInterval(interval);
  }, [fetchInvitations]);

  const notifTickRef = useRef<() => Promise<void>>(async () => undefined);
  useEffect(() => {
    const tick = async () => {
      try {
        const [total, c] = await Promise.all([
          fetchTotalUnreadNotificationCount(),
          fetchUnreadChatNotificationCount(),
        ]);
        setTotalNotifUnread(total);
        setChatNotifCount(c);
      } catch {
        /* ignore */
      }
    };
    notifTickRef.current = tick;
    void tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return subscribeInboxNotificationCreated(() => {
      void notifTickRef.current();
    });
  }, []);

  const handleLogout = async () => {
    await clearSession();
    router.replace("/login");
  };

  const openGradModal = useCallback(
    (mode: "create" | "edit") => {
      setGradModalMode(mode);
      setGradFormError(null);
      setGradFormFieldErrors({});
      if (mode === "edit" && gradProject) {
        setGradForm({
          name: gradProject.name,
          abstract: gradProject.abstract ?? "",
          skills: (gradProject.requiredSkills ?? []).join(", "),
          teamSize: String(gradProject.partnersCount),
          projectType: (gradProject.projectType as GraduationProjectType) ?? "GP",
        });
      } else {
        setGradForm({ name: "", abstract: "", skills: "", teamSize: "", projectType: "GP" });
      }
      setGradModalOpen(true);
    },
    [gradProject],
  );

  const handleGradSubmit = async () => {
    setGradFormError(null);
    setGradFormFieldErrors({});
    if (!gradForm.name.trim()) {
      setGradFormError("Project name is required.");
      return;
    }
    const size = parseInt(gradForm.teamSize, 10);
    if (!gradForm.teamSize || Number.isNaN(size) || size < 1) {
      setGradFormError("Please enter a valid team size.");
      return;
    }
    const skills = gradForm.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const fieldErrors: { abstract?: string; skills?: string } = {};
    if (!gradForm.abstract.trim()) fieldErrors.abstract = "Abstract is required";
    if (skills.length === 0) fieldErrors.skills = "At least one skill is required";
    if (Object.keys(fieldErrors).length > 0) {
      setGradFormFieldErrors(fieldErrors);
      return;
    }
    if (gradModalMode === "edit" && !gradProject) return;
    setGradSubmitting(true);
    try {
      const projectType = projectTypeForApi(user?.faculty, gradForm.projectType);
      const abstractPayload = abstractForApi(gradForm.abstract);
      if (gradModalMode === "edit") {
        await updateGraduationProject(gradProject!.id, {
          name: gradForm.name.trim(),
          abstract: abstractPayload,
          projectType,
          requiredSkills: skills,
          partnersCount: size,
        });
      } else {
        await createGraduationProject({
          name: gradForm.name.trim(),
          abstract: abstractPayload,
          projectType,
          requiredSkills: skills,
          partnersCount: size,
        });
      }
      setGradForm({ name: "", abstract: "", skills: "", teamSize: "", projectType: "GP" });
      setGradModalMode("create");
      setGradModalOpen(false);
      await refetchGradProject();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (gradModalMode === "edit" ? "Failed to save project. Please try again." : "Failed to create project. Please try again.");
      setGradFormError(msg);
    } finally {
      setGradSubmitting(false);
    }
  };

  const handleDeleteProject = () => {
    if (!gradProject) return;
    Alert.alert("Delete project", "Are you sure you want to delete this project?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/graduation-projects/${gradProject.id}`);
            await refetchGradProject();
          } catch (err: unknown) {
            Alert.alert("Error", parseApiErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleLeaveProject = () => {
    if (!gradProject) return;
    Alert.alert("Leave project", "Are you sure you want to leave this project?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/graduation-projects/${gradProject.id}/leave`);
            await refetchGradProject();
          } catch (err: unknown) {
            Alert.alert("Error", parseApiErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleRemoveMember = async (memberStudentId: number) => {
    if (!gradProject) return;
    setRemovingId(memberStudentId);
    setRemoveMsg(null);
    try {
      const result = await removeProjectMember(gradProject.id, memberStudentId);
      const updatedCount = result.currentMembers;
      setTeamMembers((prev) => prev.filter((m) => m.studentId !== memberStudentId));
      setCurrentMembers(updatedCount);
      setIsFull(updatedCount >= (gradProject?.partnersCount ?? 0));
      setRemoveMsg({ msg: "✓ Member removed.", ok: true });
    } catch (err: unknown) {
      setRemoveMsg({ msg: parseApiErrorMessage(err), ok: false });
    } finally {
      setRemovingId(null);
      setTimeout(() => setRemoveMsg(null), 3000);
    }
  };

  const handleMakeLeader = async (memberStudentId: number) => {
    if (!gradProject) return;
    setPromotingId(memberStudentId);
    setLeaderMsg(null);
    try {
      await changeProjectLeader(gradProject.id, memberStudentId);
      setTeamMembers((prev) =>
        prev.map((m) => {
          if (m.studentId === memberStudentId) return { ...m, role: "leader" as const };
          if (m.role === "leader") return { ...m, role: "member" as const };
          return m;
        }),
      );
      if (memberStudentId === myStudentId) setMyRole("leader");
      else setMyRole("member");
      setLeaderMsg({ msg: "✓ Leader updated.", ok: true });
    } catch (err: unknown) {
      setLeaderMsg({ msg: parseApiErrorMessage(err), ok: false });
    } finally {
      setPromotingId(null);
      setTimeout(() => setLeaderMsg(null), 3000);
    }
  };

  const handleInvite = async (id: number, action: "accept" | "reject") => {
    setInviteLoading(id);
    setInviteMsg(null);
    try {
      if (action === "accept") await acceptInvitation(id);
      else await rejectInvitation(id);
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      setInviteMsg({
        id,
        msg: action === "accept" ? "✅ Invitation accepted!" : "❌ Invitation rejected.",
        ok: action === "accept",
      });
      await fetchInvitations();
      if (action === "accept") await refetchGradProject();
    } catch (err: unknown) {
      const msg = parseApiErrorMessage(err);
      setInviteMsg({ id, msg, ok: false });
    } finally {
      setInviteLoading(null);
      setTimeout(() => setInviteMsg(null), 3000);
    }
  };

  const handleAiRecommendedStudents = useCallback(async () => {
    if (!gradProject) return;
    setLoadingStudents(true);
    setAiStudentsError(null);
    try {
      const result = await getRecommendedStudents(gradProject.id);
      setAiStudents(result);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Request failed.";
      setAiStudentsError(msg);
      setAiStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [gradProject]);

  const handleAiRecommendedSupervisorsJson = useCallback(async () => {
    if (!gradProject) return;
    setLoadingSupervisors(true);
    setAiSupervisorsError(null);
    try {
      const result = await fetchGraduationRecommendedSupervisors(gradProject.id);
      setAiSupervisors(result);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Request failed.";
      setAiSupervisorsError(msg);
      setAiSupervisors([]);
    } finally {
      setLoadingSupervisors(false);
    }
  }, [gradProject]);

  const handleAiCardInviteStudent = useCallback(
    async (studentId: number) => {
      if (!gradProject?.id) return;
      setAiCardInviteLoadingId(studentId);
      try {
        await sendInvitation(gradProject.id, studentId);
        showToast("Invitation sent", "success");
        void fetchInvitations();
      } catch (err: unknown) {
        showToast(parseApiErrorMessage(err), "error");
      } finally {
        setAiCardInviteLoadingId(null);
      }
    },
    [gradProject?.id, fetchInvitations, showToast],
  );

  const handleAiCardRequestSupervisor = useCallback(
    async (doctorId: number) => {
      if (!gradProject) return;
      setAiCardSupervisorLoadingId(doctorId);
      try {
        await requestSupervisor(gradProject.id, doctorId);
        await refreshGradProjectAfterSupervisorRequest();
        showToast("Request sent", "success");
      } catch (err: unknown) {
        showToast(parseApiErrorMessage(err), "error");
      } finally {
        setAiCardSupervisorLoadingId(null);
      }
    },
    [gradProject, refreshGradProjectAfterSupervisorRequest, showToast],
  );

  const handleRecommendSupervisors = useCallback(async () => {
    const projectId = gradProject?.id;
    if (projectId == null) return;
    setAiRecommendUiState("loading");
    setAiRecommendError(null);
    setAiRecommendItems([]);
    try {
      const aiRows = await aiApi.recommendSupervisors(projectId);
      let recommended: Supervisor[] = [];
      try {
        recommended = await getRecommendedSupervisors(projectId);
      } catch {
        /* optional */
      }
      const enriched = enrichAiSupervisorsWithRecommended(aiRows, recommended);
      setAiRecommendItems(enriched);
      setAiRecommendUiState(enriched.length === 0 ? "empty" : "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "We could not load AI recommendations. Please try again in a moment.";
      setAiRecommendError(msg);
      setAiRecommendItems([]);
      setAiRecommendUiState("error");
    }
  }, [gradProject?.id]);

  const handleAiRecommendRequestSupervisor = useCallback(
    async (doctorId: number) => {
      if (!gradProject) return;
      if (gradProject.supervisor) return;
      const sr = normApiStatus(gradProject.supervisorRequestStatus);
      if (sr === "pending" && gradProject.pendingSupervisor) {
        if (gradProject.pendingSupervisor.doctorId !== doctorId) return;
      }
      setAiSupervisorCardRequests((prev) => ({ ...prev, [doctorId]: { phase: "sending" } }));
      try {
        await requestSupervisor(gradProject.id, doctorId);
        await refreshGradProjectAfterSupervisorRequest();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to send supervisor request.";
        const lower = msg.toLowerCase();
        const treatAsPending =
          lower.includes("pending") ||
          lower.includes("already") ||
          lower.includes("exist") ||
          lower.includes("duplicate");
        if (treatAsPending) await refreshGradProjectAfterSupervisorRequest();
        else setAiSupervisorCardRequests((prev) => ({ ...prev, [doctorId]: { phase: "error", detail: msg } }));
      }
    },
    [gradProject, refreshGradProjectAfterSupervisorRequest],
  );

  const allSkills = [...(user?.generalSkills || []), ...(user?.majorSkills || [])];
  const completeness = Math.min(
    20 +
      (user?.university ? 15 : 0) +
      (user?.major ? 15 : 0) +
      (allSkills.length > 0 ? 20 : 0) +
      (user?.gpa ? 10 : 0) +
      (user?.profilePic ? 20 : 0),
    100,
  );

  const PROFILE_TASKS = useMemo(
    () => [
      { id: "1", label: "Add a profile picture", done: !!user?.profilePic },
      { id: "2", label: "Add general skills", done: (user?.generalSkills?.length || 0) > 0 },
      { id: "3", label: "Add major skills", done: (user?.majorSkills?.length || 0) > 0 },
      { id: "4", label: "Complete academic info", done: !!user?.major && !!user?.university },
      { id: "5", label: "Add preferred project topics", done: false },
    ],
    [user],
  );

  const canManageGradTeam = myRole === "owner" || myRole === "leader";

  const contentMax = Math.min(maxDashboardWidth, innerWidth);

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <View style={styles.loadingIcon} />
        <Text style={styles.loadingText}>Loading your dashboard…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {toast ? (
        <View style={[styles.toastBanner, toast.ok ? styles.toastOk : styles.toastErr]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: Math.max(spacing.xxl, insets.bottom + spacing.xl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.bgBlobTop, { right: -width * 0.22, top: -width * 0.28 }]} pointerEvents="none" />
        <View style={[styles.bgBlobBottom, { left: -width * 0.2, bottom: -width * 0.25 }]} pointerEvents="none" />

        <View style={[styles.inner, { maxWidth: contentMax, alignSelf: isTablet ? "center" : "stretch", width: "100%" }]}>
          {/* Nav */}
          <View style={styles.navRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoGlyph}>▲</Text>
              </View>
              <Text style={styles.logoText}>
                Skill<Text style={styles.logoAccent}>Swap</Text>
              </Text>
            </View>
            <View style={styles.navActions}>
              <Pressable
                onPress={() => router.push("/NotificationsPage" as Href)}
                style={styles.navIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={22} color="#475569" />
                {totalNotifUnread > 0 ? (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>
                      {totalNotifUnread > 99 ? "99+" : String(totalNotifUnread)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => router.push("/ChatPage" as Href)}
                style={styles.navIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Open messages"
              >
                <Ionicons name="chatbubbles-outline" size={22} color="#475569" />
                {chatNotifCount > 0 ? (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>
                      {chatNotifCount > 99 ? "99+" : String(chatNotifCount)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => setEditInfoOpen(true)}
                style={styles.navIconBtn}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <Ionicons name="settings-outline" size={22} color="#475569" />
              </Pressable>
              <Pressable
                onPress={() => void handleLogout()}
                style={styles.navIconBtn}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <Ionicons name="log-out-outline" size={22} color="#64748b" />
              </Pressable>
              <Pressable
                onPress={() => router.push("/ProfilePage" as Href)}
                style={styles.avatarWrap}
                accessibilityRole="button"
                accessibilityLabel="My profile"
              >
                {user?.profilePic ? (
                  <Image source={{ uri: user.profilePic }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarFallback}>
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() ?? "?"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.searchShell}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search students, projects, skills…"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {searchQuery.trim() !== "" ? (
            <View style={styles.searchDrop}>
              {globalSearchLoading ? (
                <Text style={styles.muted}>Searching…</Text>
              ) : (
                <>
                  <Text style={styles.searchGroupTitle}>Students</Text>
                  {(globalSearchResults?.students ?? []).length === 0 ? (
                    <Text style={styles.muted}>No students</Text>
                  ) : (
                    (globalSearchResults?.students ?? []).map((s) => (
                      <Pressable
                        key={`st-${s.id}`}
                        style={styles.searchHit}
                        onPress={() => {
                          setSearchQuery("");
                          setGlobalSearchResults(null);
                          router.push(`/StudentPublicProfilePage?userId=${s.id}` as Href);
                        }}
                      >
                        <Text style={styles.searchHitName}>{s.name}</Text>
                        <Text style={styles.searchHitMeta}>{s.major || s.email}</Text>
                      </Pressable>
                    ))
                  )}
                  <Text style={[styles.searchGroupTitle, { marginTop: spacing.md }]}>Doctors</Text>
                  {(globalSearchResults?.doctors ?? []).length === 0 ? (
                    <Text style={styles.muted}>No doctors</Text>
                  ) : (
                    (globalSearchResults?.doctors ?? []).map((d) => (
                      <Pressable
                        key={`dr-${d.id}`}
                        style={styles.searchHit}
                        onPress={() => {
                          setSearchQuery("");
                          setGlobalSearchResults(null);
                          router.push(`/DoctorPublicProfilePage?doctorId=${d.id}` as Href);
                        }}
                      >
                        <Text style={styles.searchHitName}>{d.name}</Text>
                        <Text style={styles.searchHitMeta}>{d.specialization || d.email}</Text>
                      </Pressable>
                    ))
                  )}
                </>
              )}
            </View>
          ) : null}

          {/* Hero */}
          <Text style={styles.greetingText}>
            {greeting} 👋
          </Text>
          <Text style={styles.heroName}>
            Welcome back, <Text style={styles.heroNameAccent}>{user?.name?.split(" ")[0] ?? "Student"}</Text>
          </Text>
          <Text style={styles.heroSub}>
            {[user?.major, user?.academicYear, user?.university].filter(Boolean).join(" · ") ||
              "Complete your profile to get started"}
          </Text>
          <View style={styles.skillRow}>
            {allSkills.length > 0 ? (
              allSkills.slice(0, 6).map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s}</Text>
                </View>
              ))
            ) : (
              <Pressable onPress={() => setEditInfoOpen(true)}>
                <Text style={styles.addSkills}>+ Add your skills</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.heroBtnRow}>
            <Pressable style={styles.heroBtnPrimary} onPress={() => setEditInfoOpen(true)}>
              <Text style={styles.heroBtnPrimaryText}>✏️ Profile strength</Text>
            </Pressable>
            <Pressable style={styles.heroBtnGhost} onPress={() => setProjectsModalOpen(true)}>
              <Text style={styles.heroBtnGhostText}>📁 Browse Projects</Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={[styles.statsGrid, isCompact && styles.statsGridStack]}>
            {[
              { label: "Suggested Teammates", value: teammates.length > 0 ? String(teammates.length) : "—" },
              { label: "Matched Projects", value: recommendedProjects.length > 0 ? String(recommendedProjects.length) : "—" },
              { label: "Best Match", value: teammates.length > 0 ? `${teammates[0].matchScore}%` : "—" },
              { label: "Team Invitations", value: invitations.length > 0 ? String(invitations.length) : "—" },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, isCompact && styles.statCardFull]}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Applications */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📋 My Applications</Text>
            </View>
            {applications.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No applications yet</Text>
              </View>
            ) : null}
          </View>

          {/* Invitations */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>👥 Team Invitations</Text>
            </View>
            {invitations.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No pending invitations</Text>
              </View>
            ) : (
              invitations.map((inv) => (
                <View key={inv.id} style={styles.inviteCard}>
                  <Text style={styles.inviteHint}>You were invited to join:</Text>
                  <Text style={styles.inviteProject}>{inv.project}</Text>
                  <Text style={styles.inviteBy}>by {inv.invitedBy}</Text>
                  {inviteMsg?.id === inv.id ? (
                    <Text style={[styles.inviteFeedback, inviteMsg.ok ? styles.okText : styles.muted]}>{inviteMsg.msg}</Text>
                  ) : (
                    <View style={styles.inviteActions}>
                      <Pressable
                        disabled={inviteLoading === inv.id}
                        onPress={() => void handleInvite(inv.id, "accept")}
                        style={[styles.acceptBtn, inviteLoading === inv.id && styles.disabled]}
                      >
                        <Text style={styles.acceptBtnText}>{inviteLoading === inv.id ? "…" : "✅ Accept"}</Text>
                      </Pressable>
                      <Pressable
                        disabled={inviteLoading === inv.id}
                        onPress={() => void handleInvite(inv.id, "reject")}
                        style={[styles.rejectBtn, inviteLoading === inv.id && styles.disabled]}
                      >
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Recent activity */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Recent Activity</Text>
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.muted}>Your recent actions will appear here</Text>
            </View>
          </View>

          {/* Graduation project */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>🎓 My Graduation Project</Text>
              {!gradProject && !gradLoading ? (
                <Pressable onPress={() => openGradModal("create")}>
                  <Text style={styles.cardAction}>+ Create</Text>
                </Pressable>
              ) : null}
            </View>
            {gradLoading ? (
              <ActivityIndicator color="#6366f1" />
            ) : !gradProject ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>You don&apos;t have a graduation project yet</Text>
                <Text style={styles.muted}>Create your graduation project and find teammates</Text>
                <Pressable style={styles.ctaBtn} onPress={() => openGradModal("create")}>
                  <Text style={styles.ctaBtnText}>Create Graduation Project</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.gradPanel}>
                <View style={styles.gradHead}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.gradTitle}>{gradProject.name}</Text>
                    <View style={[styles.badge, gradProject.isOwner ? styles.badgeOwner : styles.badgeMember]}>
                      <Text style={[styles.badgeText, gradProject.isOwner && styles.badgeTextOn]}>
                        {gradProject.isOwner ? "👑 Owner" : "👥 Member"}
                      </Text>
                    </View>
                  </View>
                  {gradProject.isOwner ? (
                    <View style={styles.row}>
                      <Pressable onPress={() => openGradModal("edit")}>
                        <Text style={styles.linkBtn}>✏️ Edit</Text>
                      </Pressable>
                      <Pressable onPress={handleDeleteProject}>
                        <Text style={styles.dangerLink}>🗑 Delete</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={handleLeaveProject}>
                      <Text style={styles.mutedLink}>Leave</Text>
                    </Pressable>
                  )}
                </View>
                {(gradProject.abstract ?? "").trim() ? (
                  <Text style={styles.gradAbstract}>{(gradProject.abstract ?? "").trim()}</Text>
                ) : null}
                <Text style={styles.mutedSmall}>by {gradProject.ownerName ?? "—"}</Text>
                {(gradProject.requiredSkills ?? []).length > 0 ? (
                  <View style={styles.skillRow}>
                    {(gradProject.requiredSkills ?? []).map((sk) => (
                      <View key={sk} style={styles.skillChipSm}>
                        <Text style={styles.skillChipSmText}>{sk}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <Pressable style={styles.outlineBtn} onPress={() => void handleAiRecommendedStudents()} disabled={loadingStudents}>
                  <Text style={styles.outlineBtnText}>
                    {loadingStudents ? "Loading…" : "Find Best Teammates (AI)"}
                  </Text>
                </Pressable>
                {aiStudentsError ? <Text style={styles.errText}>{aiStudentsError}</Text> : null}
                {aiStudents.map((s) => (
                  <View key={s.studentId} style={styles.aiCard}>
                    <View style={styles.aiCardTop}>
                      <Text style={styles.aiName}>{s.name}</Text>
                      <Text style={styles.aiScore}>{s.matchScore}%</Text>
                    </View>
                    <Text style={styles.muted}>{s.major}</Text>
                    <Text style={styles.mutedSmall}>{s.university}</Text>
                    <View style={styles.skillRow}>
                      {(s.skills ?? []).slice(0, 6).map((sk) => (
                        <View key={`${s.studentId}-${sk}`} style={styles.skillChipSm}>
                          <Text style={styles.skillChipSmText}>{sk}</Text>
                        </View>
                      ))}
                    </View>
                    {gradProject.isOwner ? (
                      <Pressable
                        disabled={isFull || aiCardInviteLoadingId === s.studentId}
                        onPress={() => void handleAiCardInviteStudent(s.studentId)}
                        style={[styles.outlineBtn, (isFull || aiCardInviteLoadingId === s.studentId) && styles.disabled]}
                      >
                        <Text style={styles.outlineBtnText}>
                          {aiCardInviteLoadingId === s.studentId ? "Sending…" : "Invite"}
                        </Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={[styles.outlineBtn, { marginTop: spacing.sm }]}
                      onPress={() =>
                        router.push(`/StudentPublicProfilePage?profileId=${s.studentId}` as Href)
                      }
                    >
                      <Text style={styles.outlineBtnText}>View profile</Text>
                    </Pressable>
                  </View>
                ))}

                <Pressable
                  style={[styles.outlineBtn, { marginTop: spacing.md }]}
                  onPress={() => void handleAiRecommendedSupervisorsJson()}
                  disabled={loadingSupervisors}
                >
                  <Text style={styles.outlineBtnText}>
                    {loadingSupervisors ? "Loading…" : "Recommend Supervisors (AI)"}
                  </Text>
                </Pressable>
                {aiSupervisorsError ? <Text style={styles.errText}>{aiSupervisorsError}</Text> : null}
                {aiSupervisors.map((sup) => (
                  <View key={sup.doctorId} style={styles.aiCard}>
                    <View style={styles.aiCardTop}>
                      <Text style={styles.aiName}>{sup.name}</Text>
                      <Text style={styles.aiScore}>{sup.matchScore}%</Text>
                    </View>
                    <Text style={styles.muted}>{sup.specialization}</Text>
                    <Pressable
                      style={[styles.outlineBtn, { marginTop: spacing.sm }]}
                      onPress={() =>
                        router.push(`/DoctorPublicProfilePage?profileId=${sup.doctorId}` as Href)
                      }
                    >
                      <Text style={styles.outlineBtnText}>View profile</Text>
                    </Pressable>
                    {myRole === "owner" || myRole === "leader" ? (
                      <View style={{ marginTop: spacing.sm }}>
                        {gradProject.supervisor ? null : normApiStatus(gradProject.supervisorRequestStatus) === "pending" &&
                          gradProject.pendingSupervisor != null &&
                          gradProject.pendingSupervisor.doctorId === sup.doctorId ? (
                          <Text style={styles.okText}>Request pending</Text>
                        ) : normApiStatus(gradProject.supervisorRequestStatus) === "pending" &&
                          gradProject.pendingSupervisor != null &&
                          gradProject.pendingSupervisor.doctorId !== sup.doctorId ? (
                          <Text style={styles.muted}>Another request is pending</Text>
                        ) : (
                          <Pressable
                            disabled={aiCardSupervisorLoadingId === sup.doctorId}
                            onPress={() => void handleAiCardRequestSupervisor(sup.doctorId)}
                            style={[styles.outlineBtn, aiCardSupervisorLoadingId === sup.doctorId && styles.disabled]}
                          >
                            <Text style={styles.outlineBtnText}>
                              {aiCardSupervisorLoadingId === sup.doctorId ? "Sending…" : "Request"}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    ) : null}
                  </View>
                ))}

                {/* AI merged supervisor list */}
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={styles.blockTitle}>AI supervisor recommendations</Text>
                  <Text style={styles.mutedSmall}>Ranked matches from your project context and required skills.</Text>
                  {!canManageGradTeam ? (
                    <Text style={styles.muted}>
                      Only the project owner or team leader can run AI recommendations and send requests.
                    </Text>
                  ) : (
                    <Pressable
                      onPress={() => void handleRecommendSupervisors()}
                      disabled={aiRecommendUiState === "loading" || supervisionUi.mode === "pending"}
                      style={[styles.ctaBtn, (aiRecommendUiState === "loading" || supervisionUi.mode === "pending") && styles.disabled]}
                    >
                      <Text style={styles.ctaBtnText}>
                        {aiRecommendUiState === "loading" ? "Analyzing…" : "✨ Run AI match"}
                      </Text>
                    </Pressable>
                  )}
                  {aiRecommendError ? <Text style={styles.errText}>{aiRecommendError}</Text> : null}
                  {aiRecommendItems.map((row) => {
                    const merged = mergeAiSupervisorCardRequestState(row.doctorId, aiSupervisionSnapshot, aiSupervisorCardRequests[row.doctorId]);
                    const displayName = row.name?.trim() ? formatSupervisorDoctorName(row.name) : "—";
                    return (
                      <View key={row.doctorId} style={styles.aiCard}>
                        <Text style={styles.aiName}>{displayName}</Text>
                        <Text style={styles.muted}>{row.specialization ?? row.reason}</Text>
                        <Text style={styles.mutedSmall}>{row.matchScore}% match</Text>
                        <Pressable
                          style={[styles.outlineBtn, { marginTop: spacing.sm }]}
                          onPress={() =>
                            router.push(`/DoctorPublicProfilePage?profileId=${row.doctorId}` as Href)
                          }
                        >
                          <Text style={styles.outlineBtnText}>View profile</Text>
                        </Pressable>
                        {canManageGradTeam && merged.phase === "idle" ? (
                          <Pressable
                            style={styles.outlineBtn}
                            onPress={() => void handleAiRecommendRequestSupervisor(row.doctorId)}
                          >
                            <Text style={styles.outlineBtnText}>Request supervisor</Text>
                          </Pressable>
                        ) : (
                          <Text style={styles.mutedSmall}>{merged.detail ?? merged.phase}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Team */}
                <View style={styles.teamBlock}>
                  <View style={styles.teamHead}>
                    <Text style={styles.teamHeadText}>TEAM</Text>
                    <Text style={styles.teamCount}>
                      {currentMembers} / {gradProject.partnersCount}
                    </Text>
                    {isFull ? <Text style={styles.okText}>✓ Full</Text> : null}
                  </View>
                  {(removeMsg || leaderMsg) && (
                    <Text style={[styles.feedback, (removeMsg ?? leaderMsg)!.ok ? styles.okText : styles.errText]}>
                      {(removeMsg ?? leaderMsg)!.msg}
                    </Text>
                  )}
                  {teamMembers.length === 0 ? (
                    <Text style={styles.muted}>No members yet — invite students to join</Text>
                  ) : (
                    teamMembers.map((m) => {
                      const isLeader = m.role === "leader";
                      const showActions = canManageGradTeam && !isLeader;
                      const isSelf = myStudentId != null && m.studentId === myStudentId;
                      const canRemove = showActions && !isSelf;
                      const busy = removingId === m.studentId || promotingId === m.studentId;
                      return (
                        <View key={m.studentId} style={[styles.memberRow, busy && styles.disabled]}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.memberName}>
                              {m.name} {isLeader ? "· 👑" : ""} {isSelf ? "(You)" : ""}
                            </Text>
                            <Text style={styles.mutedSmall}>{m.major || m.university || "—"}</Text>
                          </View>
                          {canRemove ? (
                            <View style={styles.row}>
                              <Pressable onPress={() => void handleMakeLeader(m.studentId)} disabled={busy}>
                                <Text style={styles.linkBtn}>Leader</Text>
                              </Pressable>
                              <Pressable onPress={() => void handleRemoveMember(m.studentId)} disabled={busy}>
                                <Text style={styles.dangerLink}>{removingId === m.studentId ? "…" : "Remove"}</Text>
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                  {gradProject.isOwner && !isFull ? (
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => {
                        setAddTeammatesOpen(false);
                        const href = (gradProject.id
                          ? `/StudentsPage?projectId=${gradProject.id}`
                          : "/StudentsPage") as Href;
                        router.push(href);
                      }}
                    >
                      <Text style={styles.outlineBtnText}>👤 Find teammates</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            )}
          </View>

          {/* My courses */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📚 My Courses</Text>
            </View>
            <View style={[styles.ctDashGrid, isCompact && styles.ctDashGridStack]}>
              <View style={styles.ctPill}>
                <Text style={styles.ctPillLabel}>Enrolled courses</Text>
                <Text style={styles.ctPillValue}>{ctDashCardCoursesCount === null ? "—" : ctDashCardCoursesCount}</Text>
              </View>
              <View style={styles.ctPill}>
                <Text style={styles.ctPillLabel}>Partner activity</Text>
                <Text style={styles.ctPillValue}>{ctDashCardRequestsCount === null ? "—" : ctDashCardRequestsCount}</Text>
                <Text style={styles.ctPillHint}>Incoming & outgoing items</Text>
              </View>
            </View>
            <Text style={styles.muted}>
              View teams, project settings, classmates, and partner requests for each course — in one place.
            </Text>
            <Pressable style={styles.ctaBtn} onPress={() => setCourseTeamsModalOpen(true)}>
              <Text style={styles.ctaBtnText}>👥 Manage My Courses</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <CourseTeamsModal
        visible={courseTeamsModalOpen}
        onClose={() => setCourseTeamsModalOpen(false)}
        myUserId={myUserIdRef.current}
        onToast={(m, v) => showToast(m, v)}
        onDashCountsNeedRefresh={refreshCourseTeamsDashCardCounts}
      />

      {/* Profile strength */}
      <Modal visible={editInfoOpen} transparent animationType="fade" onRequestClose={() => setEditInfoOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditInfoOpen(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Strength</Text>
              <Pressable onPress={() => setEditInfoOpen(false)} hitSlop={8}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completeness}%` }]} />
              </View>
              <Text style={styles.progressPct}>{completeness}%</Text>
            </View>
            <Text style={styles.muted}>
              {completeness >= 80 ? "🔥 Strong profile!" : "Complete your profile to get better AI matches"}
            </Text>
            {PROFILE_TASKS.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <Text style={styles.taskIcon}>{task.done ? "✓" : "○"}</Text>
                <Text style={[styles.taskLabel, task.done && styles.taskDone]}>{task.label}</Text>
              </View>
            ))}
            <Pressable style={styles.modalCloseBtn} onPress={() => setEditInfoOpen(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Browse projects */}
      <Modal visible={projectsModalOpen} transparent animationType="slide" onRequestClose={() => setProjectsModalOpen(false)}>
        <View style={[styles.modalOverlayDark, { paddingTop: insets.top }]}>
          <View style={styles.projectsSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📁 Browse Projects</Text>
              <Pressable onPress={() => setProjectsModalOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.aiBannerText}>
              ✨ Showing projects matched to your skills — sorted by best fit
            </Text>
            <ScrollView>
              {recommendedProjects.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No projects available yet</Text>
                  <Text style={styles.muted}>Projects from your channels will appear here once published by your doctor.</Text>
                </View>
              ) : (
                recommendedProjects.map((project) => {
                  const body = (project.abstract ?? project.description ?? "").trim();
                  return (
                    <Pressable key={project.id} style={styles.projectRow} onPress={() => setProjectPreview(project)}>
                      <Text style={styles.projectRowTitle}>{project.title}</Text>
                      {body ? <Text style={styles.muted} numberOfLines={3}>{body}</Text> : null}
                      <Text style={styles.linkBtn}>View details</Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Pressable style={styles.modalCloseBtn} onPress={() => setProjectsModalOpen(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={projectPreview != null} transparent animationType="fade" onRequestClose={() => setProjectPreview(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setProjectPreview(null)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{projectPreview?.title}</Text>
            <Text style={styles.muted}>
              {(projectPreview?.abstract ?? projectPreview?.description ?? "").trim() || "—"}
            </Text>
            {projectPreview?.dueDate ? (
              <Text style={styles.mutedSmall}>
                Due {new Date(projectPreview.dueDate).toLocaleDateString()}
              </Text>
            ) : null}
            <Pressable style={styles.modalCloseBtn} onPress={() => setProjectPreview(null)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Grad create/edit */}
      <Modal visible={gradModalOpen} transparent animationType="slide" onRequestClose={() => setGradModalOpen(false)}>
        <View style={[styles.modalOverlayDark, { paddingTop: insets.top }]}>
          <ScrollView contentContainerStyle={styles.gradModalScroll}>
            <View style={styles.modalBoxWide}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {gradModalMode === "edit" ? "🎓 Edit Graduation Project" : "🎓 Create Graduation Project"}
                </Text>
                <Pressable
                  onPress={() => {
                    setGradModalOpen(false);
                    setGradFormError(null);
                    setGradFormFieldErrors({});
                    setGradModalMode("create");
                  }}
                >
                  <Text style={styles.modalClose}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.inputLabel}>Project name *</Text>
              <TextInput
                style={styles.input}
                value={gradForm.name}
                onChangeText={(t) => setGradForm((p) => ({ ...p, name: t }))}
                placeholder="e.g. Smart Health Monitoring"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.inputLabel}>Abstract *</Text>
              <TextInput
                style={[styles.input, styles.textArea, gradFormFieldErrors.abstract ? styles.inputErr : null]}
                multiline
                value={gradForm.abstract}
                onChangeText={(t) => {
                  setGradForm((p) => ({ ...p, abstract: t }));
                  setGradFormFieldErrors((prev) => {
                    if (!prev.abstract) return prev;
                    const n = { ...prev };
                    delete n.abstract;
                    return n;
                  });
                }}
                placeholder="Brief summary…"
                placeholderTextColor="#94a3b8"
              />
              {gradFormFieldErrors.abstract ? (
                <Text style={styles.errText}>{gradFormFieldErrors.abstract}</Text>
              ) : null}
              {isEngineeringOrITFaculty(user?.faculty) ? (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={styles.inputLabel}>Project type *</Text>
                  <View style={styles.row}>
                    {(["GP1", "GP2", "GP"] as const).map((opt) => {
                      const checked = gradForm.projectType === opt;
                      return (
                        <Pressable
                          key={opt}
                          onPress={() => setGradForm((p) => ({ ...p, projectType: opt }))}
                          style={[styles.typeChip, checked && styles.typeChipOn]}
                        >
                          <Text style={[styles.typeChipText, checked && styles.typeChipTextOn]}>{opt}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <Text style={styles.muted}>
                  Project type: <Text style={{ fontWeight: "700" }}>GP</Text> (required for your faculty)
                </Text>
              )}
              <Text style={styles.inputLabel}>Required skills * (comma-separated)</Text>
              <TextInput
                style={[styles.input, gradFormFieldErrors.skills ? styles.inputErr : null]}
                value={gradForm.skills}
                onChangeText={(t) => {
                  setGradForm((p) => ({ ...p, skills: t }));
                  setGradFormFieldErrors((prev) => {
                    if (!prev.skills) return prev;
                    const n = { ...prev };
                    delete n.skills;
                    return n;
                  });
                }}
                placeholder="React, Node, …"
                placeholderTextColor="#94a3b8"
              />
              {gradFormFieldErrors.skills ? <Text style={styles.errText}>{gradFormFieldErrors.skills}</Text> : null}
              <Text style={styles.inputLabel}>Number of partners *</Text>
              <View style={styles.row}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const sel = gradForm.teamSize === String(n);
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setGradForm((p) => ({ ...p, teamSize: String(n) }))}
                      style={[styles.sizeChip, sel && styles.sizeChipOn]}
                    >
                      <Text style={[styles.sizeChipText, sel && styles.sizeChipTextOn]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {gradFormError ? <Text style={styles.errText}>{gradFormError}</Text> : null}
              <View style={styles.row}>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => {
                    setGradModalOpen(false);
                    setGradFormError(null);
                    setGradFormFieldErrors({});
                    setGradModalMode("create");
                  }}
                >
                  <Text style={styles.modalCloseBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.ctaBtn, { flex: 1 }]}
                  disabled={gradSubmitting}
                  onPress={() => void handleGradSubmit()}
                >
                  <Text style={styles.ctaBtnText}>{gradSubmitting ? "Saving…" : gradModalMode === "edit" ? "Save" : "Create"}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add teammates */}
      <Modal visible={addTeammatesOpen} transparent animationType="fade" onRequestClose={() => setAddTeammatesOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddTeammatesOpen(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Find Teammates</Text>
              <Pressable onPress={() => setAddTeammatesOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.muted}>
              Browse suggested teammates from your dashboard summary. Invite students from the AI list above, or ask
              your supervisor for intros.
            </Text>
            {teammates.length > 0 ? (
              teammates.slice(0, 8).map((t) => (
                <View key={t.userId} style={styles.aiCard}>
                  <Text style={styles.aiName}>{t.name}</Text>
                  <Text style={styles.muted}>{t.major}</Text>
                  <Text style={styles.mutedSmall}>
                    {t.university} · {t.matchScore}% match
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>No suggestions yet — complete your profile for better matches.</Text>
            )}
            <Pressable
              style={styles.outlineBtn}
              onPress={() => {
                setAddTeammatesOpen(false);
                const href = (gradProject?.id
                  ? `/StudentsPage?projectId=${gradProject.id}`
                  : "/StudentsPage") as Href;
                router.push(href);
              }}
            >
              <Text style={styles.outlineBtnText}>Browse all students</Text>
            </Pressable>
            <Pressable style={styles.modalCloseBtn} onPress={() => setAddTeammatesOpen(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f7ff" },
  loadingPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f7ff",
    padding: spacing.xl,
  },
  loadingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    marginBottom: spacing.lg,
  },
  loadingText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  toastBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
  },
  toastOk: { backgroundColor: "#dcfce7" },
  toastErr: { backgroundColor: "#fee2e2" },
  toastText: { textAlign: "center", fontWeight: "600", color: "#0f172a" },
  scrollContent: { flexGrow: 1 },
  bgBlobTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(99,102,241,0.08)",
    zIndex: 0,
  },
  bgBlobBottom: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(168,85,247,0.06)",
    zIndex: 0,
  },
  inner: { zIndex: 1, paddingTop: spacing.sm },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlyph: { color: "#fff", fontSize: 12, fontWeight: "900", transform: [{ rotate: "90deg" }] },
  logoText: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  logoAccent: { color: "#7c3aed" },
  navActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  navIconBtn: {
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  navBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  navBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  notifPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  notifPillText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { fontSize: 16 },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { fontSize: 12, fontWeight: "800", color: "#6366f1" },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 14, color: "#0f172a" },
  searchDrop: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  searchGroupTitle: { fontSize: 11, fontWeight: "700", color: "#94a3b8", marginBottom: spacing.sm },
  searchHit: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  searchHitName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  searchHitMeta: { fontSize: 12, color: "#64748b" },
  greetingText: { fontSize: 14, color: "#64748b", fontWeight: "600", marginBottom: 4 },
  heroName: { fontSize: 26, fontWeight: "800", color: "#0f172a", marginBottom: spacing.sm },
  heroNameAccent: { color: "#6366f1" },
  heroSub: { fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: spacing.md },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  skillChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  skillChipText: { fontSize: 12, fontWeight: "600", color: "#4338ca" },
  skillChipSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  skillChipSmText: { fontSize: 10, color: "#475569", fontWeight: "600" },
  addSkills: { fontSize: 13, color: "#6366f1", fontWeight: "600" },
  heroBtnRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  heroBtnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#6366f1",
  },
  heroBtnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  heroBtnGhost: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    backgroundColor: "#fff",
  },
  heroBtnGhostText: { color: "#6366f1", fontWeight: "700", fontSize: 13 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.xl },
  statsGridStack: { flexDirection: "column" },
  statCard: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 0,
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statCardFull: { flexBasis: "auto", width: "100%" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "600", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: spacing.lg,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  cardAction: { fontSize: 13, fontWeight: "700", color: "#6366f1" },
  empty: { alignItems: "center", paddingVertical: spacing.lg },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#64748b" },
  muted: { fontSize: 13, color: "#64748b", lineHeight: 20 },
  mutedSmall: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  inviteCard: {
    padding: spacing.md,
    backgroundColor: "#faf5ff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e9d5ff",
    marginBottom: spacing.sm,
  },
  inviteHint: { fontSize: 13, fontWeight: "600", color: "#334155" },
  inviteProject: { fontSize: 15, fontWeight: "800", color: "#7c3aed", marginTop: 2 },
  inviteBy: { fontSize: 12, color: "#64748b", marginTop: 2 },
  inviteFeedback: { marginTop: spacing.sm, fontWeight: "700" },
  inviteActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  acceptBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: "#6366f1", alignItems: "center" },
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
  gradPanel: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.15)",
    backgroundColor: "rgba(99,102,241,0.04)",
  },
  gradHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.sm },
  gradTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  badge: { alignSelf: "flex-start", marginTop: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 20 },
  badgeOwner: { backgroundColor: "#6366f1" },
  badgeMember: { backgroundColor: "#e0e7ff" },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#6366f1" },
  badgeTextOn: { color: "#fff" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  linkBtn: { fontSize: 12, fontWeight: "700", color: "#6366f1" },
  dangerLink: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  mutedLink: { fontSize: 12, color: "#94a3b8" },
  gradAbstract: { fontSize: 13, color: "#64748b", lineHeight: 20, marginTop: spacing.sm },
  outlineBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#fff",
  },
  outlineBtnText: { color: "#6366f1", fontWeight: "700", fontSize: 12 },
  ctaBtn: {
    marginTop: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#6d28d9",
    alignItems: "center",
  },
  ctaBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  aiCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  aiCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  aiName: { flex: 1, fontSize: 15, fontWeight: "800", color: "#0f172a" },
  aiScore: { fontSize: 12, fontWeight: "700", color: "#6366f1" },
  blockTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  teamBlock: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: "rgba(99,102,241,0.12)" },
  teamHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm, flexWrap: "wrap" },
  teamHeadText: { fontSize: 10, fontWeight: "800", color: "#64748b", letterSpacing: 1 },
  teamCount: { fontSize: 11, fontWeight: "700", color: "#6366f1" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: spacing.md,
  },
  memberName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  feedback: { marginTop: spacing.sm, fontSize: 12, fontWeight: "600" },
  okText: { color: "#16a34a" },
  errText: { color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: spacing.sm },
  ctDashGrid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  ctDashGridStack: { flexDirection: "column" },
  ctPill: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  ctPillLabel: { fontSize: 11, color: "#64748b", fontWeight: "700" },
  ctPillValue: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginTop: 4 },
  ctPillHint: { fontSize: 10, color: "#94a3b8", marginTop: 4 },
  disabled: { opacity: 0.55 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  modalBoxWide: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a", flex: 1 },
  modalClose: { fontSize: 18, color: "#64748b", fontWeight: "700" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#e2e8f0", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#6366f1", borderRadius: 4 },
  progressPct: { fontSize: 13, fontWeight: "800", color: "#6366f1" },
  taskRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  taskIcon: { width: 20, textAlign: "center", color: "#6366f1", fontWeight: "800" },
  taskLabel: { flex: 1, fontSize: 13, color: "#475569", fontWeight: "500" },
  taskDone: { textDecorationLine: "line-through", opacity: 0.45 },
  modalCloseBtn: {
    marginTop: spacing.lg,
    alignSelf: "flex-end",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalCloseBtnText: { fontWeight: "700", color: "#64748b" },
  projectsSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    maxHeight: "88%",
  },
  aiBannerText: {
    fontSize: 12,
    color: "#4c1d95",
    fontWeight: "600",
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: "#faf5ff",
    borderRadius: radius.md,
  },
  projectRow: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  projectRowTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  gradModalScroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  inputLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 6, textTransform: "uppercase" },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
    marginBottom: spacing.md,
    backgroundColor: "#f8fafc",
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  inputErr: { borderColor: "#ef4444" },
  typeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  typeChipOn: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  typeChipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  typeChipTextOn: { color: "#4338ca" },
  sizeChip: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  sizeChipOn: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  sizeChipText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  sizeChipTextOn: { color: "#6366f1" },
});
