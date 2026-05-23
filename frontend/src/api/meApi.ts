import api from "./axiosInstance";

export type StudentMeResponse = {
  role: string;
  userId: number;
  profileId: number;
  name: string;
  email: string;
  studentId?: string;
  university?: string;
  faculty?: string;
  major?: string;
  academicYear?: string;
  gpa?: number | null;
  bio?: string | null;
  availability?: string | null;
  lookingFor?: string | null;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  profilePictureBase64?: string | null;
  languages?: string[];
  roles?: string[];
  technicalSkills?: string[];
  tools?: string[];
  generalSkills?: string[];
  majorSkills?: string[];
};

export async function getMe(): Promise<StudentMeResponse> {
  const { data } = await api.get<StudentMeResponse>("/me");
  return data;
}
