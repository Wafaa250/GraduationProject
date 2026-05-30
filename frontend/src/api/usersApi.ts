import api from "./axiosInstance";

export type UserSearchResult = {
  id: number;
  fullName: string;
  role: string;
  major: string;
  profilePictureUrl: string | null;
};

/** GET /api/users/search?q= */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data } = await api.get<UserSearchResult[]>("/users/search", { params: { q } });
  return Array.isArray(data) ? data : [];
}
