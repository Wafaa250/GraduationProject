import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Settings,
  ChevronRight,
  Users,
  BookOpen,
  CheckCircle2,
  Circle,
  Briefcase,
  MessageCircle,
  Activity,
  LogOut,
  UserPlus,
  Trophy,
  Sparkles,
  X,
  Trash2,
} from "lucide-react";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
  getDashboardSummary,
  getGraduationProjectsMyEnvelope,
  SuggestedTeammate,
} from "../../../api/dashboardApi";
import { getReceivedInvitations, sendInvitation } from "../../../api/invitationsApi";
import type {
  GradProject,
  GradProjectMember,
  GraduationProjectType,
  GradProjectRecommendedStudent,
  GradProjectRecommendedSupervisor,
} from "../../../api/gradProjectApi";
import {
  removeProjectMember,
  changeProjectLeader,
  createGraduationProject,
  updateGraduationProject,
  isEngineeringOrITFaculty,
  abstractForApi,
  projectTypeForApi,
  getRecommendedStudents,
  getRecommendedSupervisors as fetchGraduationRecommendedSupervisors,
} from "../../../api/gradProjectApi";
import {
  getRecommendedSupervisors,
  requestSupervisor,
  type Supervisor,
} from "../../../api/supervisorApi";
import { aiApi } from "../../../api/ai";
import { getHomePath } from "../../../utils/homeNavigation";
import { getCourseId } from "../../../utils/normalize";
import {
  AiSupervisorRecommendations,
  enrichAiSupervisorsWithRecommended,
  type AiSupervisionSnapshot,
  type AiSupervisorCardRequestState,
  type AiSupervisorRecommendUiState,
  type EnrichedAiSupervisorRow,
} from "../../components/project/AiSupervisorRecommendations";
import ProfileLink, { getProfileUrl } from "../../components/common/ProfileLink";
import { useToast } from "../../../context/ToastContext";
import { GradProjectNotificationBell } from "../../components/notifications/GradProjectNotificationBell";
import {
  acceptPartnerRequest,
  createPartnerRequest,
  getCourseById,
  getCoursePartnerRequests,
  getCourseProjectSetting,
  getRecommendedPartners,
  getCourseStudents,
  getEnrolledCourses,
  getMyTeam,
  leaveCourse,
  rejectPartnerRequest,
  removeTeamMember,
  normalizeCourseProjectsFromDetail,
  type CourseDetails,
  type CourseProjectSetting,
  type CourseStudent,
  type EnrolledCourse,
  type MyTeamResponse,
  type PartnerRequest,
  type PartnerRequestsResponse,
  type RecommendedPartner,
  type RecommendedPartnerMode,
  type TeamMember,
} from "../../../api/studentCoursesApi";

function normApiStatus(s?: string | null): string {
  return s?.toString().trim().toLowerCase() ?? "";
}

