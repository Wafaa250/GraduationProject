import api from "./axiosInstance";

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

export async function getTeamInvitations(): Promise<TeamInvitationItem[]> {
  const { data } = await api.get<unknown>("/courses/team-invitations");
  return parseTeamInvitationsResponse(data);
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
    });
  }

  return out;
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
