import api from "@/api/axiosInstance";

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
  profilePictureBase64?: string | null;
  graduationProjectCourses?: string[];
};

export async function getMe(): Promise<StudentMeResponse> {
  const { data } = await api.get<StudentMeResponse>("/me");
  return data;
}