/** Display line for supervisor name with Dr. prefix when appropriate */
function formatSupervisorDoctorName(raw: string): string {
  const t = raw.trim();
  if (!t) return "—";
  if (/^dr\.?\s/i.test(t)) return t;
  return `Dr. ${t}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
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
  /** Channel/course body; display uses `abstract ?? description` */
  description: string | null;
  abstract?: string | null;
  lookingFor: string[];
  matchScore: number;
  maxTeamSize: number | null;
  dueDate: string | null;
  formationMode: "students" | "doctor";
}

interface Application {
  id: number;
  project: string;
  status: string;
}

interface Invitation {
  id: number;
  project: string;
  invitedBy: string;
}

// ─── Course Teams modal helpers (studentCoursesApi response shapes) ─────────────
function ctAsRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function ctReadTextField(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const raw = obj[key];
    if (typeof raw === "string" && raw.trim() !== "") return raw;
  }
  return "—";
}

function ctReadNumberField(
  obj: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const raw = obj[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function ctReadOptionalLink(
  obj: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const raw = obj[key];
    if (typeof raw === "string" && raw.trim() !== "") return raw;
  }
  return null;
}

function ctMemberDisplayName(member: TeamMember): string {
  if (member.name && member.name.trim() !== "") return member.name;
  return member.universityId;
}

function ctCourseStudentDbId(s: CourseStudent): number | null {
  const v = s.studentId ?? s.StudentId;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function ctCourseStudentUserId(s: CourseStudent): number | null {
  const v = s.userId ?? s.UserId;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function ctPartnerRequestReceiverDbId(r: PartnerRequest): number | null {
  if (
    typeof r.receiverStudentId === "number" &&
    Number.isFinite(r.receiverStudentId)
  ) {
    return r.receiverStudentId;
  }
  if (r.receiver) return ctCourseStudentDbId(r.receiver);
  return null;
}

/** Outgoing list is pending-only per product rules; tolerate empty/missing status. */
function ctIsOutgoingPendingPartnerRequest(r: PartnerRequest): boolean {
  const st = normApiStatus(r.status);
  return st === "pending" || st === "";
}

function ctPartnerRequestStatusRaw(req: PartnerRequest): string {
  const raw =
    req.status ?? (req as PartnerRequest & { Status?: string }).Status;
  return typeof raw === "string" ? raw : "";
}

/** Incoming actions only apply while the backend still has the request as pending. */
function ctIsIncomingPartnerRequestPending(req: PartnerRequest): boolean {
  return normApiStatus(ctPartnerRequestStatusRaw(req)) === "pending";
}

function ctPartnerRequestRowId(req: PartnerRequest): number | null {
  const id =
    req.requestId ??
    (req as PartnerRequest & { RequestId?: number }).RequestId;
  return typeof id === "number" && Number.isFinite(id) ? id : null;
}

/** Removes one incoming row immediately after accept/reject so the UI cannot double-action before refetch. */
function ctStripIncomingPartnerRequestById(
  prev: PartnerRequestsResponse | null,
  requestId: number,
): PartnerRequestsResponse | null {
  if (!prev) return prev;
  return {
    ...prev,
    incoming: prev.incoming.filter((r) => ctPartnerRequestRowId(r) !== requestId),
  };
}

function ctIncomingSenderRow(sender: CourseStudent | undefined): {
  name: string;
  university: string;
  major: string | null;
  pic: string | null;
} {
  if (!sender) {
    return { name: "—", university: "—", major: null, pic: null };
  }
  const majRaw = (sender.major ?? sender.Major ?? "").trim();
  return {
    name: sender.name ?? sender.Name ?? "—",
    university: sender.university ?? sender.University ?? "—",
    major: majRaw === "" ? null : majRaw,
    pic: sender.profilePicture ?? sender.ProfilePictureBase64 ?? null,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] =
    useState<GlobalSearchResponse | null>(null);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [teammates, setTeammates] = useState<SuggestedTeammate[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<
    RecommendedProject[]
  >([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [inviteLoading, setInviteLoading] = useState<number | null>(null);
  const [inviteMsg, setInviteMsg] = useState<{
    id: number;
    msg: string;
    ok: boolean;
  } | null>(null);

  // Toast for member-removal feedback — cleared automatically after 3 s
  const [removeMsg, setRemoveMsg] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);

  // Per-member loading state and toast for the Make Leader action
  const [promotingId, setPromotingId] = useState<number | null>(null);
  const [leaderMsg, setLeaderMsg] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [editInfoOpen, setEditInfoOpen] = useState(false);

  const [projectsModalOpen, setProjectsModalOpen] = useState(false);

  // ── Course Teams (modal; student dashboard only) ──────────────────────────
  const [courseTeamsModalOpen, setCourseTeamsModalOpen] = useState(false);
  const [ctCourses, setCtCourses] = useState<EnrolledCourse[]>([]);
  const [ctNoValidCourseIds, setCtNoValidCourseIds] = useState(false);
  const [ctSelectedCourseId, setCtSelectedCourseId] = useState<number | null>(
    null,
  );
  /** Selected course project for multi-project courses; drives future team/partner APIs. */
  const [ctSelectedCourseProjectId, setCtSelectedCourseProjectId] = useState<
    number | null
  >(null);
  const [ctCoursesLoading, setCtCoursesLoading] = useState(false);
  const [ctCoursesError, setCtCoursesError] = useState<string | null>(null);
  const [ctDetailsLoading, setCtDetailsLoading] = useState(false);
  const [ctDetailsError, setCtDetailsError] = useState<string | null>(null);
  const [ctCourseDetail, setCtCourseDetail] = useState<CourseDetails | null>(
    null,
  );
  const [ctProjectSetting, setCtProjectSetting] =
    useState<CourseProjectSetting | null>(null);
  const [ctMyTeam, setCtMyTeam] = useState<MyTeamResponse | null>(null);
  const [ctPartnerRequests, setCtPartnerRequests] =
    useState<PartnerRequestsResponse | null>(null);
  const [ctCourseStudents, setCtCourseStudents] = useState<CourseStudent[]>(
    [],
  );
  const [ctRecommendedMode, setCtRecommendedMode] =
    useState<RecommendedPartnerMode>("complementary");
  const [ctRecommendedSort, setCtRecommendedSort] = useState<
    "best" | "lowest"
  >("best");
  const [aiLoaded, setAiLoaded] = useState(false);
  const [ctRecommendedPartners, setCtRecommendedPartners] = useState<
    RecommendedPartner[]
  >([]);
  const [ctRecommendedLoading, setCtRecommendedLoading] = useState(false);
  /** University id string for the row currently sending a partner request (Step 4). */
  const [ctSendingReceiverUniversityId, setCtSendingReceiverUniversityId] =
    useState<string | null>(null);
  /** Per incoming request row: which action is in flight (Step 6). */
  const [ctIncomingRowAction, setCtIncomingRowAction] = useState<
    Record<number, "accept" | "reject">
  >({});
  /** Course Teams card on dashboard — preview counts (same APIs as modal). */
  const [ctDashCardCoursesCount, setCtDashCardCoursesCount] = useState<
    number | null
  >(null);
  const [ctDashCardRequestsCount, setCtDashCardRequestsCount] = useState<
    number | null
  >(null);
  /** Course team member row: DB studentId while DELETE is in flight (Step 7). */
  const [ctRemovingMemberStudentId, setCtRemovingMemberStudentId] = useState<
    number | null
  >(null);
  /** Leave Course action in progress (disables only that control). */
  const [ctLeavingCourse, setCtLeavingCourse] = useState(false);

  /** Blocks double-clicks on Accept/Reject before React re-renders loading state. */
  const ctIncomingBusyRef = useRef<Set<number>>(new Set());
  const globalSearchWrapRef = useRef<HTMLDivElement | null>(null);

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
        const res = await api.get<GlobalSearchResponse>("/search", {
          params: { query: q },
        });
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
    const onDown = (event: MouseEvent) => {
      if (!globalSearchWrapRef.current) return;
      if (!globalSearchWrapRef.current.contains(event.target as Node)) {
        setSearchQuery("");
        setGlobalSearchResults(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchQuery("");
        setGlobalSearchResults(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const resetCourseTeamsModalState = useCallback(() => {
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

  const closeCourseTeamsModal = useCallback(() => {
    setCourseTeamsModalOpen(false);
    resetCourseTeamsModalState();
  }, [resetCourseTeamsModalState]);

  /** Same logic as the dashboard Course Teams card — keep in sync after mutations while modal is open. */
  const refreshCourseTeamsDashCardCounts = useCallback(async () => {
    try {
      const courses = await getEnrolledCourses();
      setCtDashCardCoursesCount(courses.length);
      if (courses.length === 0) {
        setCtDashCardRequestsCount(0);
        return;
      }
      const validCourseIds = courses
        .map((course) => getCourseId(course))
        .filter((id): id is number => id !== null);
      const prs = await Promise.all(
        validCourseIds.map((courseId) => getCoursePartnerRequests(courseId)),
      );
      let total = 0;
      for (const pr of prs) {
        const inc =
          (pr.incoming ?? []).filter(ctIsIncomingPartnerRequestPending).length;
        const out =
          (pr.outgoing ?? []).filter(ctIsOutgoingPendingPartnerRequest).length;
        total += inc + out;
      }
      setCtDashCardRequestsCount(total);
    } catch {
      // Don't reset courses count if partner-requests fail — keep last known enrollment count.
      setCtDashCardRequestsCount(null);
    }
  }, []);

  // ── Graduation Project ────────────────────────────────────────────────────
  const [gradProject, setGradProject] = useState<GradProject | null>(null);
  const [gradLoading, setGradLoading] = useState(false);
  const [gradModalOpen, setGradModalOpen] = useState(false);
  const [gradModalMode, setGradModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [gradForm, setGradForm] = useState<{
    name: string;
    abstract: string;
    skills: string;
    teamSize: string;
    projectType: GraduationProjectType;
  }>({
    name: "",
    abstract: "",
    skills: "",
    teamSize: "",
    projectType: "GP",
  });
  const [gradFormError, setGradFormError] = useState<string | null>(null);
  const [gradFormFieldErrors, setGradFormFieldErrors] = useState<{
    abstract?: string;
    skills?: string;
  }>({});
  /** Draft line for skill tag input (Enter commits to `gradForm.skills` as comma-separated string). */
  const [gradSkillInputDraft, setGradSkillInputDraft] = useState("");
  const [gradSubmitting, setGradSubmitting] = useState(false);
  const [gradTeammates, setGradTeammates] = useState<SuggestedTeammate[]>([]);
  const [addTeammatesOpen, setAddTeammatesOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [aiStudents, setAiStudents] = useState<GradProjectRecommendedStudent[]>(
    [],
  );
  const [aiSupervisors, setAiSupervisors] = useState<
    GradProjectRecommendedSupervisor[]
  >([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [aiStudentsError, setAiStudentsError] = useState<string | null>(null);
  const [aiSupervisorsError, setAiSupervisorsError] = useState<string | null>(
    null,
  );

  // Role the current user holds in their project — comes from GET /my envelope.
  // Kept separately from gradProject so it survives the same optimistic-update
  // pattern used for teamMembers / currentMembers / isFull.
  const [myRole, setMyRole] = useState<"owner" | "leader" | "member" | null>(
    null,
  );
  // Auth-layer userId from GET /me — stored in a ref so refetchGradProject can
  // read the latest value without needing it as a useCallback dependency.
  const myUserIdRef = React.useRef<number | null>(null);

  // StudentProfile.Id of the currently logged-in user — derived once
  // teamMembers are loaded by matching myUserIdRef against member.userId.
  // Used to suppress the Remove button on the current user's own row.
  const [myStudentId, setMyStudentId] = useState<number | null>(null);

  // ── Team members — owned separately so mutations don't require a full
  //    gradProject refetch. Initialized from gradProject on first load.
  //    Source of truth for the team members list UI.
  const [teamMembers, setTeamMembers] = useState<GradProjectMember[]>([]);
  const [currentMembers, setCurrentMembers] = useState(0);
  const [isFull, setIsFull] = useState(false);

  const [aiRecommendUiState, setAiRecommendUiState] =
    useState<AiSupervisorRecommendUiState>("idle");
  const [aiRecommendItems, setAiRecommendItems] = useState<
    EnrichedAiSupervisorRow[]
  >([]);
  const [aiRecommendError, setAiRecommendError] = useState<string | null>(null);
  const [aiSupervisorCardRequests, setAiSupervisorCardRequests] = useState<
    Record<number, AiSupervisorCardRequestState>
  >({});

  /** Inline AI student cards — invite action (POST invite/{studentProfileId}) */
  const [aiCardInviteLoadingId, setAiCardInviteLoadingId] = useState<
    number | null
  >(null);

  /** Inline AI supervisor JSON cards — request action */
  const [aiCardSupervisorLoadingId, setAiCardSupervisorLoadingId] = useState<
    number | null
  >(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const supervisionUi = useMemo(() => {
    if (!gradProject) return { mode: "none" as const };

    if (gradProject.supervisor) {
      return { mode: "assigned" as const, supervisor: gradProject.supervisor };
    }

    const sr = normApiStatus(gradProject.supervisorRequestStatus);
    if (sr === "rejected") {
      return { mode: "rejected" as const };
    }
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
      return {
        hasAssignedSupervisor: false,
        requestStatusNorm: "",
        pendingDoctorId: null,
      };
    }
    const requestStatusNorm = normApiStatus(
      gradProject.supervisorRequestStatus,
    );
    const pendingDoctorId =
      requestStatusNorm === "pending"
        ? (gradProject.pendingSupervisor?.doctorId ?? null)
        : null;
    return {
      hasAssignedSupervisor: !!gradProject.supervisor,
      requestStatusNorm,
      pendingDoctorId,
    };
  }, [gradProject]);

  // ── fetchInvitations: reusable, callable manually or by effects ──────────
  // Extracted so it can be triggered on:
  //   1. Initial load (inside fetchData)
  //   2. Page focus / visibility change (window event)
  //   3. After accept/reject actions (handleInvite calls it)
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch invitations when the tab becomes visible again
  // (covers the case: user sends invite on StudentsPage → switches back)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchInvitations();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchInvitations]);

  // Auto-refresh invitations every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchInvitations, 10_000);
    return () => clearInterval(interval);
  }, [fetchInvitations]);

  // Course Teams card — enrolled course count + total partner-request items (all courses)
  useEffect(() => {
    if (courseTeamsModalOpen) return;
    void refreshCourseTeamsDashCardCounts();
  }, [courseTeamsModalOpen, refreshCourseTeamsDashCardCounts]);

  // Course Teams modal: enrolled courses (fresh load each open)
  useEffect(() => {
    if (!courseTeamsModalOpen) return;
    let cancelled = false;
    const run = async () => {
      setCtCoursesLoading(true);
      setCtCoursesError(null);
      try {
        const data = await getEnrolledCourses();
        console.log("Enrolled courses raw:", data);
        data.forEach((c) => {
          console.log("Course raw:", c);
          console.log("Normalized ID:", getCourseId(c));
        });
        const validCourses = data.filter((c) => getCourseId(c) !== null);
        if (cancelled) return;
        setCtCourses(validCourses);
        setCtNoValidCourseIds(data.length > 0 && validCourses.length === 0);
        setCtSelectedCourseId((prev) => {
          if (prev != null && validCourses.some((c) => getCourseId(c) === prev)) {
            return prev;
          }
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
  }, [courseTeamsModalOpen]);

  // Course Teams modal: detail bundle for selected course
  useEffect(() => {
    console.log("Effect triggered with ID:", ctSelectedCourseId);
    console.log("Type of ID:", typeof ctSelectedCourseId);
    if (!ctSelectedCourseId) return;
    const selectedCourseId = ctSelectedCourseId;
    console.log("Selected course ID:", selectedCourseId);
    let cancelled = false;
    const run = async () => {
      setCtDetailsLoading(true);
      setCtDetailsError(null);
      try {
        console.log("Calling APIs with:", ctSelectedCourseId);
        console.log("Type of ID:", typeof ctSelectedCourseId);
        const [courseRes, myTeamRes, requestsRes, studentsRes] =
          await Promise.all([
            getCourseById(selectedCourseId),
            getMyTeam(selectedCourseId),
            getCoursePartnerRequests(selectedCourseId),
            getCourseStudents(selectedCourseId),
          ]);
        let settingRes: CourseProjectSetting | null = null;
        try {
          settingRes = await getCourseProjectSetting(selectedCourseId);
        } catch (err: any) {
          if (err?.response?.status === 404) {
            settingRes = null;
          } else {
            throw err;
          }
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
          const status = (err as any)?.response?.status;
          if (status === 404) {
            setCtDetailsError("Course data not found");
            showToast("Course data not found", "error");
          } else if (status === 403) {
            setCtDetailsError("You are not allowed to access this course");
            showToast("You are not allowed to access this course", "error");
          } else {
            console.error("Failed to load selected course teams details", err);
            setCtDetailsError("We could not load this course right now. Please try again.");
            showToast("We could not load this course right now. Please try again.", "error");
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
  }, [ctSelectedCourseId, showToast]);

  useEffect(() => {
    setAiLoaded(false);
    setCtRecommendedPartners([]);
    setCtRecommendedLoading(false);
  }, [ctSelectedCourseId, ctRecommendedMode, ctSelectedCourseProjectId]);

  const fetchRecommendations = useCallback(async () => {
    if (!ctSelectedCourseId) return;
    setCtRecommendedLoading(true);
    try {
      const recs = await getRecommendedPartners(
        ctSelectedCourseId,
        ctRecommendedMode,
      );
      setCtRecommendedPartners(Array.isArray(recs) ? recs : []);
    } catch {
      setCtRecommendedPartners([]);
    } finally {
      setCtRecommendedLoading(false);
    }
  }, [ctSelectedCourseId, ctRecommendedMode]);

  /** True when the enrolled roster row for the current user has no section (partner requests require a section). */
  const ctPartnerRequestBlockedNoSection = useMemo(() => {
    const uid = myUserIdRef.current;
    if (uid == null) return false;
    const me = ctCourseStudents.find((raw) => {
      const rowUserId = ctCourseStudentUserId(raw);
      return rowUserId != null && rowUserId === uid;
    });
    if (!me) return false;
    const sid = me.sectionId ?? me.SectionId;
    return sid === null || sid === undefined;
  }, [ctCourseStudents, courseTeamsModalOpen]);

  const ctCourseProjects = useMemo(() => {
    if (!ctCourseDetail || ctCourseDetail.courseId !== ctSelectedCourseId) {
      return [];
    }
    return normalizeCourseProjectsFromDetail(ctCourseDetail);
  }, [ctCourseDetail, ctSelectedCourseId]);

  useEffect(() => {
    setCtSelectedCourseProjectId(null);
  }, [ctSelectedCourseId]);

  useEffect(() => {
    if (!ctCourseDetail || ctCourseDetail.courseId !== ctSelectedCourseId) {
      return;
    }
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

  const handleCourseTeamsSendPartnerRequest = useCallback(
    async (receiverUniversityId: string) => {
      const uid = receiverUniversityId.trim();
      if (!ctSelectedCourseId) {
        console.warn("Invalid courseId, skipping request");
        return;
      }
      if (!uid) return;
      if (ctPartnerRequestBlockedNoSection) return;
      const selectedCourseId = ctSelectedCourseId;
      setCtSendingReceiverUniversityId(uid);
      try {
        await createPartnerRequest(selectedCourseId, {
          receiverStudentId: uid,
          ...(ctSelectedCourseProjectId != null
            ? { courseProjectId: ctSelectedCourseProjectId }
            : {}),
        });
        const pr = await getCoursePartnerRequests(selectedCourseId);
        setCtPartnerRequests(pr);
        await refreshCourseTeamsDashCardCounts();
      } catch (err) {
        showToast(parseApiErrorMessage(err), "error");
      } finally {
        setCtSendingReceiverUniversityId(null);
      }
    },
    [
      ctSelectedCourseId,
      ctSelectedCourseProjectId,
      ctPartnerRequestBlockedNoSection,
      showToast,
      refreshCourseTeamsDashCardCounts,
    ],
  );

  const handleCtAcceptIncoming = useCallback(
    async (requestId: number) => {
      if (!ctSelectedCourseId) {
        console.warn("Invalid courseId, skipping request");
        return;
      }
      if (ctIncomingBusyRef.current.has(requestId)) return;
      ctIncomingBusyRef.current.add(requestId);
      const selectedCourseId = ctSelectedCourseId;
      setCtIncomingRowAction((prev) => ({ ...prev, [requestId]: "accept" }));
      try {
        await acceptPartnerRequest(selectedCourseId, requestId);
        setCtPartnerRequests((prev) =>
          ctStripIncomingPartnerRequestById(prev, requestId),
        );
        const [pr, team, courseRes] = await Promise.all([
          getCoursePartnerRequests(selectedCourseId),
          getMyTeam(selectedCourseId),
          getCourseById(selectedCourseId),
        ]);
        setCtPartnerRequests(pr);
        setCtMyTeam(team);
        setCtCourseDetail(courseRes);
        await refreshCourseTeamsDashCardCounts();
      } catch (err) {
        showToast(parseApiErrorMessage(err), "error");
        try {
          const [pr, team] = await Promise.all([
            getCoursePartnerRequests(selectedCourseId),
            getMyTeam(selectedCourseId),
          ]);
          setCtPartnerRequests(pr);
          setCtMyTeam(team);
        } catch {
          /* ignore refresh failure */
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
    [ctSelectedCourseId, showToast, refreshCourseTeamsDashCardCounts],
  );

  const handleCtRejectIncoming = useCallback(
    async (requestId: number) => {
      if (!ctSelectedCourseId) {
        console.warn("Invalid courseId, skipping request");
        return;
      }
      if (ctIncomingBusyRef.current.has(requestId)) return;
      ctIncomingBusyRef.current.add(requestId);
      const selectedCourseId = ctSelectedCourseId;
      setCtIncomingRowAction((prev) => ({ ...prev, [requestId]: "reject" }));
      try {
        await rejectPartnerRequest(selectedCourseId, requestId);
        setCtPartnerRequests((prev) =>
          ctStripIncomingPartnerRequestById(prev, requestId),
        );
        const [pr, team] = await Promise.all([
          getCoursePartnerRequests(selectedCourseId),
          getMyTeam(selectedCourseId),
        ]);
        setCtPartnerRequests(pr);
        setCtMyTeam(team);
        await refreshCourseTeamsDashCardCounts();
      } catch (err) {
        showToast(parseApiErrorMessage(err), "error");
        try {
          const [pr, team] = await Promise.all([
            getCoursePartnerRequests(selectedCourseId),
            getMyTeam(selectedCourseId),
          ]);
          setCtPartnerRequests(pr);
          setCtMyTeam(team);
        } catch {
          /* ignore refresh failure */
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
    [ctSelectedCourseId, showToast, refreshCourseTeamsDashCardCounts],
  );

  const handleCtRemoveTeamMember = useCallback(
    async (teamId: number, memberStudentId: number) => {
      if (!ctSelectedCourseId) {
        console.warn("Invalid courseId, skipping request");
        return;
      }
      if (
        !window.confirm(
          "Are you sure you want to remove this member?",
        )
      ) {
        return;
      }
      const selectedCourseId = ctSelectedCourseId;
      setCtRemovingMemberStudentId(memberStudentId);
      try {
        await removeTeamMember(
          selectedCourseId,
          teamId,
          memberStudentId,
        );
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
        await refreshCourseTeamsDashCardCounts();
      } catch (err) {
        showToast(parseApiErrorMessage(err), "error");
      } finally {
        setCtRemovingMemberStudentId(null);
      }
    },
    [ctSelectedCourseId, showToast, refreshCourseTeamsDashCardCounts],
  );

  const handleCourseTeamsLeaveCourse = useCallback(async () => {
    if (!ctSelectedCourseId) {
      console.warn("Invalid courseId, skipping request");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to leave this course?",
      )
    ) {
      return;
    }
    const leftCourseId = ctSelectedCourseId;
    setCtLeavingCourse(true);
    try {
      await leaveCourse(leftCourseId);
      showToast("You left the course.", "success");
      const fresh = await getEnrolledCourses();
      setCtCourses(fresh);
      await refreshCourseTeamsDashCardCounts();
      closeCourseTeamsModal();
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setCtLeavingCourse(false);
    }
  }, [
    ctSelectedCourseId,
    closeCourseTeamsModal,
    showToast,
    refreshCourseTeamsDashCardCounts,
  ]);

  // Single call to GET /api/graduation-projects/my
  // Returns { role, project } — project is null when student has no affiliation
  const refetchGradProject = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      try {
        if (!silent) {
          setGradLoading(true);
        }
        const { project, role } = await getGraduationProjectsMyEnvelope();
        setGradProject(project ?? null);
        setMyRole(role);
        // Seed the independent team-member state from the project payload.
        // The /my endpoint already embeds members via MapToDto, so no extra
        // fetch is needed on first load.
        if (project) {
          const members = project.members ?? [];
          setTeamMembers(members);
          setCurrentMembers(project.currentMembers ?? 0);
          setIsFull(project.isFull ?? false);

          // Find the current user's own StudentProfile.Id by matching their
          // auth userId (captured from /me) against the member list.
          // This is used purely to hide the Remove button on their own row.
          const myRow = members.find(
            (m: any) => m.userId === myUserIdRef.current,
          );

          setMyStudentId(myRow?.studentId ?? null);
        } else {
          setTeamMembers([]);
          setCurrentMembers(0);
          setIsFull(false);
          setMyStudentId(null);
        }
      } catch (err: any) {
        // 403 from /my can be Forbid() (e.g. no student profile) — do not treat as "session expired".
        if (err?.response?.status === 401) {
          navigate("/login");
        }
        setGradProject(null);
        setMyRole(null);
        setTeamMembers([]);
        setCurrentMembers(0);
        setIsFull(false);
        setMyStudentId(null);
      } finally {
        if (!silent) {
          setGradLoading(false);
        }
      }
    },
    [navigate],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * After supervisor request mutations: re-fetch GET /graduation-projects/my without
   * toggling gradLoading (keeps the project card visible), clear optimistic AI card
   * state so supervisionUi + mergeAiSupervisorCardRequestState follow the server.
   * A second silent refetch shortly after helps if the first read is briefly stale.
   */
  const refreshGradProjectAfterSupervisorRequest = useCallback(async () => {
    await refetchGradProject({ silent: true });
    setAiSupervisorCardRequests({});
    window.setTimeout(() => {
      void refetchGradProject({ silent: true });
    }, 450);
  }, [refetchGradProject]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const profileRes = await api.get("/me");
        const data = profileRes.data;
        myUserIdRef.current = data.id ?? null;
        setUser({
          name: data.name || data.fullName,
          email: data.email,
          role: data.role || localStorage.getItem("role") || "student",
          university: data.university,
          faculty: data.faculty,
          major: data.major,
          academicYear: data.academicYear,
          gpa: data.gpa,
          generalSkills: data.generalSkills || [],
          majorSkills: data.majorSkills || [],
          profilePic: data.profilePictureBase64 || null,
        });

        try {
          const dashData = await getDashboardSummary();
          setTeammates(
            dashData.suggestedTeammates?.length > 0
              ? dashData.suggestedTeammates
              : [],
          );
        } catch {
          setTeammates([]);
        }

        // Fetch graduation project — GET /api/graduation-projects/my
        await refetchGradProject();

        // Fetch invitations via shared helper
        await fetchInvitations();
      } catch {
        setUser({
          name: localStorage.getItem("name") ?? "",
          email: localStorage.getItem("email") ?? "",
          role: localStorage.getItem("role") ?? "student",
          generalSkills: [],
          majorSkills: [],
        });
        setTeammates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, refetchGradProject, fetchInvitations]);

  // ── Fetch projects from joined channels ───────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const channelsRes = await api.get("/channels/my");
        const channels: { id: number }[] = channelsRes.data;

        const projectArrays = await Promise.all(
          channels.map((ch) =>
            api
              .get(`/channels/${ch.id}/projects`)
              .then((r) => r.data)
              .catch(() => []),
          ),
        );

        const mapped: RecommendedProject[] = projectArrays
          .flat()
          .map((p: any) => ({
            id: p.id,
            title: p.name,
            description: p.description ?? null,
            abstract: p.abstract ?? null,
            lookingFor: p.requiredSkills ?? [],
            matchScore: 0,
            maxTeamSize: p.maxTeamSize ?? null,
            dueDate: p.dueDate ?? null,
            formationMode: p.formationMode ?? "students",
          }));

        setRecommendedProjects(mapped);
      } catch {
        setRecommendedProjects([]);
      }
    };
    fetchProjects();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openGradModal = useCallback(
    (mode: "create" | "edit") => {
      setGradModalMode(mode);
      setGradFormError(null);
      setGradFormFieldErrors({});
      setGradSkillInputDraft("");
      if (mode === "edit" && gradProject) {
        setGradForm({
          name: gradProject.name,
          abstract: gradProject.abstract ?? "",
          skills: (gradProject.requiredSkills ?? []).join(", "),
          teamSize: String(gradProject.partnersCount),
          projectType:
            (gradProject.projectType as GraduationProjectType) ?? "GP",
        });
      } else {
        setGradForm({
          name: "",
          abstract: "",
          skills: "",
          teamSize: "",
          projectType: "GP",
        });
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
    const size = parseInt(gradForm.teamSize);
    if (!gradForm.teamSize || isNaN(size) || size < 1) {
      setGradFormError("Please enter a valid team size.");
      return;
    }

    const skills = gradForm.skills
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const fieldErrors: { abstract?: string; skills?: string } = {};
    if (!gradForm.abstract.trim()) {
      fieldErrors.abstract = "Abstract is required";
    }
    if (skills.length === 0) {
      fieldErrors.skills = "At least one skill is required";
    }
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
      // Refetch from GET endpoint — guarantees isOwner/remainingSeats are populated
      setGradForm({
        name: "",
        abstract: "",
        skills: "",
        teamSize: "",
        projectType: "GP",
      });
      setGradSkillInputDraft("");
      setGradModalMode("create");
      setGradModalOpen(false);
      await refetchGradProject();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (gradModalMode === "edit"
          ? "Failed to save project. Please try again."
          : "Failed to create project. Please try again.");
      setGradFormError(msg);
    } finally {
      setGradSubmitting(false);
    }
  };

  const gradModalInputErrorStyle: React.CSSProperties = {
    borderColor: "#ef4444",
    borderWidth: "1.5px",
    borderStyle: "solid",
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
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Request failed.";
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
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Request failed.";
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
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Request failed.";
        showToast(msg, "error");
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
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Request failed.";
        showToast(msg, "error");
      } finally {
        setAiCardSupervisorLoadingId(null);
      }
    },
    [gradProject, refreshGradProjectAfterSupervisorRequest, showToast],
  );

  const handleDeleteProject = async () => {
    if (!gradProject) return;
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    try {
      await api.delete(`/graduation-projects/${gradProject.id}`);
      // تحقق من الباك — يجب أن يرجع null بعد الحذف
      await refetchGradProject();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete project.");
    }
  };

  const handleLeaveProject = async () => {
    if (!gradProject) return;
    if (!window.confirm("Are you sure you want to leave this project?")) return;
    try {
      await api.delete(`/graduation-projects/${gradProject.id}/leave`);
      // تحقق من الباك بعد المغادرة
      await refetchGradProject();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to leave project.");
    }
  };

  const handleRemoveMember = async (memberStudentId: number) => {
    if (!gradProject) return;

    setRemovingId(memberStudentId);
    setRemoveMsg(null);
    try {
      // Uses the typed API function — DELETE /graduation-projects/:id/members/:memberId
      // Response: { message, currentMembers } where currentMembers is the
      // authoritative post-deletion count from the DB.
      const result = await removeProjectMember(gradProject.id, memberStudentId);

      // Update team state from the backend's real count, not a local guess
      const updatedCount = result.currentMembers;
      setTeamMembers((prev) =>
        prev.filter((m) => m.studentId !== memberStudentId),
      );
      setCurrentMembers(updatedCount);
      setIsFull(updatedCount >= (gradProject?.partnersCount ?? 0));

      setRemoveMsg({ msg: "✓ Member removed.", ok: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to remove member.";
      setRemoveMsg({ msg, ok: false });
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
      // PUT /graduation-projects/:id/change-leader/:memberId
      // Backend swaps roles atomically: exactly one leader at all times.
      await changeProjectLeader(gradProject.id, memberStudentId);

      // 🔥 Update team members (optimistic UI)
      setTeamMembers((prev) =>
        prev.map((m) => {
          if (m.studentId === memberStudentId)
            return { ...m, role: "leader" as const };

          if (m.role === "leader") return { ...m, role: "member" as const };

          return m;
        }),
      );

      // 🔥 FIX: update current user role
      if (memberStudentId === myStudentId) {
        setMyRole("leader");
      } else {
        setMyRole("member");
      }

      setLeaderMsg({ msg: "✓ Leader updated.", ok: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to change leader.";
      setLeaderMsg({ msg, ok: false });
    } finally {
      setPromotingId(null);
      setTimeout(() => setLeaderMsg(null), 3000);
    }
  };

  const handleJoinProject = async (projectId: number) => {
    try {
      await api.post(`/graduation-projects/${projectId}/join`);
      await refetchGradProject();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to join project.");
    }
  };
  const handleInvite = async (id: number, action: "accept" | "reject") => {
    setInviteLoading(id);
    setInviteMsg(null);

    try {
      await api.post(`/invitations/${id}/${action}`);

      setInvitations((prev) => prev.filter((i) => i.id !== id));

      setInviteMsg({
        id,
        msg:
          action === "accept"
            ? "✅ Invitation accepted!"
            : "❌ Invitation rejected.",
        ok: action === "accept",
      });

      await fetchInvitations();

      // ✅ الحل هون
      if (action === "accept") {
        await refetchGradProject();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (action === "accept" ? "Failed to accept." : "Failed to reject.");
      setInviteMsg({ id, msg, ok: false });
    } finally {
      setInviteLoading(null);
      setTimeout(() => setInviteMsg(null), 3000);
    }
  };
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
        /* optional: names/specializations when GET recommended list succeeds */
      }
      const enriched = enrichAiSupervisorsWithRecommended(aiRows, recommended);
      setAiRecommendItems(enriched);
      setAiRecommendUiState(enriched.length === 0 ? "empty" : "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ??
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

      setAiSupervisorCardRequests((prev) => ({
        ...prev,
        [doctorId]: { phase: "sending" },
      }));

      try {
        await requestSupervisor(gradProject.id, doctorId);
        await refreshGradProjectAfterSupervisorRequest();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to send supervisor request.";
        const lower = msg.toLowerCase();
        const treatAsPending =
          lower.includes("pending") ||
          lower.includes("already") ||
          lower.includes("exist") ||
          lower.includes("duplicate");
        if (treatAsPending) {
          await refreshGradProjectAfterSupervisorRequest();
        } else {
          setAiSupervisorCardRequests((prev) => ({
            ...prev,
            [doctorId]: { phase: "error", detail: msg },
          }));
        }
      }
    },
    [gradProject, refreshGradProjectAfterSupervisorRequest],
  );

  const openEditInfo = () => {
    setEditInfoOpen(true);
  };

  const allSkills = [
    ...(user?.generalSkills || []),
    ...(user?.majorSkills || []),
  ];
  const completeness = Math.min(
    20 +
      (user?.university ? 15 : 0) +
      (user?.major ? 15 : 0) +
      (allSkills.length > 0 ? 20 : 0) +
      (user?.gpa ? 10 : 0) +
      (user?.profilePic ? 20 : 0),
    100,
  );

  // ── Team management permission ────────────────────────────────────────────
  // true  → show Remove / Make Leader buttons on non-leader member rows.
  // false → member rows are read-only (regular member, or no project).
  //
  // Currently granted to:
  //   - 'owner'  — the project creator (always has full control)
  //   - 'leader' — a designated team lead (backend allows them to manage too)
  //
  // myRole comes directly from the GET /my response envelope, so it never
  // requires scanning teamMembers to find the current user.

  const PROFILE_TASKS = [
    {
      id: "1",
      label: "Add a profile picture",
      done: !!user?.profilePic,
      link: "/edit-profile#basic",
    },
    {
      id: "2",
      label: "Add general skills",
      done: (user?.generalSkills?.length || 0) > 0,
      link: "/edit-profile#skills",
    },
    {
      id: "3",
      label: "Add major skills",
      done: (user?.majorSkills?.length || 0) > 0,
      link: "/edit-profile#skills",
    },
    {
      id: "4",
      label: "Complete academic info",
      done: !!user?.major && !!user?.university,
      link: "/edit-profile#basic",
    },
    {
      id: "5",
      label: "Add preferred project topics",
      done: false,
      link: "/edit-profile#work",
    },
  ];

  const isNarrowLayout =
    typeof window !== "undefined" ? window.innerWidth < 1024 : false;

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" as const }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );

  return (
    <div style={S.page}>
      <BgDecor />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to={getHomePath()} style={S.navLogo}>
            <div style={S.logoIconWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={S.logoText}>
              Skill<span style={S.logoAccent}>Swap</span>
            </span>
          </Link>
          <div style={S.searchWrap} ref={globalSearchWrapRef}>
            <Search size={14} style={S.searchIcon} />
            <input
              style={S.searchInput}
              placeholder="Search students, projects, skills, supervisors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            />
            {searchQuery.trim() !== "" && (
              <div style={S.searchDropdown}>
                {globalSearchLoading ? (
                  <div style={S.searchStateRow}>Searching...</div>
                ) : (
                  <>
                    <div style={S.searchGroup}>
                      <p style={S.searchGroupTitle}>Students</p>
                      {(globalSearchResults?.students ?? []).length === 0 ? (
                        <div style={S.searchItemMuted}>No students</div>
                      ) : (
                        (globalSearchResults?.students ?? []).map((student) => (
                          <button
                            key={`gs-st-${student.id}`}
                            type="button"
                            style={S.searchResultBtn}
                            onClick={() => {
                              navigate(`/students/${student.id}`);
                              setSearchQuery("");
                              setGlobalSearchResults(null);
                            }}
                          >
                            <span style={S.searchResultName}>{student.name}</span>
                            <span style={S.searchResultMeta}>{student.major || student.email}</span>
                          </button>
                        ))
                      )}
                    </div>

                    <div style={S.searchGroup}>
                      <p style={S.searchGroupTitle}>Doctors</p>
                      {(globalSearchResults?.doctors ?? []).length === 0 ? (
                        <div style={S.searchItemMuted}>No doctors</div>
                      ) : (
                        (globalSearchResults?.doctors ?? []).map((doctor) => (
                          <button
                            key={`gs-dr-${doctor.id}`}
                            type="button"
                            style={S.searchResultBtn}
                            onClick={() => {
                              navigate(`/doctors/${doctor.id}`);
                              setSearchQuery("");
                              setGlobalSearchResults(null);
                            }}
                          >
                            <span style={S.searchResultName}>{doctor.name}</span>
                            <span style={S.searchResultMeta}>
                              {doctor.specialization || doctor.email}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}

                {!globalSearchLoading &&
                  (globalSearchResults?.students?.length ?? 0) === 0 &&
                  (globalSearchResults?.doctors?.length ?? 0) === 0 && (
                    <div style={S.searchStateRow}>No results found</div>
                  )}
              </div>
            )}
          </div>
          <div style={S.navActions}>
            <GradProjectNotificationBell bellButtonStyle={S.navBtn} showInvitationsLink theme="student" />
            <button
              type="button"
              style={S.navBtn}
              onClick={() => navigate("/messages")}
              aria-label="Messages"
            >
              <MessageCircle size={17} />
            </button>
            <button style={S.navBtn} onClick={openEditInfo}>
              <Settings size={17} />
            </button>
            <button style={S.navBtn} onClick={handleLogout}>
              <LogOut size={16} />
            </button>
            <Link to="/profile" style={S.navAvatar}>
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover" as const,
                  }}
                  alt=""
                />
              ) : (
                <div style={S.navAvatarFallback}>
                  {user?.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <div style={S.content}>
        {/* ── HERO ── */}
        <div style={S.hero}>
          <div style={S.heroLeft}>
            <p style={S.greetingText}>{greeting} 👋</p>
            <h1 style={S.heroName}>
              Welcome back,{" "}
              <span style={S.heroNameAccent}>{user?.name?.split(" ")[0]}</span>
            </h1>
            <p style={S.heroSub}>
              {[user?.major, user?.academicYear, user?.university]
                .filter(Boolean)
                .join(" · ") || "Complete your profile to get started"}
            </p>
            <div style={S.heroSkills}>
              {allSkills.length > 0 ? (
                allSkills.slice(0, 5).map((s: string) => (
                  <span key={s} style={S.skillChip}>
                    {s}
                  </span>
                ))
              ) : (
                <Link
                  to="/profile"
                  style={{
                    ...S.skillChip,
                    textDecoration: "none",
                    opacity: 0.7,
                  }}
                >
                  + Add your skills
                </Link>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 14,
                flexWrap: "wrap" as const,
              }}
            >
              <Link to="/edit-profile" style={S.heroBtn}>
                ✏️ Edit Profile
              </Link>
              <Link
                to="/profile"
                style={{
                  ...S.heroBtn,
                  background: "white",
                  color: "#6366f1",
                  border: "1.5px solid #c7d2fe",
                }}
              >
                👤 View Full Profile
              </Link>
              <button
                onClick={() => setProjectsModalOpen(true)}
                style={{
                  ...S.heroBtn,
                  background: "white",
                  color: "#6366f1",
                  border: "1.5px solid #c7d2fe",
                  cursor: "pointer",
                }}
              >
                📁 Browse Projects
              </button>
            </div>
          </div>

          <div style={S.heroStats}>
            {[
              {
                icon: <Users size={18} />,
                label: "Suggested Teammates",
                value: teammates.length > 0 ? `${teammates.length}` : "—",
              },
              {
                icon: <Briefcase size={18} />,
                label: "Matched Projects",
                value:
                  recommendedProjects.length > 0
                    ? `${recommendedProjects.length}`
                    : "—",
              },
              {
                icon: <Trophy size={18} />,
                label: "Best Match",
                value:
                  teammates.length > 0 ? `${teammates[0].matchScore}%` : "—",
              },
              {
                icon: <UserPlus size={18} />,
                label: "Team Invitations",
                value: invitations.length > 0 ? `${invitations.length}` : "—",
              },
            ].map((stat) => (
              <div key={stat.label} style={S.statCard}>
                <div style={S.statIcon}>{stat.icon}</div>
                <div>
                  <p style={S.statValue}>{stat.value}</p>
                  <p style={S.statLabel}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── GRID ── */}
        <div style={{ ...S.grid, ...(isNarrowLayout ? S.gridNarrow : {}) }}>
          {/* LEFT COL */}
          <div
            style={{
              ...S.leftCol,
              ...(isNarrowLayout ? S.leftColNarrow : {}),
            }}
          >
            {/* My Applications */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <Briefcase size={15} color="#6366f1" /> My Applications
                </h3>
                <Link to="/projects" style={S.cardAction}>
                  See all <ChevronRight size={12} />
                </Link>
              </div>
              {applications.length === 0 ? (
                <div style={S.emptyState}>
                  <span style={{ fontSize: 24 }}>📋</span>
                  <p style={S.emptyDesc}>No applications yet</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column" as const,
                    gap: 10,
                  }}
                >
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: "#f8fafc",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        {app.project}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background:
                            app.status === "Accepted" ? "#dcfce7" : "#fef9c3",
                          color:
                            app.status === "Accepted" ? "#16a34a" : "#a16207",
                        }}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Invitations */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <UserPlus size={15} color="#a855f7" /> Team Invitations
                </h3>
              </div>
              {invitations.length === 0 ? (
                <div style={S.emptyState}>
                  <span style={{ fontSize: 24 }}>🎉</span>
                  <p style={S.emptyDesc}>No pending invitations</p>
                </div>
              ) : (
                invitations.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      padding: "14px",
                      background: "#faf5ff",
                      border: "1px solid #e9d5ff",
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#334155",
                        margin: "0 0 2px",
                      }}
                    >
                      You were invited to join:
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#7c3aed",
                        margin: "0 0 4px",
                      }}
                    >
                      {inv.project}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        margin: "0 0 12px",
                      }}
                    >
                      by {inv.invitedBy}
                    </p>
                    {inviteMsg?.id === inv.id ? (
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: inviteMsg.ok ? "#16a34a" : "#64748b",
                          margin: 0,
                        }}
                      >
                        {inviteMsg.msg}
                      </p>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          disabled={inviteLoading === inv.id}
                          onClick={() => handleInvite(inv.id, "accept")}
                          style={{
                            flex: 1,
                            padding: "7px",
                            background:
                              inviteLoading === inv.id
                                ? "#e2e8f0"
                                : "linear-gradient(135deg,#6366f1,#a855f7)",
                            color:
                              inviteLoading === inv.id ? "#94a3b8" : "white",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor:
                              inviteLoading === inv.id
                                ? "not-allowed"
                                : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {inviteLoading === inv.id ? "⏳" : "✅ Accept"}
                        </button>
                        <button
                          disabled={inviteLoading === inv.id}
                          onClick={() => handleInvite(inv.id, "reject")}
                          style={{
                            flex: 1,
                            padding: "7px",
                            background: "white",
                            color: "#64748b",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor:
                              inviteLoading === inv.id
                                ? "not-allowed"
                                : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* My Graduation Project (moved to AI tabs area) */}
            {false && (
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <h3 style={S.cardTitle}>🎓 My Graduation Project</h3>
                  {!gradProject && !gradLoading && (
                    <button
                      onClick={() => openGradModal("create")}
                      style={S.cardActionBtn}
                    >
                      + Create <ChevronRight size={12} />
                    </button>
                  )}
                </div>

                {/* Loading */}
                {gradLoading && (
                  <div style={S.emptyState}>
                    <p style={{ fontSize: 12, color: "#94a3b8" }}>
                      ⏳ Loading...
                    </p>
                  </div>
                )}

                {/* No project */}
                {!gradLoading && !gradProject && (
                  <div style={S.emptyState}>
                    <span style={{ fontSize: 24 }}>📝</span>
                    <p style={S.emptyTitle}>No project yet</p>
                    <p style={S.emptyDesc}>
                      Create your graduation project and find teammates
                    </p>
                    <button
                      onClick={() => openGradModal("create")}
                      style={{
                        marginTop: 8,
                        padding: "7px 16px",
                        background: "linear-gradient(135deg,#6366f1,#a855f7)",
                        color: "white",
                        border: "none",
                        borderRadius: 9,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Create Graduation Project
                    </button>
                  </div>
                )}

                {/* Project exists */}
                {!gradLoading && gradProject && (
                  <div
                    style={{
                      padding: "14px",
                      background:
                        "linear-gradient(135deg,rgba(99,102,241,0.05),rgba(168,85,247,0.05))",
                      border: "1px solid rgba(99,102,241,0.15)",
                      borderRadius: 12,
                    }}
                  >
                    {/* Header: name + role badge + action */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
                            margin: "0 0 3px",
                          }}
                        >
                          {gradProject?.name ?? ""}
                        </p>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 7px",
                            background: gradProject?.isOwner
                              ? "linear-gradient(135deg,#6366f1,#a855f7)"
                              : "#e0e7ff",
                            color: gradProject?.isOwner ? "white" : "#6366f1",
                            borderRadius: 20,
                          }}
                        >
                          {gradProject?.isOwner ? "👑 Owner" : "👥 Member"}
                        </span>
                      </div>
                      {gradProject?.isOwner ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openGradModal("edit")}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#6366f1",
                              fontSize: 11,
                              fontFamily: "inherit",
                              padding: "2px 6px",
                              borderRadius: 6,
                              fontWeight: 700,
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteProject}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#ef4444",
                              fontSize: 11,
                              fontFamily: "inherit",
                              padding: "2px 6px",
                              borderRadius: 6,
                            }}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleLeaveProject}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#94a3b8",
                            fontSize: 11,
                            fontFamily: "inherit",
                            padding: "2px 6px",
                            borderRadius: 6,
                          }}
                        >
                          Leave
                        </button>
                      )}
                    </div>

                    {/* Abstract + project type */}
                    {(gradProject?.projectType ||
                      (gradProject?.abstract ?? "").trim()) && (
                      <div
                        style={{
                          margin: "0 0 8px",
                          display: "flex",
                          flexWrap: "wrap" as const,
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        {gradProject?.projectType ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              background: "#f1f5f9",
                              color: "#475569",
                              borderRadius: 6,
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {gradProject?.projectType}
                          </span>
                        ) : null}
                        {(gradProject?.abstract ?? "").trim() ? (
                          <p
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              margin: 0,
                              lineHeight: 1.5,
                              flex: "1 1 200px",
                            }}
                          >
                            {(gradProject?.abstract ?? "").trim()}
                          </p>
                        ) : null}
                      </div>
                    )}

                    {/* Owner name */}
                    <p
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        margin: "0 0 8px",
                        fontWeight: 500,
                      }}
                    >
                      by {gradProject?.ownerName ?? "—"}
                    </p>

                    {/* Required skills */}
                    {(gradProject?.requiredSkills ?? []).length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap" as const,
                          gap: 4,
                          marginBottom: 10,
                        }}
                      >
                        {(gradProject?.requiredSkills ?? []).map(
                          (sk: string) => (
                            <span key={sk} style={S.skillChipSm}>
                              {sk}
                            </span>
                          ),
                        )}
                      </div>
                    )}

                    {/* ── Team Members ── */}
                    <div
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid rgba(99,102,241,0.12)",
                        paddingTop: 12,
                      }}
                    >
                      {/* Header: label + count + full badge */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Users size={12} color="#6366f1" />
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#64748b",
                              textTransform: "uppercase" as const,
                              letterSpacing: "0.08em",
                            }}
                          >
                            Team
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          {/* Count pill — always visible */}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              background: "#eef2ff",
                              color: "#6366f1",
                              border: "1px solid #c7d2fe",
                              borderRadius: 20,
                            }}
                          >
                            {currentMembers} / {gradProject?.partnersCount ?? 0}
                          </span>
                          {/* Full badge — replaces "X seats left" when team is complete */}
                          {isFull ? (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 7px",
                                background:
                                  "linear-gradient(135deg,#10b981,#059669)",
                                color: "white",
                                borderRadius: 20,
                              }}
                            >
                              ✓ Full
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#94a3b8",
                              }}
                            >
                              {Math.max(
                                0,
                                (gradProject?.partnersCount ?? 0) -
                                  currentMembers,
                              )}{" "}
                              seat
                              {Math.max(
                                0,
                                (gradProject?.partnersCount ?? 0) -
                                  currentMembers,
                              ) !== 1
                                ? "s"
                                : ""}{" "}
                              open
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Member rows */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column" as const,
                          gap: 6,
                        }}
                      >
                        {teamMembers.length === 0 ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "10px 12px",
                              background: "#f8fafc",
                              border: "1px dashed #cbd5e1",
                              borderRadius: 8,
                            }}
                          >
                            <Users size={13} color="#cbd5e1" />
                            <span
                              style={{
                                fontSize: 12,
                                color: "#94a3b8",
                                fontWeight: 500,
                              }}
                            >
                              No members yet — invite students to join
                            </span>
                          </div>
                        ) : (
                          teamMembers.map((m) => (
                            <TeamMemberRow
                              key={m.studentId}
                              member={m}
                              canManageTeam={
                                myRole === "owner" ||
                                myRole === ("leader" as any)
                              }
                              isSelf={
                                myStudentId !== null &&
                                m.studentId === myStudentId
                              }
                              isRemoving={removingId === m.studentId}
                              onRemove={() => handleRemoveMember(m.studentId)}
                              isPromoting={promotingId === m.studentId}
                              onMakeLeader={() => handleMakeLeader(m.studentId)}
                            />
                          ))
                        )}
                      </div>

                      {/* Inline action feedback — removal or leader change */}
                      {(removeMsg || leaderMsg) && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: 12,
                            fontWeight: 600,
                            color: (removeMsg ?? leaderMsg)!.ok
                              ? "#16a34a"
                              : "#ef4444",
                          }}
                        >
                          {(removeMsg ?? leaderMsg)!.msg}
                        </p>
                      )}

                      {/* Footer: browse button (owner, not full) or complete notice */}
                      {gradProject?.isOwner && !isFull && (
                        <button
                          onClick={() =>
                            navigate(
                              `/students?projectId=${gradProject?.id ?? ""}`,
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 10,
                            padding: "6px 12px",
                            background: "white",
                            border: "1.5px solid #c7d2fe",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#6366f1",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <UserPlus size={12} /> Browse Students to Join
                        </button>
                      )}
                      {isFull && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 10,
                          }}
                        >
                          <CheckCircle2 size={13} color="#10b981" />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#10b981",
                            }}
                          >
                            Team is complete
                          </span>
                        </div>
                      )}
                    </div>
                    {/* end team section */}

                  </div>
                )}
              </div>
            )}

            {/* Recent Activity */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <Activity size={15} color="#6366f1" /> Recent Activity
                </h3>
              </div>
              <div style={S.emptyState}>
                <span style={{ fontSize: 28 }}>📭</span>
                <p style={S.emptyTitle}>No activity yet</p>
                <p style={S.emptyDesc}>Your recent actions will appear here</p>
              </div>
            </div>
          </div>

          {/* RIGHT COL */}
          <div
            style={{
              ...S.rightCol,
              ...(isNarrowLayout ? S.rightColNarrow : {}),
            }}
          >
            <div style={S.rightColTopRow}>
            {/* My Graduation Project */}
            <div style={{ ...S.card, ...S.rightColTopCard }}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>🎓 My Graduation Project</h3>
                {!gradProject && !gradLoading && (
                  <button
                    onClick={() => openGradModal("create")}
                    style={S.cardActionBtn}
                  >
                    + Create <ChevronRight size={12} />
                  </button>
                )}
              </div>

              {/* Loading */}
              {gradLoading && (
                <div style={S.emptyState}>
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>
                    ⏳ Loading...
                  </p>
                </div>
              )}

              {/* No project */}
              {!gradLoading && !gradProject && (
                <div style={S.emptyState}>
                  <span style={{ fontSize: 24 }}>📝</span>
                  <p style={S.emptyTitle}>
                    You don't have a graduation project yet
                  </p>
                  <p style={S.emptyDesc}>
                    Create your graduation project and find teammates
                  </p>
                  <button
                    onClick={() => openGradModal("create")}
                    style={{
                      marginTop: 8,
                      padding: "7px 16px",
                      background: "linear-gradient(135deg,#6366f1,#a855f7)",
                      color: "white",
                      border: "none",
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Create Graduation Project
                  </button>
                </div>
              )}

              {/* Project exists */}
              {!gradLoading && gradProject && (
                <div
                  style={{
                    padding: "14px",
                    background:
                      "linear-gradient(135deg,rgba(99,102,241,0.05),rgba(168,85,247,0.05))",
                    border: "1px solid rgba(99,102,241,0.15)",
                    borderRadius: 12,
                  }}
                >
                  {/* Header: name + role badge + action */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: "0 0 3px",
                        }}
                      >
                        {gradProject?.name ?? ""}
                      </p>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 7px",
                          background: gradProject?.isOwner
                            ? "linear-gradient(135deg,#6366f1,#a855f7)"
                            : "#e0e7ff",
                          color: gradProject?.isOwner ? "white" : "#6366f1",
                          borderRadius: 20,
                        }}
                      >
                        {gradProject?.isOwner ? "👑 Owner" : "👥 Member"}
                      </span>
                    </div>
                    {gradProject?.isOwner ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openGradModal("edit")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#6366f1",
                            fontSize: 11,
                            fontFamily: "inherit",
                            padding: "2px 6px",
                            borderRadius: 6,
                            fontWeight: 700,
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteProject}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontSize: 11,
                            fontFamily: "inherit",
                            padding: "2px 6px",
                            borderRadius: 6,
                          }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleLeaveProject}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94a3b8",
                          fontSize: 11,
                          fontFamily: "inherit",
                          padding: "2px 6px",
                          borderRadius: 6,
                        }}
                      >
                        Leave
                      </button>
                    )}
                  </div>

                  {/* Abstract + project type */}
                  {(gradProject.projectType ||
                    (gradProject.abstract ?? "").trim()) && (
                    <div
                      style={{
                        margin: "0 0 8px",
                        display: "flex",
                        flexWrap: "wrap" as const,
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      {gradProject.projectType ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            background: "#f1f5f9",
                            color: "#475569",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {gradProject.projectType}
                        </span>
                      ) : null}
                      {(gradProject.abstract ?? "").trim() ? (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            margin: 0,
                            lineHeight: 1.5,
                            flex: "1 1 200px",
                          }}
                        >
                          {(gradProject.abstract ?? "").trim()}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Owner name */}
                  <p
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      margin: "0 0 8px",
                      fontWeight: 500,
                    }}
                  >
                    by {gradProject?.ownerName ?? "—"}
                  </p>

                  {/* Required skills */}
                  {(gradProject.requiredSkills ?? []).length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap" as const,
                        gap: 4,
                        marginBottom: 10,
                      }}
                    >
                      {(gradProject.requiredSkills ?? []).map((sk: string) => (
                        <span key={sk} style={S.skillChipSm}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI recommendations */}
                  <div style={{ marginTop: 12, marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={handleAiRecommendedStudents}
                      disabled={loadingStudents}
                      style={{
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 8,
                        border: "1px solid #c7d2fe",
                        background: "#fff",
                        color: "#6366f1",
                        cursor: loadingStudents ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Find Best Teammates (AI)
                    </button>
                    {loadingStudents ? (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
                        Loading AI recommendations...
                      </p>
                    ) : null}
                    {aiStudentsError ? (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#ef4444" }}>
                        {aiStudentsError}
                      </p>
                    ) : null}
                    {!loadingStudents && !aiStudentsError && aiStudents.length > 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(220px, 1fr))",
                          gap: 10,
                          marginTop: 10,
                        }}
                      >
                        {aiStudents.map((s) => (
                          <div
                            key={s.studentId}
                            style={{
                              border: "1px solid #e2e8f0",
                              borderRadius: 10,
                              padding: 12,
                              background: "#fff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 8,
                                marginBottom: 8,
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  lineHeight: 1.3,
                                }}
                              >
                                {s.name}
                              </p>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: 8,
                                  background: "#eef2ff",
                                  color: "#6366f1",
                                  flexShrink: 0,
                                }}
                              >
                                {s.matchScore}%
                              </span>
                            </div>
                            <p
                              style={{
                                margin: "0 0 4px",
                                fontSize: 12,
                                color: "#64748b",
                              }}
                            >
                              {s.major}
                            </p>
                            <p
                              style={{
                                margin: "0 0 8px",
                                fontSize: 11,
                                color: "#94a3b8",
                              }}
                            >
                              {s.university}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap" as const,
                                gap: 4,
                              }}
                            >
                              {(s.skills ?? []).map((sk) => (
                                <span key={`${s.studentId}-${sk}`} style={S.skillChipSm}>
                                  {sk}
                                </span>
                              ))}
                            </div>
                            {gradProject?.isOwner ? (
                              <div style={{ marginTop: 10 }}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleAiCardInviteStudent(s.studentId)
                                  }
                                  disabled={
                                    isFull ||
                                    aiCardInviteLoadingId === s.studentId
                                  }
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    border: "1px solid #c7d2fe",
                                    background: "#fff",
                                    color: "#6366f1",
                                    cursor:
                                      isFull ||
                                      aiCardInviteLoadingId === s.studentId
                                        ? "not-allowed"
                                        : "pointer",
                                    fontFamily: "inherit",
                                    opacity: isFull ? 0.55 : 1,
                                  }}
                                >
                                  {aiCardInviteLoadingId === s.studentId
                                    ? "Sending…"
                                    : "Invite"}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleAiRecommendedSupervisorsJson}
                      disabled={loadingSupervisors}
                      style={{
                        marginTop: 10,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 8,
                        border: "1px solid #c7d2fe",
                        background: "#fff",
                        color: "#6366f1",
                        cursor: loadingSupervisors ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Recommend Supervisors (AI)
                    </button>
                    {loadingSupervisors ? (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
                        Loading AI recommendations...
                      </p>
                    ) : null}
                    {aiSupervisorsError ? (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#ef4444" }}>
                        {aiSupervisorsError}
                      </p>
                    ) : null}
                    {!loadingSupervisors && !aiSupervisorsError && aiSupervisors.length > 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(200px, 1fr))",
                          gap: 10,
                          marginTop: 10,
                        }}
                      >
                        {aiSupervisors.map((sup) => (
                          <div
                            key={sup.doctorId}
                            style={{
                              border: "1px solid #e2e8f0",
                              borderRadius: 10,
                              padding: 12,
                              background: "#fff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 8,
                                marginBottom: 6,
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  lineHeight: 1.3,
                                }}
                              >
                                <ProfileLink userId={sup.doctorId} role="doctor">{sup.name}</ProfileLink>
                              </p>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: 8,
                                  background: "#eef2ff",
                                  color: "#6366f1",
                                  flexShrink: 0,
                                }}
                              >
                                {sup.matchScore}%
                              </span>
                            </div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: "#64748b",
                                lineHeight: 1.45,
                              }}
                            >
                              {sup.specialization}
                            </p>
                            {myRole === "owner" || myRole === "leader" ? (
                              <div style={{ marginTop: 10 }}>
                                {gradProject.supervisor ? null : normApiStatus(
                                    gradProject.supervisorRequestStatus,
                                  ) === "pending" &&
                                  gradProject.pendingSupervisor != null &&
                                  gradProject.pendingSupervisor.doctorId ===
                                    sup.doctorId ? (
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "#15803d",
                                    }}
                                  >
                                    Request pending
                                  </p>
                                ) : normApiStatus(
                                    gradProject.supervisorRequestStatus,
                                  ) === "pending" &&
                                  gradProject.pendingSupervisor != null &&
                                  gradProject.pendingSupervisor.doctorId !==
                                    sup.doctorId ? (
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 11,
                                      color: "#94a3b8",
                                    }}
                                  >
                                    Another request is pending
                                  </p>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleAiCardRequestSupervisor(
                                          sup.doctorId,
                                        )
                                      }
                                      disabled={
                                        aiCardSupervisorLoadingId ===
                                        sup.doctorId
                                      }
                                      style={{
                                        padding: "6px 12px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        borderRadius: 8,
                                        border: "1px solid #c7d2fe",
                                        background: "#fff",
                                        color: "#6366f1",
                                        cursor:
                                          aiCardSupervisorLoadingId ===
                                          sup.doctorId
                                            ? "not-allowed"
                                            : "pointer",
                                        fontFamily: "inherit",
                                      }}
                                    >
                                      {aiCardSupervisorLoadingId ===
                                      sup.doctorId
                                        ? "Sending…"
                                        : "Request"}
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* ── Team Members ── */}
                  <div
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid rgba(99,102,241,0.12)",
                      paddingTop: 12,
                    }}
                  >
                    {/* Header: label + count + full badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Users size={12} color="#6366f1" />
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#64748b",
                            textTransform: "uppercase" as const,
                            letterSpacing: "0.08em",
                          }}
                        >
                          Team
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {/* Count pill — always visible */}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            background: "#eef2ff",
                            color: "#6366f1",
                            border: "1px solid #c7d2fe",
                            borderRadius: 20,
                          }}
                        >
                          {currentMembers} / {gradProject?.partnersCount ?? 0}
                        </span>
                        {/* Full badge — replaces "X seats left" when team is complete */}
                        {isFull ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              background:
                                "linear-gradient(135deg,#10b981,#059669)",
                              color: "white",
                              borderRadius: 20,
                            }}
                          >
                            ✓ Full
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "#94a3b8",
                            }}
                          >
                            {Math.max(
                              0,
                              (gradProject?.partnersCount ?? 0) -
                                currentMembers,
                            )}{" "}
                            seat
                            {Math.max(
                              0,
                              (gradProject?.partnersCount ?? 0) -
                                currentMembers,
                            ) !== 1
                              ? "s"
                              : ""}{" "}
                            open
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Member rows */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column" as const,
                        gap: 6,
                      }}
                    >
                      {teamMembers.length === 0 ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 12px",
                            background: "#f8fafc",
                            border: "1px dashed #cbd5e1",
                            borderRadius: 8,
                          }}
                        >
                          <Users size={13} color="#cbd5e1" />
                          <span
                            style={{
                              fontSize: 12,
                              color: "#94a3b8",
                              fontWeight: 500,
                            }}
                          >
                            No members yet — invite students to join
                          </span>
                        </div>
                      ) : (
                        teamMembers.map((m) => (
                          <TeamMemberRow
                            key={m.studentId}
                            member={m}
                            canManageTeam={
                              myRole === "owner" || myRole === ("leader" as any)
                            }
                            isSelf={
                              myStudentId !== null &&
                              m.studentId === myStudentId
                            }
                            isRemoving={removingId === m.studentId}
                            onRemove={() => handleRemoveMember(m.studentId)}
                            isPromoting={promotingId === m.studentId}
                            onMakeLeader={() => handleMakeLeader(m.studentId)}
                          />
                        ))
                      )}
                    </div>

                    {/* Inline action feedback — removal or leader change */}
                    {(removeMsg || leaderMsg) && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 12,
                          fontWeight: 600,
                          color: (removeMsg ?? leaderMsg)!.ok
                            ? "#16a34a"
                            : "#ef4444",
                        }}
                      >
                        {(removeMsg ?? leaderMsg)!.msg}
                      </p>
                    )}

                    {/* Footer: browse button (owner, not full) or complete notice */}
                    {gradProject?.isOwner && !isFull && (
                      <button
                        onClick={() =>
                          navigate(
                            `/students?projectId=${gradProject?.id ?? ""}`,
                          )
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 10,
                          padding: "6px 12px",
                          background: "white",
                          border: "1.5px solid #c7d2fe",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#6366f1",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <UserPlus size={12} /> Browse Students to Join
                      </button>
                    )}
                    {isFull && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 10,
                        }}
                      >
                        <CheckCircle2 size={13} color="#10b981" />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#10b981",
                          }}
                        >
                          Team is complete
                        </span>
                      </div>
                    )}
                  </div>
                  {/* end team section */}

                  <AiSupervisorRecommendations
                    uiState={aiRecommendUiState}
                    items={aiRecommendItems}
                    errorMessage={aiRecommendError}
                    onRecommend={handleRecommendSupervisors}
                    onRequestSupervisor={handleAiRecommendRequestSupervisor}
                    cardRequestByDoctor={aiSupervisorCardRequests}
                    supervisionSnapshot={aiSupervisionSnapshot}
                    supervisionPending={
                      supervisionUi.mode === "pending"
                    }
                    canTriggerRecommend={
                      myRole === "owner" || myRole === "leader"
                    }
                    formatDoctorName={formatSupervisorDoctorName}
                  />
                </div>
              )}
            </div>

            {/* Course Teams — separate from graduation project */}
            <div
              style={{
                ...S.card,
                ...S.rightColTopCard,
                ...S.ctDashCourseTeamsCard,
              }}
            >
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <BookOpen size={15} color="#6366f1" /> My Courses
                </h3>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div style={S.ctDashStatPill}>
                  <p style={S.ctDashStatLabel}>Enrolled courses</p>
                  <p style={S.ctDashStatValue}>
                    {ctDashCardCoursesCount === null
                      ? "—"
                      : ctDashCardCoursesCount}
                  </p>
                </div>
                <div style={S.ctDashStatPill}>
                  <p style={S.ctDashStatLabel}>Partner activity</p>
                  <p style={S.ctDashStatValue}>
                    {ctDashCardRequestsCount === null
                      ? "—"
                      : ctDashCardRequestsCount}
                  </p>
                  <p style={S.ctDashStatHint}>Incoming & outgoing items</p>
                </div>
              </div>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 12,
                  color: "#64748b",
                  lineHeight: 1.55,
                  fontWeight: 500,
                }}
              >
                View teams, project settings, classmates, and partner requests
                for each course — in one place.
              </p>
              <button
                type="button"
                onClick={() => navigate("/student/courses")}
                style={{
                  width: "100%",
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#a855f7)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.38)",
                }}
              >
                <Users size={15} />
                Manage My Courses
              </button>
            </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── PROFILE STRENGTH MODAL ── */}
      {editInfoOpen && (
        <div style={S.modalOverlay} onClick={() => setEditInfoOpen(false)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                Profile Strength
              </h3>
              <button
                onClick={() => setEditInfoOpen(false)}
                style={S.modalCloseBtn}
              >
                <X size={15} />
              </button>
            </div>
            <div style={S.progressRow}>
              <div style={S.progressTrack}>
                <div style={{ ...S.progressFill, width: `${completeness}%` }} />
              </div>
              <span style={S.progressPct}>{completeness}%</span>
            </div>
            <p style={S.progressLabel}>
              {completeness >= 80
                ? "🔥 Strong profile!"
                : "Complete your profile to get better AI matches"}
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column" as const,
                gap: 10,
              }}
            >
              {PROFILE_TASKS.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {task.done ? (
                    <CheckCircle2
                      size={15}
                      color="#6366f1"
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <Circle size={15} color="#cbd5e1" style={{ flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: "#475569",
                      fontWeight: 500,
                      textDecoration: task.done ? "line-through" : "none",
                      opacity: task.done ? 0.4 : 1,
                    }}
                  >
                    {task.label}
                  </span>
                  {!task.done && (
                    <Link
                      to={task.link}
                      style={{
                        fontSize: 11,
                        color: "#6366f1",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Do it
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <button
                onClick={() => setEditInfoOpen(false)}
                style={S.modalCancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COURSE TEAMS MODAL (enrolled courses + detail; no student actions) ── */}
      {courseTeamsModalOpen && (
        <div style={S.modalOverlay} onClick={closeCourseTeamsModal}>
          <div
            style={{
              ...S.modalBox,
              width: 920,
              maxWidth: "96vw",
              maxHeight: "88vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column" as const,
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "22px 26px 18px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  Course Teams
                </h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12,
                    color: "#64748b",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    maxWidth: 420,
                  }}
                >
                  Pick a course to see project details, your team, classmates,
                  and partner requests — all in one workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCourseTeamsModal}
                style={S.modalCloseBtn}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px, 260px) 1fr",
                gap: 0,
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <aside
                style={{
                  borderRight: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: "18px 16px",
                  overflowY: "auto" as const,
                }}
              >
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                  }}
                >
                  Enrolled courses
                </p>
                {ctCoursesLoading && (
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                    Loading…
                  </p>
                )}
                {ctCoursesError && (
                  <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>
                    {ctCoursesError}
                  </p>
                )}
                {!ctCoursesLoading &&
                  !ctCoursesError &&
                  ctNoValidCourseIds &&
                  ctCourses.length === 0 && (
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                      No valid courses found (invalid IDs)
                    </p>
                  )}
                {!ctCoursesLoading &&
                  !ctCoursesError &&
                  !ctNoValidCourseIds &&
                  ctCourses.length === 0 && (
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                      You are not enrolled in any courses yet.
                    </p>
                  )}
                {!ctCoursesLoading &&
                  !ctCoursesError &&
                  ctCourses.map((c) => {
                    const courseObj = ctAsRecord(c);
                    const courseId = getCourseId(c);
                    if (courseId == null) return null;
                    const sel = ctSelectedCourseId === courseId;
                    return (
                      <button
                        key={courseId}
                        type="button"
                        onClick={() => {
                          console.log("Clicked course:", c);
                          console.log("Normalized ID:", getCourseId(c));
                          setCtSelectedCourseId(courseId);
                          console.log("Selected ID set:", courseId);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          marginBottom: 8,
                          borderRadius: 10,
                          border: sel
                            ? "1.5px solid #6366f1"
                            : "1.5px solid #e2e8f0",
                          background: sel ? "#eef2ff" : "#fff",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                            marginBottom: 2,
                          }}
                        >
                          {ctReadTextField(courseObj, ["name", "Name"]) ||
                            `Course #${courseId}`}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {ctReadTextField(courseObj, ["code", "Code"])}
                          {ctReadTextField(courseObj, [
                            "section",
                            "Section",
                          ]) !== "—"
                            ? ` · ${ctReadTextField(courseObj, ["section", "Section"])}`
                            : ""}
                        </div>
                      </button>
                    );
                  })}
              </aside>
              <main
                style={{
                  padding: "20px 24px 24px",
                  overflowY: "auto" as const,
                  background: "#fff",
                }}
              >
                {!ctSelectedCourseId && !ctCoursesLoading && (
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                    Select a course to view details.
                  </p>
                )}
                {ctSelectedCourseId && ctDetailsLoading && (
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                    Loading course data…
                  </p>
                )}
                {ctSelectedCourseId && ctDetailsError && (
                  <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>
                    {ctDetailsError}
                  </p>
                )}
                {ctSelectedCourseId &&
                  !ctDetailsLoading &&
                  !ctDetailsError &&
                  (() => {
                    const sel = ctCourses.find(
                      (x) => getCourseId(x) === ctSelectedCourseId,
                    );
                    const courseObj = ctAsRecord(ctCourseDetail);
                    const settingObj = ctAsRecord(ctProjectSetting);
                    const myTeamObj = ctAsRecord(ctMyTeam);
                    const settingTitle = ctReadTextField(settingObj, [
                      "title",
                      "Title",
                      "projectTitle",
                      "ProjectTitle",
                    ]);
                    const settingDescription = ctReadTextField(settingObj, [
                      "description",
                      "Description",
                      "projectDescription",
                      "ProjectDescription",
                    ]);
                    const settingTeamSize = ctReadNumberField(settingObj, [
                      "teamSize",
                      "TeamSize",
                      "maxTeamSize",
                      "MaxTeamSize",
                    ]);
                    const settingFileUrl = ctReadOptionalLink(settingObj, [
                      "fileUrl",
                      "FileUrl",
                      "attachedFileUrl",
                      "AttachedFileUrl",
                      "projectFile",
                      "ProjectFile",
                    ]);
                    const myRoleStr = ctReadTextField(myTeamObj, [
                      "myRole",
                      "MyRole",
                      "role",
                      "Role",
                    ]);
                    const ctPendingIncomingList = (
                      ctPartnerRequests?.incoming ?? []
                    ).filter(ctIsIncomingPartnerRequestPending);
                    const incomingCt = ctPendingIncomingList.length;
                    const outgoingCt = (
                      ctPartnerRequests?.outgoing ?? []
                    ).filter(ctIsOutgoingPendingPartnerRequest).length;
                    const teamMemberDbIds = new Set<number>();
                    for (const m of ctMyTeam?.members ?? []) {
                      if (
                        typeof m.studentId === "number" &&
                        Number.isFinite(m.studentId)
                      ) {
                        teamMemberDbIds.add(m.studentId);
                      }
                    }
                    const outgoingPendingReceiverDbIds = new Set<number>();
                    for (const r of ctPartnerRequests?.outgoing ?? []) {
                      if (!ctIsOutgoingPendingPartnerRequest(r)) continue;
                      const rid = ctPartnerRequestReceiverDbId(r);
                      if (rid != null) outgoingPendingReceiverDbIds.add(rid);
                    }
                    const myAuthUserId = myUserIdRef.current;
                    const ctCourseTeamIsLeader =
                      normApiStatus(myRoleStr) === "leader";
                    let ctMyCourseTeamSelfStudentId: number | null = null;
                    for (const m of ctMyTeam?.members ?? []) {
                      if (
                        myAuthUserId != null &&
                        m.userId === myAuthUserId
                      ) {
                        ctMyCourseTeamSelfStudentId = m.studentId;
                        break;
                      }
                    }
                    return (
                      <div style={S.ctModalStack}>
                        {ctPartnerRequestBlockedNoSection ? (
                          <div
                            style={{
                              padding: "10px 12px",
                              borderRadius: 10,
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              color: "#92400e",
                              fontSize: 13,
                              fontWeight: 600,
                              lineHeight: 1.45,
                            }}
                          >
                            You must be assigned to a section first
                          </div>
                        ) : null}
                        <section style={S.ctModalSectionMuted}>
                          <h4 style={S.ctModalH4}>Course overview</h4>
                          <p style={S.ctModalH4Sub}>
                            Basic information for the course you have selected.
                          </p>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 12,
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Course
                              </p>
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                }}
                              >
                                {sel?.name ||
                                  ctReadTextField(courseObj, ["name", "Name"])}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Code
                              </p>
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                }}
                              >
                                {sel?.code ||
                                  ctReadTextField(courseObj, ["code", "Code"])}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Section
                              </p>
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                }}
                              >
                                {sel?.section ||
                                  ctReadTextField(courseObj, [
                                    "section",
                                    "Section",
                                  ])}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Semester
                              </p>
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                }}
                              >
                                {sel?.semester ||
                                  ctReadTextField(courseObj, [
                                    "semester",
                                    "Semester",
                                  ])}
                              </p>
                            </div>
                          </div>
                          {ctCourseProjects.length > 0 ? (
                            <div
                              style={{
                                marginTop: 16,
                                paddingTop: 14,
                                borderTop: "1px solid #e2e8f0",
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Course project
                              </p>
                              {ctCourseProjects.length > 1 ? (
                                <label
                                  style={{
                                    display: "flex",
                                    flexDirection: "column" as const,
                                    gap: 6,
                                    marginTop: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: "#475569",
                                      fontWeight: 600,
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    This course has multiple projects. Choose
                                    which one you are working in — partner
                                    actions will use this selection.
                                  </span>
                                  <select
                                    value={
                                      ctSelectedCourseProjectId != null
                                        ? String(ctSelectedCourseProjectId)
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      const n = Number(v);
                                      setCtSelectedCourseProjectId(
                                        v !== "" && Number.isFinite(n)
                                          ? n
                                          : null,
                                      );
                                    }}
                                    style={{
                                      maxWidth: 420,
                                      padding: "8px 10px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      borderRadius: 8,
                                      border: "1px solid #e2e8f0",
                                      background: "#fff",
                                      color: "#334155",
                                      fontFamily: "inherit",
                                    }}
                                  >
                                    {ctCourseProjects.map((p) => (
                                      <option key={p.id} value={String(p.id)}>
                                        {p.title?.trim() || `Project #${p.id}`}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : (
                                <p
                                  style={{
                                    margin: "8px 0 0",
                                    fontSize: 13,
                                    color: "#0f172a",
                                    fontWeight: 600,
                                    lineHeight: 1.45,
                                  }}
                                >
                                  {ctCourseProjects[0]?.title?.trim() ||
                                    `Project #${ctCourseProjects[0]?.id}`}
                                </p>
                              )}
                            </div>
                          ) : null}
                          {ctSelectedCourseId && (
                            <div
                              style={{
                                marginTop: 16,
                                paddingTop: 14,
                                borderTop: "1px solid #e2e8f0",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => void handleCourseTeamsLeaveCourse()}
                                disabled={ctLeavingCourse}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "8px 14px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  borderRadius: 8,
                                  border: "1px solid #fecaca",
                                  background: "#fff",
                                  color: "#dc2626",
                                  cursor: ctLeavingCourse ? "not-allowed" : "pointer",
                                  fontFamily: "inherit",
                                  opacity: ctLeavingCourse ? 0.75 : 1,
                                }}
                              >
                                {ctLeavingCourse ? "Leaving..." : "Leave Course"}
                              </button>
                            </div>
                          )}
                        </section>
                        <section style={S.ctModalSection}>
                          <h4 style={S.ctModalH4}>Project setting</h4>
                          <p style={S.ctModalH4Sub}>
                            What your instructor configured for this course
                            project.
                          </p>
                          {ctProjectSetting === null ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#94a3b8",
                              }}
                            >
                              No project setting yet
                            </p>
                          ) : (
                            <>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: 12,
                                  marginBottom: 10,
                                }}
                              >
                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 11,
                                      color: "#64748b",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Title
                                  </p>
                                  <p
                                    style={{
                                      margin: "4px 0 0",
                                      fontSize: 13,
                                      color: "#0f172a",
                                    }}
                                  >
                                    {settingTitle}
                                  </p>
                                </div>
                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 11,
                                      color: "#64748b",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Team size
                                  </p>
                                  <p
                                    style={{
                                      margin: "4px 0 0",
                                      fontSize: 13,
                                      color: "#0f172a",
                                    }}
                                  >
                                    {settingTeamSize === null
                                      ? "—"
                                      : String(settingTeamSize)}
                                  </p>
                                </div>
                              </div>
                              <p
                                style={{
                                  margin: "0 0 6px",
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Description
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 13,
                                  color: "#334155",
                                  lineHeight: 1.55,
                                }}
                              >
                                {settingDescription}
                              </p>
                              <p
                                style={{
                                  margin: "12px 0 6px",
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Attached file
                              </p>
                              {settingFileUrl ? (
                                <a
                                  href={settingFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#4338ca",
                                  }}
                                >
                                  Open attached file
                                </a>
                              ) : (
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 13,
                                    color: "#94a3b8",
                                  }}
                                >
                                  No file attached for this project yet.
                                </p>
                              )}
                            </>
                          )}
                        </section>
                        <section style={S.ctModalSectionMuted}>
                          <h4 style={S.ctModalH4}>My team</h4>
                          <p style={S.ctModalH4Sub}>
                            Your assigned team for this course (if any).
                          </p>
                          {!ctMyTeam && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#475569",
                                lineHeight: 1.55,
                              }}
                            >
                              You are not in a team yet. Invite classmates or
                              accept partner requests to form a team.
                            </p>
                          )}
                          {ctMyTeam && (
                            <>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: 12,
                                  marginBottom: 12,
                                }}
                              >
                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 11,
                                      color: "#64748b",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Team ID
                                  </p>
                                  <p
                                    style={{
                                      margin: "4px 0 0",
                                      fontSize: 13,
                                      color: "#0f172a",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {String(ctMyTeam.teamId)}
                                  </p>
                                </div>
                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 11,
                                      color: "#64748b",
                                      fontWeight: 700,
                                    }}
                                  >
                                    My role
                                  </p>
                                  <p
                                    style={{
                                      margin: "4px 0 0",
                                      fontSize: 13,
                                      color: "#0f172a",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {myRoleStr}
                                  </p>
                                </div>
                              </div>
                              <p
                                style={{
                                  margin: "0 0 8px",
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Members
                              </p>
                              {ctMyTeam.members.length === 0 ? (
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 13,
                                    color: "#94a3b8",
                                  }}
                                >
                                  No other members are listed for this team
                                  yet.
                                </p>
                              ) : (
                                <ul
                                  style={{
                                    margin: 0,
                                    padding: 0,
                                    listStyle: "none",
                                    display: "flex",
                                    flexDirection: "column" as const,
                                    gap: 8,
                                  }}
                                >
                                  {ctMyTeam.members.map((member) => {
                                    const isMemberTeamLeader =
                                      normApiStatus(
                                        member.role ??
                                          (
                                            member as TeamMember & {
                                              Role?: string;
                                            }
                                          ).Role,
                                      ) === "leader";
                                    const isSelfMember =
                                      ctMyCourseTeamSelfStudentId !== null &&
                                      member.studentId ===
                                        ctMyCourseTeamSelfStudentId;
                                    const showRemoveMember =
                                      ctCourseTeamIsLeader &&
                                      !isSelfMember &&
                                      !isMemberTeamLeader;
                                    const memberRowBusy =
                                      ctRemovingMemberStudentId ===
                                      member.studentId;
                                    return (
                                    <li
                                      key={member.studentId}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "8px 10px",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 8,
                                        background: "#fff",
                                        fontSize: 13,
                                        opacity: memberRowBusy ? 0.65 : 1,
                                      }}
                                    >
                                      <div
                                        style={{
                                          flex: 1,
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          gap: 8,
                                          minWidth: 0,
                                        }}
                                      >
                                        <span style={{ fontWeight: 600 }}>
                                          {ctMemberDisplayName(member)}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: 12,
                                            color: "#64748b",
                                          }}
                                        >
                                          {member.universityId}
                                        </span>
                                      </div>
                                      {showRemoveMember ? (
                                        <button
                                          type="button"
                                          disabled={memberRowBusy}
                                          onClick={() => {
                                            if (
                                              memberRowBusy ||
                                              !ctSelectedCourseId
                                            )
                                              return;
                                            void handleCtRemoveTeamMember(
                                              ctMyTeam.teamId,
                                              member.studentId,
                                            );
                                          }}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 4,
                                            flexShrink: 0,
                                            padding: "4px 8px",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            borderRadius: 6,
                                            border: "1px solid #fecaca",
                                            background: "#fff",
                                            color: "#dc2626",
                                            cursor: memberRowBusy
                                              ? "not-allowed"
                                              : "pointer",
                                            fontFamily: "inherit",
                                          }}
                                          title="Remove from team"
                                        >
                                          <Trash2 size={12} />
                                          {memberRowBusy
                                            ? "Removing..."
                                            : "Remove"}
                                        </button>
                                      ) : null}
                                    </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </>
                          )}
                        </section>
                        <section style={S.ctModalSection}>
                          <h4 style={S.ctModalH4}>
                            AI Partner Recommendations
                          </h4>
                          <p style={S.ctModalH4Sub}>
                            Suggested classmates based on AI matching for this
                            course.
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 12,
                              flexWrap: "wrap" as const,
                            }}
                          >
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#64748b",
                              }}
                            >
                              Mode:
                              <select
                                value={ctRecommendedMode}
                                onChange={(e) =>
                                  setCtRecommendedMode(
                                    e.target.value as RecommendedPartnerMode,
                                  )
                                }
                                disabled={ctRecommendedLoading}
                                style={{
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  borderRadius: 8,
                                  border: "1px solid #e2e8f0",
                                  background: "#fff",
                                  color: "#334155",
                                  fontFamily: "inherit",
                                }}
                              >
                                <option value="complementary">
                                  Complementary
                                </option>
                                <option value="similar">Similar</option>
                              </select>
                            </label>
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#64748b",
                              }}
                            >
                              Sort:
                              <select
                                value={ctRecommendedSort}
                                onChange={(e) =>
                                  setCtRecommendedSort(
                                    e.target.value as "best" | "lowest",
                                  )
                                }
                                style={{
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  borderRadius: 8,
                                  border: "1px solid #e2e8f0",
                                  background: "#fff",
                                  color: "#334155",
                                  fontFamily: "inherit",
                                }}
                              >
                                <option value="best">Best Match</option>
                                <option value="lowest">Lowest Match</option>
                              </select>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setAiLoaded(true);
                                void fetchRecommendations();
                              }}
                              disabled={ctRecommendedLoading || !ctSelectedCourseId}
                              style={{
                                padding: "6px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                                borderRadius: 8,
                                border: "1px solid #c7d2fe",
                                background: "#fff",
                                color: "#4338ca",
                                cursor:
                                  ctRecommendedLoading || !ctSelectedCourseId
                                    ? "not-allowed"
                                    : "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              Generate
                            </button>
                          </div>
                          {!aiLoaded ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#64748b",
                                lineHeight: 1.55,
                              }}
                            >
                              Click Generate to get recommendations
                            </p>
                          ) : ctRecommendedLoading ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#64748b",
                                lineHeight: 1.55,
                              }}
                            >
                              Loading AI recommendations...
                            </p>
                          ) : ctRecommendedPartners.length === 0 ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#64748b",
                                lineHeight: 1.55,
                              }}
                            >
                              No AI recommendations available yet
                            </p>
                          ) : (
                            <ul
                              style={{
                                margin: 0,
                                padding: 0,
                                listStyle: "none",
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: 10,
                              }}
                            >
                              {[...ctRecommendedPartners]
                                .sort((a, b) => {
                                  const scoreA =
                                    typeof a.matchScore === "number" &&
                                    Number.isFinite(a.matchScore)
                                      ? a.matchScore
                                      : null;
                                  const scoreB =
                                    typeof b.matchScore === "number" &&
                                    Number.isFinite(b.matchScore)
                                      ? b.matchScore
                                      : null;
                                  if (scoreA === null && scoreB === null) return 0;
                                  if (scoreA === null) return 1;
                                  if (scoreB === null) return -1;
                                  return ctRecommendedSort === "best"
                                    ? scoreB - scoreA
                                    : scoreA - scoreB;
                                })
                                .map((rec, idx) => {
                                const recDbId =
                                  typeof rec.studentId === "number" &&
                                  Number.isFinite(rec.studentId)
                                    ? rec.studentId
                                    : null;
                                const matchedCourseStudent =
                                  recDbId != null
                                    ? ctCourseStudents.find(
                                        (s) => ctCourseStudentDbId(s) === recDbId,
                                      )
                                    : typeof rec.userId === "number" &&
                                        Number.isFinite(rec.userId)
                                      ? ctCourseStudents.find(
                                          (s) =>
                                            ctCourseStudentUserId(s) === rec.userId,
                                        )
                                      : undefined;
                                const matchedStudentDbId =
                                  matchedCourseStudent != null
                                    ? ctCourseStudentDbId(matchedCourseStudent)
                                    : null;
                                const receiverUniversityId = (
                                  matchedCourseStudent?.universityId ??
                                  matchedCourseStudent?.UniversityId ??
                                  ""
                                ).trim();
                                const receiverExistsInCourseStudents =
                                  receiverUniversityId !== "";
                                const isSelf =
                                  myAuthUserId != null &&
                                  typeof rec.userId === "number" &&
                                  rec.userId === myAuthUserId;
                                const inTeam =
                                  matchedStudentDbId != null &&
                                  teamMemberDbIds.has(matchedStudentDbId);
                                const pendingOut =
                                  matchedStudentDbId != null &&
                                  outgoingPendingReceiverDbIds.has(
                                    matchedStudentDbId,
                                  );
                                const isSendingThisRow =
                                  ctSendingReceiverUniversityId != null &&
                                  receiverUniversityId !== "" &&
                                  ctSendingReceiverUniversityId ===
                                    receiverUniversityId;
                                const recSkills = Array.isArray(rec.skills)
                                  ? rec.skills.filter(
                                      (s) =>
                                        typeof s === "string" &&
                                        s.trim() !== "",
                                    )
                                  : [];
                                const matchScore =
                                  typeof rec.matchScore === "number" &&
                                  Number.isFinite(rec.matchScore)
                                    ? rec.matchScore
                                    : null;
                                const scorePalette =
                                  matchScore != null && matchScore > 80
                                    ? {
                                        border: "1px solid #bbf7d0",
                                        background: "#f0fdf4",
                                        color: "#15803d",
                                      }
                                    : matchScore != null && matchScore >= 50
                                      ? {
                                          border: "1px solid #fde68a",
                                          background: "#fffbeb",
                                          color: "#92400e",
                                        }
                                      : {
                                          border: "1px solid #e2e8f0",
                                          background: "#f8fafc",
                                          color: "#64748b",
                                        };
                                const rowKey =
                                  recDbId != null ? `ai-${recDbId}` : `ai-${idx}`;
                                return (
                                  <li
                                    key={rowKey}
                                    style={{
                                      padding: "12px",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: 10,
                                      background: "#fafafa",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        gap: 10,
                                      }}
                                    >
                                      <div style={{ minWidth: 0 }}>
                                        {idx === 0 ? (
                                          <span
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              marginBottom: 6,
                                              padding: "2px 8px",
                                              fontSize: 10,
                                              fontWeight: 700,
                                              borderRadius: 999,
                                              color: "#4338ca",
                                              background: "#eef2ff",
                                              border: "1px solid #c7d2fe",
                                            }}
                                          >
                                            Top Match
                                          </span>
                                        ) : null}
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: "#0f172a",
                                          }}
                                        >
                                          {rec.name?.trim() || "—"}
                                        </p>
                                      </div>
                                      <span
                                        style={{
                                          flexShrink: 0,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          padding: "4px 8px",
                                          borderRadius: 8,
                                          ...scorePalette,
                                        }}
                                      >
                                        {matchScore != null ? `${matchScore}%` : "—"}
                                      </span>
                                    </div>
                                    {typeof rec.reason === "string" &&
                                    rec.reason.trim() !== "" ? (
                                      <div
                                        style={{
                                          marginTop: 10,
                                          padding: "8px 10px",
                                          borderRadius: 8,
                                          background: "#f8fafc",
                                          border: "1px solid #e2e8f0",
                                        }}
                                      >
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#64748b",
                                          }}
                                        >
                                          Why this match?
                                        </p>
                                        <p
                                          style={{
                                            margin: "4px 0 0",
                                            fontSize: 13,
                                            color: "#475569",
                                            lineHeight: 1.45,
                                          }}
                                        >
                                          {rec.reason}
                                        </p>
                                      </div>
                                    ) : null}
                                    {recSkills.length > 0 ? (
                                      <div
                                        style={{
                                          marginTop: 10,
                                          display: "flex",
                                          flexWrap: "wrap" as const,
                                          gap: 6,
                                        }}
                                      >
                                        {recSkills.map((sk, skillIdx) => (
                                          <span
                                            key={`${rowKey}-sk-${skillIdx}`}
                                            style={{
                                              padding: "3px 8px",
                                              borderRadius: 999,
                                              fontSize: 10,
                                              fontWeight: 700,
                                              color: "#4338ca",
                                              background: "#eef2ff",
                                              border: "1px solid #c7d2fe",
                                            }}
                                          >
                                            {sk}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                    <div
                                      style={{
                                        marginTop: 10,
                                        display: "flex",
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      {isSelf ? (
                                        <span
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "#94a3b8",
                                          }}
                                        >
                                          You
                                        </span>
                                      ) : inTeam ? (
                                        <button
                                          type="button"
                                          disabled
                                          style={{
                                            padding: "6px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                            background: "#f1f5f9",
                                            color: "#94a3b8",
                                            cursor: "not-allowed",
                                            fontFamily: "inherit",
                                          }}
                                        >
                                          In Your Team
                                        </button>
                                      ) : pendingOut ? (
                                        <button
                                          type="button"
                                          disabled
                                          style={{
                                            padding: "6px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            border: "1px solid #fde68a",
                                            background: "#fffbeb",
                                            color: "#92400e",
                                            cursor: "not-allowed",
                                            fontFamily: "inherit",
                                          }}
                                        >
                                          Request Sent
                                        </button>
                                      ) : !receiverExistsInCourseStudents ? (
                                        <button
                                          type="button"
                                          disabled
                                          style={{
                                            padding: "6px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                            background: "#f8fafc",
                                            color: "#94a3b8",
                                            cursor: "not-allowed",
                                            fontFamily: "inherit",
                                          }}
                                        >
                                          Unavailable
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleCourseTeamsSendPartnerRequest(
                                              receiverUniversityId,
                                            )
                                          }
                                          disabled={
                                            isSendingThisRow ||
                                            ctPartnerRequestBlockedNoSection
                                          }
                                          style={{
                                            padding: "6px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            border: "1px solid #c7d2fe",
                                            background:
                                              isSendingThisRow ||
                                              ctPartnerRequestBlockedNoSection
                                                ? "#eef2ff"
                                                : "#fff",
                                            color: "#4338ca",
                                            cursor:
                                              isSendingThisRow ||
                                              ctPartnerRequestBlockedNoSection
                                                ? "not-allowed"
                                                : "pointer",
                                            fontFamily: "inherit",
                                          }}
                                        >
                                          {isSendingThisRow
                                            ? "Sending..."
                                            : "Send Partner Request"}
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </section>
                        <section style={S.ctModalSection}>
                          <h4 style={S.ctModalH4}>Incoming Partner Requests</h4>
                          <p style={S.ctModalH4Sub}>
                            Other students who asked to partner with you in
                            this course.
                          </p>
                          {ctMyTeam ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#64748b",
                                lineHeight: 1.55,
                              }}
                            >
                              You are already in a team.
                            </p>
                          ) : ctPendingIncomingList.length === 0 ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#64748b",
                                lineHeight: 1.55,
                              }}
                            >
                              You are all caught up — no partner requests need
                              your attention right now.
                            </p>
                          ) : (
                            <ul
                              style={{
                                margin: 0,
                                padding: 0,
                                listStyle: "none",
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: 10,
                              }}
                            >
                              {ctPendingIncomingList.map(
                                (req, incIdx) => {
                                  const requestId = ctPartnerRequestRowId(req);
                                  const row = ctIncomingSenderRow(req.sender);
                                  const incomingRowBusy =
                                    requestId != null &&
                                    ctIncomingRowAction[requestId] !== undefined;
                                  const incomingRowMode =
                                    requestId != null
                                      ? ctIncomingRowAction[requestId]
                                      : undefined;
                                  const initials = row.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase();
                                  return (
                                    <li
                                      key={
                                        requestId != null
                                          ? `inc-${requestId}`
                                          : `inc-${incIdx}`
                                      }
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "10px 12px",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 10,
                                        background: "#fafafa",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: "50%",
                                          overflow: "hidden",
                                          flexShrink: 0,
                                          background: "#e2e8f0",
                                        }}
                                      >
                                        {row.pic ? (
                                          <img
                                            src={row.pic}
                                            alt=""
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover" as const,
                                            }}
                                          />
                                        ) : (
                                          <div
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: 12,
                                              fontWeight: 800,
                                              color: "#64748b",
                                            }}
                                          >
                                            {initials}
                                          </div>
                                        )}
                                      </div>
                                      <div
                                        style={{
                                          flex: 1,
                                          minWidth: 0,
                                        }}
                                      >
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: "#0f172a",
                                          }}
                                        >
                                          {row.name}
                                        </p>
                                        <p
                                          style={{
                                            margin: "2px 0 0",
                                            fontSize: 12,
                                            color: "#64748b",
                                          }}
                                        >
                                          {row.university}
                                        </p>
                                        {row.major ? (
                                          <p
                                            style={{
                                              margin: "2px 0 0",
                                              fontSize: 12,
                                              color: "#64748b",
                                            }}
                                          >
                                            {row.major}
                                          </p>
                                        ) : null}
                                      </div>
                                      <div
                                        style={{
                                          flexShrink: 0,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          disabled={
                                            incomingRowBusy ||
                                            requestId == null
                                          }
                                          onClick={() => {
                                            if (
                                              requestId == null ||
                                              incomingRowBusy
                                            )
                                              return;
                                            void handleCtAcceptIncoming(
                                              requestId,
                                            );
                                          }}
                                          style={{
                                            padding: "6px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            border: "1px solid #bbf7d0",
                                            background: "#f0fdf4",
                                            color: "#15803d",
                                            cursor:
                                              incomingRowBusy ||
                                              requestId == null
                                                ? "not-allowed"
                                                : "pointer",
                                            fontFamily: "inherit",
                                          }}
                                        >
                                          {incomingRowMode === "accept"
                                            ? "Accepting..."
                                            : "Accept"}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={
                                            incomingRowBusy ||
                                            requestId == null
                                          }
                                          onClick={() => {
                                            if (
                                              requestId == null ||
                                              incomingRowBusy
                                            )
                                              return;
                                            void handleCtRejectIncoming(
                                              requestId,
                                            );
                                          }}
                                          style={{
                                            padding: "6px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            border: "1px solid #fecaca",
                                            background: "#fef2f2",
                                            color: "#b91c1c",
                                            cursor:
                                              incomingRowBusy ||
                                              requestId == null
                                                ? "not-allowed"
                                                : "pointer",
                                            fontFamily: "inherit",
                                          }}
                                        >
                                          {incomingRowMode === "reject"
                                            ? "Rejecting..."
                                            : "Reject"}
                                        </button>
                                      </div>
                                    </li>
                                  );
                                },
                              )}
                            </ul>
                          )}
                        </section>
                        <section style={S.ctModalSectionMuted}>
                          <h4 style={S.ctModalH4}>Enrolled students</h4>
                          <p style={S.ctModalH4Sub}>
                            Everyone in this course — send a partner request
                            when you are ready.
                          </p>
                          {ctCourseStudents.length === 0 ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#64748b",
                                lineHeight: 1.55,
                              }}
                            >
                              No classmates are listed for this course yet. If
                              you just enrolled, try again in a moment.
                            </p>
                          ) : (
                            <ul
                              style={{
                                margin: 0,
                                padding: 0,
                                listStyle: "none",
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: 10,
                              }}
                            >
                              {ctCourseStudents.map((raw, idx) => {
                                const st = raw as CourseStudent;
                                const dbId = ctCourseStudentDbId(st);
                                const rowUserId = ctCourseStudentUserId(st);
                                const name =
                                  st.name ?? st.Name ?? "—";
                                const uni =
                                  st.university ?? st.University ?? "—";
                                const maj = st.major ?? st.Major ?? "—";
                                const year =
                                  st.academicYear ?? st.AcademicYear ?? "—";
                                const pic =
                                  st.profilePicture ??
                                  st.ProfilePictureBase64 ??
                                  null;
                                const isSelf =
                                  myAuthUserId != null &&
                                  rowUserId != null &&
                                  rowUserId === myAuthUserId;
                                const inTeam =
                                  dbId != null && teamMemberDbIds.has(dbId);
                                const pendingOut =
                                  dbId != null &&
                                  outgoingPendingReceiverDbIds.has(dbId);
                                const receiverUniversityId = (
                                  st.universityId ??
                                  st.UniversityId ??
                                  ""
                                ).trim();
                                const isSendingThisRow =
                                  ctSendingReceiverUniversityId != null &&
                                  receiverUniversityId !== "" &&
                                  ctSendingReceiverUniversityId ===
                                    receiverUniversityId;
                                const rowKey =
                                  dbId != null ? `cs-${dbId}` : `cs-i-${idx}`;
                                const initials = name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase();
                                return (
                                  <li
                                    key={rowKey}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      padding: "10px 12px",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: 10,
                                      background: "#fafafa",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        flexShrink: 0,
                                        background: "#e2e8f0",
                                      }}
                                    >
                                      {pic ? (
                                        <img
                                          src={pic}
                                          alt=""
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover" as const,
                                          }}
                                        />
                                      ) : (
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 12,
                                            fontWeight: 800,
                                            color: "#64748b",
                                          }}
                                        >
                                          {initials}
                                        </div>
                                      )}
                                    </div>
                                    <div
                                      style={{
                                        flex: 1,
                                        minWidth: 0,
                                      }}
                                    >
                                      <p
                                        style={{
                                          margin: 0,
                                          fontSize: 13,
                                          fontWeight: 700,
                                          color: "#0f172a",
                                        }}
                                      >
                                        {name}
                                      </p>
                                      <p
                                        style={{
                                          margin: "2px 0 0",
                                          fontSize: 12,
                                          color: "#64748b",
                                        }}
                                      >
                                        {uni}
                                      </p>
                                      <p
                                        style={{
                                          margin: "2px 0 0",
                                          fontSize: 12,
                                          color: "#64748b",
                                        }}
                                      >
                                        {maj}
                                        {year && year !== "—"
                                          ? ` · ${year}`
                                          : ""}
                                      </p>
                                    </div>
                                    <div
                                      style={{
                                        flexShrink: 0,
                                        minWidth: 112,
                                        display: "flex",
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      {isSelf ? (
                                        <span
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "#94a3b8",
                                          }}
                                        >
                                          You
                                        </span>
                                      ) : inTeam ? (
                                        <button
                                          type="button"
                                          disabled
                                          style={{
                                            padding: "6px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                            background: "#f1f5f9",
                                            color: "#94a3b8",
                                            cursor: "not-allowed",
                                            fontFamily: "inherit",
                                          }}
                                        >
                                          In Your Team
                                        </button>
                                      ) : pendingOut ? (
                                        <button
                                          type="button"
                                          disabled
                                          style={{
                                            padding: "6px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            border: "1px solid #fde68a",
                                            background: "#fffbeb",
                                            color: "#b45309",
                                            cursor: "not-allowed",
                                            fontFamily: "inherit",
                                          }}
                                        >
                                          Pending
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={
                                            receiverUniversityId === "" ||
                                            isSendingThisRow ||
                                            ctPartnerRequestBlockedNoSection
                                          }
                                          onClick={() => {
                                            if (
                                              receiverUniversityId === "" ||
                                              isSendingThisRow ||
                                              ctPartnerRequestBlockedNoSection
                                            )
                                              return;
                                            void handleCourseTeamsSendPartnerRequest(
                                              receiverUniversityId,
                                            );
                                          }}
                                          style={{
                                            padding: "6px 12px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            borderRadius: 8,
                                            fontFamily: "inherit",
                                            ...(receiverUniversityId !== "" &&
                                            !isSendingThisRow &&
                                            !ctPartnerRequestBlockedNoSection
                                              ? {
                                                  border: "none",
                                                  background:
                                                    "linear-gradient(135deg,#6366f1,#a855f7)",
                                                  color: "white",
                                                  boxShadow:
                                                    "0 2px 10px rgba(99,102,241,0.35)",
                                                  cursor: "pointer",
                                                  opacity: 1,
                                                }
                                              : {
                                                  border: "1.5px solid #e2e8f0",
                                                  background: "#f8fafc",
                                                  color: "#94a3b8",
                                                  cursor:
                                                    receiverUniversityId ===
                                                      "" ||
                                                    isSendingThisRow ||
                                                    ctPartnerRequestBlockedNoSection
                                                      ? "not-allowed"
                                                      : "pointer",
                                                  opacity:
                                                    receiverUniversityId === ""
                                                      ? 0.55
                                                      : isSendingThisRow
                                                        ? 0.75
                                                        : ctPartnerRequestBlockedNoSection
                                                          ? 0.75
                                                          : 0.85,
                                                }),
                                          }}
                                        >
                                          {isSendingThisRow
                                            ? "Sending..."
                                            : "Send Partner Request"}
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </section>
                        <section style={S.ctModalSection}>
                          <h4 style={S.ctModalH4}>Partner requests overview</h4>
                          <p style={S.ctModalH4Sub}>
                            Quick counts for the selected course — details are in
                            the sections above.
                          </p>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 12,
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Incoming
                              </p>
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 20,
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                              >
                                {incomingCt}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#64748b",
                                  fontWeight: 700,
                                }}
                              >
                                Outgoing
                              </p>
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 20,
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                              >
                                {outgoingCt}
                              </p>
                            </div>
                          </div>
                        </section>
                      </div>
                    );
                  })()}
              </main>
            </div>
          </div>
        </div>
      )}

      {/* ── BROWSE PROJECTS MODAL ── */}
      {projectsModalOpen && (
        <div style={S.modalOverlay} onClick={() => setProjectsModalOpen(false)}>
          <div
            style={{
              ...S.modalBox,
              width: 600,
              maxHeight: "85vh",
              overflowY: "auto" as const,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                📁 Browse Projects
              </h3>
              <button
                onClick={() => setProjectsModalOpen(false)}
                style={S.modalCloseBtn}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ ...S.aiBanner, marginBottom: 16 }}>
              <Sparkles size={15} color="#a855f7" />
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#4c1d95",
                  fontWeight: 600,
                }}
              >
                Showing projects matched to your skills — sorted by best fit
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column" as const,
                gap: 12,
              }}
            >
              {recommendedProjects.length === 0 ? (
                <div style={S.emptyState}>
                  <span style={{ fontSize: 32 }}>📁</span>
                  <p style={S.emptyTitle}>No projects available yet</p>
                  <p style={S.emptyDesc}>
                    Projects from your channels will appear here once published
                    by your doctor.
                  </p>
                </div>
              ) : (
                recommendedProjects.map((project) => {
                  const channelBody = (
                    project.abstract ??
                    project.description ??
                    ""
                  ).trim();
                  return (
                  <div
                    key={project.id}
                    style={{
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "#c7d2fe")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "#e2e8f0")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {project.title}
                        </p>
                        {channelBody ? (
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: 12,
                              color: "#64748b",
                              lineHeight: 1.5,
                            }}
                          >
                            {channelBody}
                          </p>
                        ) : null}
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap" as const,
                            marginBottom: 8,
                          }}
                        >
                          {project.dueDate && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                                fontWeight: 500,
                              }}
                            >
                              📅 Due{" "}
                              {new Date(project.dueDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          )}
                          {project.maxTeamSize != null && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                                fontWeight: 500,
                              }}
                            >
                              👥 Max {project.maxTeamSize} students
                            </span>
                          )}
                        </div>
                        {project.lookingFor.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap" as const,
                              gap: 4,
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                color: "#94a3b8",
                                fontWeight: 600,
                                marginRight: 2,
                              }}
                            >
                              Looking for:
                            </span>
                            {project.lookingFor.map((r: string) => (
                              <span
                                key={r}
                                style={{
                                  ...S.skillChipSm,
                                  background: "#faf5ff",
                                  color: "#a855f7",
                                  borderColor: "#e9d5ff",
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        style={{
                          padding: "6px 14px",
                          background: "linear-gradient(135deg,#6366f1,#a855f7)",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          whiteSpace: "nowrap" as const,
                        }}
                      >
                        View Project
                      </button>
                    </div>
                  </div>
                );
                })
              )}
            </div>
            <div style={{ marginTop: 20, textAlign: "center" as const }}>
              <button
                onClick={() => {
                  setProjectsModalOpen(false);
                  navigate("/projects");
                }}
                style={{
                  padding: "10px 28px",
                  background: "white",
                  border: "1.5px solid #c7d2fe",
                  borderRadius: 10,
                  color: "#6366f1",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                View All Projects →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GRADUATION PROJECT: CREATE / EDIT MODAL (abstract + projectType only; no description) ── */}
      {gradModalOpen && (
        <div
          style={S.modalOverlay}
          onClick={() => {
            setGradModalOpen(false);
            setGradFormError(null);
            setGradFormFieldErrors({});
            setGradSkillInputDraft("");
            setGradModalMode("create");
          }}
        >
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <style>{`
              .grad-modal-abstract {
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
              }
              .grad-modal-abstract:focus {
                outline: none;
                border-color: #a5b4fc !important;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
              }
              .grad-modal-submit:not(:disabled):hover {
                filter: brightness(1.06);
                box-shadow: 0 6px 20px rgba(99, 102, 241, 0.42);
              }
            `}</style>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                {gradModalMode === "edit"
                  ? "🎓 Edit Graduation Project"
                  : "🎓 Create Graduation Project"}
              </h3>
              <button
                onClick={() => {
                  setGradModalOpen(false);
                  setGradFormError(null);
                  setGradFormFieldErrors({});
                  setGradSkillInputDraft("");
                  setGradModalMode("create");
                }}
                style={S.modalCloseBtn}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 5,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                }}
              >
                Project Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                style={S.modalInput}
                placeholder="e.g. Smart Health Monitoring System"
                value={gradForm.name}
                onChange={(e) =>
                  setGradForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 5,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                }}
              >
                Abstract <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                className="grad-modal-abstract"
                rows={6}
                style={{
                  ...S.modalInput,
                  ...(gradFormFieldErrors.abstract
                    ? gradModalInputErrorStyle
                    : {}),
                  resize: "vertical" as const,
                  lineHeight: 1.55,
                  minHeight: 140,
                  padding: "14px 16px",
                  border: gradFormFieldErrors.abstract
                    ? undefined
                    : "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                placeholder="Brief summary of your project idea..."
                value={gradForm.abstract}
                onChange={(e) => {
                  setGradForm((p) => ({ ...p, abstract: e.target.value }));
                  setGradFormFieldErrors((prev) => {
                    if (!prev.abstract) return prev;
                    const next = { ...prev };
                    delete next.abstract;
                    return next;
                  });
                }}
              />
              {gradFormFieldErrors.abstract ? (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#ef4444",
                  }}
                >
                  {gradFormFieldErrors.abstract}
                </p>
              ) : null}
            </div>
            {isEngineeringOrITFaculty(user?.faculty) ? (
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "#64748b",
                    fontWeight: 700,
                    marginBottom: 8,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                  }}
                >
                  Project type <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap" as const,
                    gap: 10,
                  }}
                >
                  {(
                    [
                      { value: "GP1" as const, label: "GP1" },
                      { value: "GP2" as const, label: "GP2" },
                      { value: "GP" as const, label: "GP" },
                    ] as const
                  ).map((opt) => {
                    const checked = gradForm.projectType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          padding: "8px 14px",
                          borderRadius: 10,
                          border: checked
                            ? "1.5px solid #6366f1"
                            : "1.5px solid #e2e8f0",
                          background: checked ? "#eef2ff" : "#f8fafc",
                          fontSize: 13,
                          fontWeight: 600,
                          color: checked ? "#4338ca" : "#64748b",
                          fontFamily: "inherit",
                          userSelect: "none" as const,
                        }}
                      >
                        <input
                          type="radio"
                          name="grad-project-type"
                          checked={checked}
                          onChange={() =>
                            setGradForm((p) => ({
                              ...p,
                              projectType: opt.value,
                            }))
                          }
                          style={{
                            accentColor: "#6366f1",
                            width: 15,
                            height: 15,
                            margin: 0,
                            cursor: "pointer",
                          }}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 12,
                  color: "#94a3b8",
                  lineHeight: 1.45,
                }}
              >
                Project type: <strong style={{ color: "#64748b" }}>GP</strong>{" "}
                (required for your faculty; sent automatically)
              </p>
            )}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 5,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                }}
              >
                Required Skills <span style={{ color: "#ef4444" }}>*</span>{" "}
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                  Type a skill, press Enter
                </span>
              </label>
              <div
                style={{
                  ...S.modalInput,
                  ...(gradFormFieldErrors.skills ? gradModalInputErrorStyle : {}),
                  display: "flex",
                  flexWrap: "wrap" as const,
                  alignItems: "center",
                  gap: 8,
                  minHeight: 46,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "#f8fafc",
                }}
              >
                {gradForm.skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((skill, idx) => (
                    <span
                      key={`${skill}-${idx}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 8px 4px 10px",
                        borderRadius: 8,
                        background: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#4338ca",
                        maxWidth: "100%",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap" as const,
                          maxWidth: 200,
                        }}
                      >
                        {skill}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${skill}`}
                        onClick={() => {
                          const parts = gradForm.skills
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean);
                          parts.splice(idx, 1);
                          setGradForm((p) => ({
                            ...p,
                            skills: parts.join(", "),
                          }));
                          setGradFormFieldErrors((prev) => {
                            if (!prev.skills) return prev;
                            const next = { ...prev };
                            delete next.skills;
                            return next;
                          });
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 18,
                          height: 18,
                          padding: 0,
                          border: "none",
                          borderRadius: 6,
                          background: "rgba(99,102,241,0.12)",
                          color: "#4f46e5",
                          cursor: "pointer",
                          fontSize: 12,
                          lineHeight: 1,
                          fontFamily: "inherit",
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                <input
                  type="text"
                  placeholder="Add skill…"
                  value={gradSkillInputDraft}
                  onChange={(e) => setGradSkillInputDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = gradSkillInputDraft.trim();
                      if (!t) return;
                      const parts = gradForm.skills
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                      if (!parts.includes(t)) parts.push(t);
                      setGradForm((p) => ({
                        ...p,
                        skills: parts.join(", "),
                      }));
                      setGradSkillInputDraft("");
                      setGradFormFieldErrors((prev) => {
                        if (!prev.skills) return prev;
                        const next = { ...prev };
                        delete next.skills;
                        return next;
                      });
                    }
                  }}
                  style={{
                    flex: "1 1 120px",
                    minWidth: 100,
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    color: "#0f172a",
                    fontFamily: "inherit",
                    outline: "none",
                    padding: "4px 2px",
                  }}
                />
              </div>
              {gradFormFieldErrors.skills ? (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#ef4444",
                  }}
                >
                  {gradFormFieldErrors.skills}
                </p>
              ) : null}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 5,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                }}
              >
                Number of Partners <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap" as const,
                  alignItems: "center",
                }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setGradForm((p) => ({ ...p, teamSize: String(n) }))
                    }
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      border: "1.5px solid",
                      borderColor:
                        gradForm.teamSize === String(n) ? "#6366f1" : "#e2e8f0",
                      background:
                        gradForm.teamSize === String(n) ? "#eef2ff" : "#f8fafc",
                      color:
                        gradForm.teamSize === String(n) ? "#6366f1" : "#64748b",
                    }}
                  >
                    {n}
                  </button>
                ))}
                <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>
                  {gradForm.teamSize
                    ? `${gradForm.teamSize} partner${gradForm.teamSize === "1" ? "" : "s"}`
                    : "Select"}
                </span>
              </div>
            </div>
            {gradFormError && (
              <div
                style={{
                  padding: "9px 12px",
                  background: "#fff5f5",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#ef4444",
                  fontWeight: 500,
                  marginBottom: 14,
                }}
              >
                ❌ {gradFormError}
              </div>
            )}
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <button
                onClick={() => {
                  setGradModalOpen(false);
                  setGradFormError(null);
                  setGradFormFieldErrors({});
                  setGradSkillInputDraft("");
                  setGradModalMode("create");
                }}
                style={S.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleGradSubmit}
                disabled={gradSubmitting}
                className="grad-modal-submit"
                style={{
                  padding: "10px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: gradSubmitting
                    ? "#e2e8f0"
                    : "linear-gradient(135deg,#6366f1,#a855f7)",
                  color: gradSubmitting ? "#94a3b8" : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: gradSubmitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: gradSubmitting
                    ? "none"
                    : "0 4px 14px rgba(99, 102, 241, 0.35)",
                  transition: "filter 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                {gradSubmitting
                  ? gradModalMode === "edit"
                    ? "⏳ Saving..."
                    : "⏳ Creating..."
                  : gradModalMode === "edit"
                    ? "Save changes"
                    : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD TEAMMATES MODAL ── */}
      {addTeammatesOpen && (
        <div style={S.modalOverlay} onClick={() => setAddTeammatesOpen(false)}>
          <div
            style={{ ...S.modalBox, width: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                👥 Find Teammates
              </h3>
              <button
                onClick={() => setAddTeammatesOpen(false)}
                style={S.modalCloseBtn}
              >
                <X size={15} />
              </button>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                margin: "0 0 16px",
                lineHeight: 1.6,
              }}
            >
              Browse students, check their profiles and skills, then share your
              project link so they can join directly.
            </p>

            {/* AI Suggestions */}
            {teammates.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                    margin: "0 0 8px",
                  }}
                >
                  AI Suggested ({teammates.length})
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column" as const,
                    gap: 8,
                    maxHeight: 260,
                    overflowY: "auto" as const,
                  }}
                >
                  {teammates.slice(0, 5).map((t) => (
                    <div
                      key={t.userId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#6366f1,#a855f7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {t.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                            margin: "0 0 2px",
                          }}
                        >
                          <ProfileLink userId={t.userId} role="student" style={{ color: "#0f172a" }}>
                            {t.name}
                          </ProfileLink>
                        </div>
                        <p
                          style={{ fontSize: 11, color: "#64748b", margin: 0 }}
                        >
                          {t.major}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#16a34a",
                          }}
                        >
                          {t.matchScore}%
                        </span>
                        <button
                          onClick={() => {
                            const href = getProfileUrl({ role: "student", userId: t.userId });
                            navigate(href ?? "/students");
                            setAddTeammatesOpen(false);
                          }}
                          style={{
                            padding: "4px 10px",
                            background: "linear-gradient(135deg,#6366f1,#a855f7)",
                            border: "none",
                            borderRadius: 7,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "white",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setAddTeammatesOpen(false)}
                style={S.modalCancelBtn}
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Pass projectId so StudentsPage knows which project to link against
                  const dest = gradProject
                    ? `/students?projectId=${gradProject?.id ?? ""}`
                    : "/students";
                  navigate(dest);
                  setAddTeammatesOpen(false);
                }}
                style={{
                  padding: "9px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#a855f7)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Browse All Students →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input:focus, textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        button:hover { opacity: 0.9; }
        a { text-decoration: none; }
      `}</style>
    </div>
  );
}

// ─── TeamMemberRow ────────────────────────────────────────────────────────────
// Renders a single team member as a clean horizontal row.
//
// canManageTeam — when true, non-leader rows show Remove + Make Leader buttons.
// isSelf        — true when this row belongs to the currently logged-in user.
//                 Hides the Remove button on their own row regardless of role.
// isRemoving    — disables Remove and fades the row while DELETE is in flight.
// onRemove      — called on Remove click; handler lives in DashboardPage.
// isPromoting   — disables Make Leader while PUT is in flight for this member.
// onMakeLeader  — called on Make Leader click; handler lives in DashboardPage.
//
// Leader rows never show action buttons regardless of canManageTeam.
interface TeamMemberRowProps {
  member: GradProjectMember;
  canManageTeam: boolean;
  isSelf: boolean;
  isRemoving: boolean;
  onRemove: () => void;
  isPromoting: boolean;
  onMakeLeader: () => void;
}
function TeamMemberRow({
  member: m,
  canManageTeam,
  isSelf,
  isRemoving,
  onRemove,
  isPromoting,
  onMakeLeader,
}: TeamMemberRowProps) {
  const isLeader = m.role === "leader";
  // Actions area is shown only when the manager can act AND the row is not the
  // leader row. Individual buttons may still be hidden (e.g. Remove for self).
  const showActions = canManageTeam && !isLeader;
  const canRemove = showActions && !isSelf;
  const isBusy = isRemoving || isPromoting;
  const initials = m.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        ...S.memberRow,
        ...(isLeader ? S.memberRowLeader : S.memberRowMember),
        opacity: isBusy ? 0.5 : 1,
      }}
    >
      {/* Left: avatar + text */}
      <div style={S.memberLeft}>
        {/* Avatar */}
        <div
          style={{
            ...S.memberAvatarWrap,
            boxShadow: isLeader ? "0 0 0 2px #a5b4fc" : "none",
          }}
        >
          {m.profilePicture ? (
            <img
              src={m.profilePicture}
              alt={m.name}
              style={S.memberAvatarImg}
            />
          ) : (
            <div
              style={
                isLeader
                  ? S.memberAvatarFallbackLeader
                  : S.memberAvatarFallbackMember
              }
            >
              {initials}
            </div>
          )}
        </div>

        {/* Name + sub-line */}
        <div style={S.memberText}>
          <div style={S.memberNameRow}>
            <span style={S.memberName}>{m.name}</span>
            <span style={isLeader ? S.memberBadgeLeader : S.memberBadgeMember}>
              {isLeader ? "👑 Leader" : "Member"}
            </span>
            {isSelf && <span style={S.memberBadgeSelf}>You</span>}
          </div>
          <span style={S.memberSub}>{m.major || m.university || "—"}</span>
        </div>
      </div>

      {/* Right: actions — only for non-leader rows when canManageTeam */}
      {showActions && (
        <div style={S.memberActions}>
          {canRemove && (
            <button
              onClick={onRemove}
              disabled={isBusy}
              style={{
                ...S.memberBtnRemove,
                cursor: isBusy ? "not-allowed" : "pointer",
                opacity: isBusy ? 0.5 : 1,
                padding: "4px 5px", // 👈 أصغر
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isRemoving ? "…" : "🗑"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Background decoration ────────────────────────────────────────────────────
function BgDecor() {
  return (
    <>
      <div
        style={{
          position: "fixed" as const,
          top: -150,
          right: -150,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)",
          pointerEvents: "none" as const,
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed" as const,
          bottom: -120,
          left: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)",
          pointerEvents: "none" as const,
          zIndex: 0,
        }}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)",
    fontFamily: "DM Sans, sans-serif",
    color: "#0f172a",
    position: "relative",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(248,247,255,0.88)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(99,102,241,0.1)",
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    height: 62,
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  navLogo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    marginRight: 8,
    flexShrink: 0,
  },
  logoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    fontFamily: "Syne, sans-serif",
  },
  logoAccent: {
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  searchWrap: { flex: 1, maxWidth: 420, position: "relative" },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "9px 14px 9px 36px",
    background: "white",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    color: "#0f172a",
    fontSize: 13,
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  searchDropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
    zIndex: 260,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 320,
    overflowY: "auto",
  },
  searchGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  searchGroupTitle: {
    margin: "2px 4px",
    fontSize: 11,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  searchResultBtn: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    background: "#fff",
    padding: "8px 10px",
    textAlign: "left",
    fontFamily: "inherit",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  },
  searchResultMeta: {
    fontSize: 11,
    color: "#64748b",
  },
  searchItemMuted: {
    fontSize: 12,
    color: "#94a3b8",
    padding: "2px 6px",
  },
  searchStateRow: {
    textAlign: "center",
    fontSize: 12,
    color: "#64748b",
    padding: "10px 8px",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  navBtn: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    borderRadius: 8,
    position: "relative",
    textDecoration: "none",
  },
  navBtnActive: {
    background: "#eef2ff",
    color: "#4f46e5",
    border: "1px solid #c7d2fe",
  },
  navAvatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    overflow: "hidden",
    cursor: "pointer",
    marginLeft: 4,
    textDecoration: "none",
    flexShrink: 0,
  },
  navAvatarFallback: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#fff",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "28px 24px 60px",
    position: "relative",
    zIndex: 1,
  },
  hero: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 24,
    padding: "24px 28px",
    background: "white",
    border: "1px solid rgba(99,102,241,0.12)",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(99,102,241,0.06)",
  },
  heroLeft: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
  },
  greetingText: {
    fontSize: 13,
    color: "#94a3b8",
    margin: "0 0 4px",
    fontWeight: 500,
  },
  heroName: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
    fontFamily: "Syne, sans-serif",
    display: "block",
    lineHeight: 1.2,
  },
  heroNameAccent: {
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    display: "inline",
  },
  heroSub: {
    fontSize: 13,
    color: "#64748b",
    margin: "0 0 12px",
    display: "block",
  },
  heroSkills: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  skillChip: {
    padding: "4px 12px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: 20,
    fontSize: 11,
    color: "#6366f1",
    fontWeight: 600,
  },
  heroBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  heroStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    flexShrink: 0,
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#6366f1",
  },
  statValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 2px",
    fontFamily: "Syne, sans-serif",
  },
  statLabel: { fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 500 },
  aiBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background:
      "linear-gradient(135deg,rgba(168,85,247,0.08),rgba(99,102,241,0.08))",
    border: "1px solid rgba(168,85,247,0.2)",
    borderRadius: 12,
    marginBottom: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 30%) minmax(0, 70%)",
    gap: 22,
    alignItems: "start",
  },
  gridNarrow: {
    gridTemplateColumns: "1fr",
    gap: 22,
  },
  leftCol: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 22,
    minWidth: 0,
  },
  leftColNarrow: { order: 2 },
  rightCol: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 22,
    minWidth: 0,
  },
  rightColNarrow: { order: 1 },
  /** My Graduation Project + Course Teams — equal-width row; stacks on narrow viewports */
  rightColTopRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 22,
  },
  rightColTopCard: {
    minWidth: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    boxSizing: "border-box" as const,
    padding: "24px",
  },
  ctDashCourseTeamsCard: {
    borderTop: "3px solid transparent",
    backgroundImage:
      "linear-gradient(white, white), linear-gradient(135deg,#6366f1,#a855f7)",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
  },
  ctDashStatPill: {
    padding: "10px 12px",
    background: "#f8fafc",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    minWidth: 0,
  },
  ctDashStatLabel: {
    margin: 0,
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  ctDashStatValue: {
    margin: "6px 0 0",
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    fontFamily: "Syne, sans-serif",
    lineHeight: 1.1,
  },
  ctDashStatHint: {
    margin: "4px 0 0",
    fontSize: 9,
    fontWeight: 500,
    color: "#cbd5e1",
  },
  ctModalStack: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  ctModalSection: {
    padding: 18,
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#fff",
  },
  ctModalSectionMuted: {
    padding: 18,
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#fafafa",
  },
  ctModalH4: {
    margin: "0 0 6px",
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
    fontFamily: "Syne, sans-serif",
    letterSpacing: "-0.02em",
  },
  ctModalH4Sub: {
    margin: "0 0 14px",
    paddingBottom: 12,
    borderBottom: "1px solid #f1f5f9",
    fontSize: 11,
    fontWeight: 500,
    color: "#94a3b8",
    lineHeight: 1.45,
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "18px",
    boxShadow: "0 2px 12px rgba(99,102,241,0.04)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 6,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  cardAction: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    fontSize: 12,
    color: "#6366f1",
    fontWeight: 600,
    textDecoration: "none",
  },
  cardActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    fontSize: 12,
    color: "#6366f1",
    fontWeight: 600,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
  progressRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    background: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg,#6366f1,#a855f7)",
    borderRadius: 3,
    transition: "width 0.6s ease",
  },
  progressPct: {
    fontSize: 15,
    fontWeight: 800,
    color: "#6366f1",
    minWidth: 36,
  },
  progressLabel: { fontSize: 12, color: "#94a3b8", margin: "0 0 12px" },
  skillChipSm: {
    padding: "3px 8px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: 20,
    fontSize: 10,
    color: "#6366f1",
    fontWeight: 600,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
    gap: 8,
    textAlign: "center",
  },
  emptyTitle: { fontSize: 14, fontWeight: 700, color: "#475569", margin: 0 },
  emptyDesc: {
    fontSize: 12,
    color: "#94a3b8",
    margin: 0,
    maxWidth: 260,
    lineHeight: 1.6,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
    backdropFilter: "blur(4px)",
  },
  modalBox: {
    background: "white",
    borderRadius: 20,
    padding: "28px",
    width: 440,
    maxWidth: "90vw",
    boxShadow: "0 24px 64px rgba(99,102,241,0.18)",
  },
  modalInput: {
    width: "100%",
    padding: "10px 13px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 13,
    color: "#0f172a",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#f8fafc",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b",
  },
  modalCancelBtn: {
    padding: "9px 22px",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  // ── Team member row ───────────────────────────────────────────────────────
  memberRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "9px 11px",
    borderRadius: 10,
    boxSizing: "border-box" as const,
    transition: "opacity 0.2s",
  },
  memberRowLeader: {
    background: "#eef2ff",
    border: "1px solid rgba(99,102,241,0.25)",
  },
  memberRowMember: { background: "#f8fafc", border: "1px solid #e2e8f0" },
  memberLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  memberAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
  },
  memberAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  memberAvatarFallbackLeader: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 800,
    color: "white",
  },
  memberAvatarFallbackMember: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg,#a855f7,#ec4899)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 800,
    color: "white",
  },
  memberText: { flex: 1, minWidth: 0, overflow: "hidden" },
  memberNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginBottom: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  memberBadgeLeader: {
    flexShrink: 0,
    fontSize: 9,
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 20,
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    color: "white",
  },
  memberBadgeMember: {
    flexShrink: 0,
    fontSize: 9,
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 20,
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
  },
  memberBadgeSelf: {
    flexShrink: 0,
    fontSize: 9,
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 20,
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },
  memberSub: {
    fontSize: 11,
    color: "#94a3b8",
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  memberActions: {
    display: "flex",
    gap: 4,
    flexShrink: 0,
    alignItems: "center",
    marginLeft: "auto", // 🔥 هذا أهم تعديل
  },
  memberBtnRemove: {
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 6,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#ef4444",
    fontFamily: "inherit",
  },
  memberBtnLeader: {
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 6,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    color: "#6366f1",
    fontFamily: "inherit",
  },
};
