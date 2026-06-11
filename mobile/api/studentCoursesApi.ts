import api from "@/api/axiosInstance";
import type { GraduationNotification } from "@/api/notificationsApi";
import { filterEligibleCourseProjects } from "@/lib/courseProjectEligibility";

export type EnrolledCourse = {
  courseId: number;
  name: string;
  code: string;
  semester?: string | null;
  doctorId: number;
  doctorName: string;
  section: {
    sectionId: number;
    sectionName: string;
  };
};

export type StudentCourseSection = {
  id: number;
  name: string;
  courseId: number;
  days: string[];
  timeFrom?: string | null;
  timeTo?: string | null;
  capacity?: number;
};

export type StudentCourseDetail = {
  courseId: number;
  name: string;
  code: string;
  semester?: string | null;
  createdAt?: string;
  doctorId: number;
  doctorName: string;
  mySectionId: number;
  mySectionName: string;
  sections: StudentCourseSection[];
};

export type CourseEnrollmentStudent = {
  studentId: number;
  name?: string | null;
  universityId?: string | null;
  university?: string | null;
  major?: string | null;
  email?: string | null;
  enrolledAt?: string;
  sectionId?: number | null;
  userId?: number | null;
  skills: string[];
};

export type CourseMyTeamMember = {
  studentId: number;
  userId: number;
  name: string;
  universityId?: string;
  matchScore?: number;
  skills?: string[];
};

export type CourseMyTeamResponse = {
  projectId: number;
  projectTitle: string;
  courseId: number;
  teamId: number;
  teamIndex: number;
  members: CourseMyTeamMember[];
};

export type ManualTeamStudent = {
  id: number;
  name: string;
  email: string;
  skills: string[];
  sectionName: string;
  avatar?: string | null;
  bio?: string | null;
  hasPendingRequest: boolean;
  isAlreadyInTeam: boolean;
  availabilityStatus: string;
  availabilityReason: string;
};

export type ManualTeamStudentsResponse = {
  projectId: number;
  projectTitle: string;
  teamSize: number;
  students: ManualTeamStudent[];
};

export type AiTeamRecommendation = {
  studentId: number;
  name: string;
  email: string;
  avatar?: string | null;
  sectionName: string;
  skills: string[];
  bio?: string | null;
  major?: string;
  matchScore: number;
  matchReason: string;
  hasPendingRequest: boolean;
  isAlreadyInTeam: boolean;
  availabilityStatus?: string;
  availabilityReason?: string;
};

export type StudentCourseProjectSection = {
  sectionId: number;
  sectionName?: string;
};

export type StudentCourseProject = {
  id: number;
  courseId: number;
  title: string;
  description?: string | null;
  teamSize: number;
  applyToAllSections?: boolean;
  allowCrossSectionTeams?: boolean;
  aiMode?: string | null;
  createdAt?: string;
  sections?: StudentCourseProjectSection[];
  hasTeam?: boolean;
};

export type TeamInvitationItem = {
  invitationId: number;
  projectId: number;
  projectTitle: string;
  courseId: number;
  courseName: string;
  senderId: number;
  senderName: string;
  senderSection: string;
  senderSkills?: string[];
  message?: string;
  invitedAt: string;
};

export async function getEnrolledCourses(): Promise<EnrolledCourse[]> {
  const { data } = await api.get<EnrolledCourse[]>("/courses/enrolled");
  return Array.isArray(data) ? data : [];
}

export async function getStudentCourseDetail(courseId: number): Promise<StudentCourseDetail> {
  const { data } = await api.get<StudentCourseDetail>(`/courses/${courseId}`);
  return {
    ...data,
    sections: Array.isArray(data.sections) ? data.sections : [],
  };
}

export async function getCourseEnrollmentStudents(
  courseId: number,
): Promise<CourseEnrollmentStudent[]> {
  const { data } = await api.get<CourseEnrollmentStudent[]>(`/courses/${courseId}/students`);
  return Array.isArray(data) ? data : [];
}

export async function getCourseProjectMyTeam(
  projectId: number,
): Promise<CourseMyTeamResponse | null> {
  try {
    const { data } = await api.get<CourseMyTeamResponse>(`/courses/projects/${projectId}/my-team`);
    return data;
  } catch (err: unknown) {
    if (isAxiosNotFound(err)) return null;
    throw err;
  }
}

export async function getManualTeamStudents(
  courseId: number,
  projectId: number,
): Promise<ManualTeamStudentsResponse> {
  const { data } = await api.get<ManualTeamStudentsResponse>(
    `/courses/${courseId}/projects/${projectId}/manual-team/students`,
  );
  return data;
}

export async function sendManualTeamRequest(
  courseId: number,
  projectId: number,
  receiverId: number,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    `/courses/${courseId}/projects/${projectId}/manual-team/requests/${receiverId}`,
  );
  return data;
}

export async function getAiTeamRecommendations(
  courseId: number,
  projectId: number,
): Promise<AiTeamRecommendation[]> {
  const { data } = await api.get<AiTeamRecommendation[]>(
    `/courses/${courseId}/projects/${projectId}/ai-team-recommendations`,
  );
  return Array.isArray(data) ? data : [];
}

