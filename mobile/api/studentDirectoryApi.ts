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

export async function getStudentDirectoryProfile(userId: number): Promise<StudentDirectoryProfile> {
  const { data } = await api.get<StudentDirectoryProfile>(`/students/${userId}`);
  return data;
}
