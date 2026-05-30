import api from "./axiosInstance";

export type CourseTeamConversationResponse = {
  conversationId: number;
  title: string;
  participantCount: number;
};

/** POST /api/course-teams/{teamId}/conversation — get or create the team group chat. */
export async function getOrCreateCourseTeamConversation(
  teamId: number,
): Promise<CourseTeamConversationResponse> {
  const { data } = await api.post<CourseTeamConversationResponse>(
    `/course-teams/${teamId}/conversation`,
  );
  return data;
}
