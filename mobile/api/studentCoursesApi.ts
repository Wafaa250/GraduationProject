import api from "@/api/axiosInstance";
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

export type StudentCourseDetail = {
  courseId: number;
  name: string;
  code: string;
  semester?: string | null;
  doctorId: number;
  doctorName: string;
  mySectionId: number;
  mySectionName: string;
};

export type StudentCourseProjectSection = {
  sectionId: number;
  sectionName?: string;
};

export type StudentCourseProject = {
  id: number;
  courseId: number;
  title: string;
  applyToAllSections?: boolean;
  sections?: StudentCourseProjectSection[];
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
  return data;
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
