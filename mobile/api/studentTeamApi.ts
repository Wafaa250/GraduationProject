import api from "./axiosInstance";

/** Row from GET /api/courses/projects/{projectId}/my-team (matches web StudentTeamPage). */
export type CourseTeamMemberDto = {
  studentId: number;
  userId: number;
  name: string;
  universityId: string;
  matchScore: number;
};

/** Response from GET /api/courses/projects/{projectId}/my-team. */
export type MyCourseTeamResponse = {
  projectId: number;
  projectTitle: string;
  courseId: number;
  teamId: number;
  teamIndex: number;
  members: CourseTeamMemberDto[];
};

/** Message from GET/POST /api/teams/{teamId}/chat. */
export type TeamChatMessageDto = {
  id: number;
  teamId: number;
  senderUserId: number;
  senderName: string;
  text: string;
  sentAt: string;
};

/**
 * GET /api/courses/projects/{projectId}/my-team
 * Current student's team for a course-linked project.
 */
export async function fetchMyCourseTeam(projectId: number): Promise<MyCourseTeamResponse> {
  const { data } = await api.get<MyCourseTeamResponse>(`/courses/projects/${projectId}/my-team`);
  return data;
}

/**
 * GET /api/teams/{teamId}/chat?limit={limit}
 */
export async function fetchTeamChatMessages(
  teamId: number,
  limit = 100,
): Promise<TeamChatMessageDto[]> {
  const { data } = await api.get<TeamChatMessageDto[]>(`/teams/${teamId}/chat`, {
    params: { limit },
  });
  return Array.isArray(data) ? data : [];
}

/**
 * POST /api/teams/{teamId}/chat — body `{ text: string }`.
 */
export async function postTeamChatMessage(teamId: number, text: string): Promise<TeamChatMessageDto> {
  const { data } = await api.post<TeamChatMessageDto>(`/teams/${teamId}/chat`, { text });
  return data;
}

/** Parse current account user id from GET /api/me (same fields as web StudentTeamPage). */
export function parseMeUserId(me: unknown): number | null {
  if (me == null || typeof me !== "object") return null;
  const o = me as Record<string, unknown>;
  const raw = o.id ?? o.Id ?? o.userId ?? o.UserId;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/**
 * GET /api/me — used only to resolve `senderUserId === me` for chat bubbles.
 */
export async function fetchMeForTeamChat(): Promise<unknown> {
  const { data } = await api.get<unknown>("/me");
  return data;
}
