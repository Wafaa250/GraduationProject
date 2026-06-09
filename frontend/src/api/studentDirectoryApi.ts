import api from "./axiosInstance";

export type StudentDirectoryProfile = {
  userId: number;
  profileId: number;
  name: string;
  email: string;
  studentId: string;
  university: string;
  faculty: string;
  major: string;
  academicYear: string;
  gpa: number | null;
  bio: string;
  availability: string;
  lookingFor: string;
  github: string;
  linkedin: string;
  portfolio: string;
  profilePictureBase64: string | null;
  languages: string[];
  roles: string[];
  technicalSkills: string[];
  tools: string[];
};

export type StudentDirectoryListItem = {
  userId: number;
  profileId: number;
  name: string;
  email?: string;
  university?: string;
  major?: string;
  academicYear?: string;
  matchScore?: number;
  profilePictureBase64?: string | null;
};

/** GET /api/students — browse/search students. */
export async function listStudents(params?: {
  search?: string;
  skill?: string;
  university?: string;
  major?: string;
  availableOnly?: boolean;
}): Promise<StudentDirectoryListItem[]> {
  const { data } = await api.get<StudentDirectoryListItem[]>("/students", { params });
  return Array.isArray(data) ? data : [];
}

/** GET /api/students/{userId} — doctors may view supervised students */
export async function getStudentDirectoryProfile(userId: number): Promise<StudentDirectoryProfile> {
  const { data } = await api.get<StudentDirectoryProfile>(`/students/${userId}`);
  return data;
}
