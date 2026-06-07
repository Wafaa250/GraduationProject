import api from "./axiosInstance";

export type CourseTeamConversationResponse = {
  conversationId: number;
  title: string;
  participantCount: number;
};

export async function getOrCreateCourseTeamConversation(
  teamId: number,
): Promise<CourseTeamConversationResponse> {
  const { data } = await api.post<Record<string, unknown>>(`/course-teams/${teamId}/conversation`);
  return {
    conversationId: Number(data?.conversationId ?? data?.ConversationId ?? 0),
    title: String(data?.title ?? data?.Title ?? ""),
    participantCount: Number(data?.participantCount ?? data?.ParticipantCount ?? 0),
  };
}