export async function getStudentCourseProjects(
  courseId: number,
): Promise<StudentCourseProject[]> {
  const { data } = await api.get<StudentCourseProject[]>(`/courses/${courseId}/projects`);
  return Array.isArray(data) ? data : [];
}

export async function getEligibleStudentCourseProjects(
  courseId: number,
  mySectionId: number,
): Promise<StudentCourseProject[]> {
  const projects = await getStudentCourseProjects(courseId);
  return filterEligibleCourseProjects(projects, mySectionId);
}

export async function getTeamInvitations(): Promise<TeamInvitationItem[]> {
  const { data } = await api.get<unknown>("/courses/team-invitations");
  return parseTeamInvitationsResponse(data);
}

export async function getEligibleTeamInvitations(): Promise<TeamInvitationItem[]> {
  const invites = await getTeamInvitations();
  if (invites.length === 0) return [];

  const courseIds = [...new Set(invites.map((i) => i.courseId))];
  const eligibleProjectIdsByCourse = new Map<number, Set<number>>();

  await Promise.all(
    courseIds.map(async (courseId) => {
      try {
        const detail = await getStudentCourseDetail(courseId);
        const projects = await getEligibleStudentCourseProjects(courseId, detail.mySectionId);
        eligibleProjectIdsByCourse.set(courseId, new Set(projects.map((p) => p.id)));
      } catch {
        eligibleProjectIdsByCourse.set(courseId, new Set());
      }
    }),
  );

  return invites.filter((inv) =>
    eligibleProjectIdsByCourse.get(inv.courseId)?.has(inv.projectId),
  );
}

export async function acceptTeamInvitation(invitationId: number): Promise<void> {
  await api.post(`/courses/team-invitations/${invitationId}/accept`);
}

export async function rejectTeamInvitation(invitationId: number): Promise<void> {
  await api.post(`/courses/team-invitations/${invitationId}/reject`);
}

const INVITATION_EVENT_PREFIX = "course_teammate_invitation_";
const ANNOUNCEMENT_EVENT_TYPES = new Set([
  "course_project_created",
  "course_project_updated",
  "course_project_deleted",
  "course_teams_generated",
  "course_team_member_added",
  "course_team_member_removed",
]);

export async function getStudentCourseAnnouncements(
  courseProjectIds: number[],
  doctorName?: string,
): Promise<
  {
    id: number;
    title: string;
    message: string;
    doctor: string;
    date: string;
    createdAt: string;
    projectId: number | null;
    eventType: string;
  }[]
> {
  let rows: GraduationNotification[] = [];
  try {
    const { data } = await api.get<GraduationNotification[]>("/notifications", {
      params: { take: 100, category: "course" },
    });
    rows = Array.isArray(data) ? data : [];
  } catch {
    rows = [];
  }

  const projectIdSet = new Set(courseProjectIds);
  const courseRows = rows.filter((n) => {
    if (n.category !== "course") return false;
    if (n.eventType.startsWith(INVITATION_EVENT_PREFIX)) return false;
    if (!ANNOUNCEMENT_EVENT_TYPES.has(n.eventType)) return false;
    if (n.projectId == null) return true;
    return projectIdSet.has(n.projectId);
  });

  return courseRows
    .map((n) => ({
      id: n.id,
      title: n.title,
      message: n.body,
      doctor: doctorName?.trim() || "Instructor",
      date: formatAnnouncementDate(n.createdAt),
      createdAt: n.createdAt,
      projectId: n.projectId,
      eventType: n.eventType,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function formatAnnouncementDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isAxiosNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  );
}

function parseTeamInvitationsResponse(data: unknown): TeamInvitationItem[] {
  const rows = Array.isArray(data) ? data : [];
  const out: TeamInvitationItem[] = [];

  for (const raw of rows) {
    if (raw === null || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;

    const invitationId = num(o.invitationId, o.InvitationId, o.id, o.Id);
    const projectId = num(o.projectId, o.ProjectId);
    const courseId = num(o.courseId, o.CourseId);
    const senderId = num(o.senderId, o.SenderId);

    if (
      invitationId === null ||
      projectId === null ||
      courseId === null ||
      senderId === null
    ) {
      continue;
    }

    const senderSkills = [
      ...parseStringArray(o.senderSkills),
      ...parseStringArray(o.SenderSkills),
    ];

    out.push({
      invitationId,
      projectId,
      projectTitle: str(o.projectTitle, o.ProjectTitle) || "—",
      courseId,
      courseName: str(o.courseName, o.CourseName) || "—",
      senderId,
      senderName: str(o.senderName, o.SenderName) || "—",
      senderSection: str(o.senderSection, o.SenderSection) || "—",
      invitedAt: str(o.invitedAt, o.InvitedAt, o.createdAt, o.CreatedAt) || "",
      message: str(o.message, o.Message, o.body, o.Body) || undefined,
      senderSkills: senderSkills.length > 0 ? [...new Set(senderSkills)] : undefined,
    });
  }

  return out;
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim());
}

function str(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return "";
}

function num(...vals: unknown[]): number | null {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}
