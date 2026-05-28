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

export type DoctorMeResponse = {
  role: string;
  userId: number;
  profileId: number;
  user: {
    userId: number;
    name: string;
    email: string;
    profilePictureBase64: string | null;
    role: string;
  };
  doctorProfile: {
    profileId: number;
    department: string;
    faculty: string;
    specialization: string;
    university: string;
    academicRank: string | null;
    yearsOfExperience: number | null;
    linkedin: string | null;
    officeHours: string | null;
    office: string | null;
    phone: string | null;
    bio: string | null;
    profilePictureBase64: string | null;
    technicalSkills: string[];
    researchSkills: string[];
  };
};

export async function getMe(): Promise<StudentMeResponse> {
  const { data } = await api.get<StudentMeResponse>("/me");
  return data;
}

export async function getDoctorMe(): Promise<DoctorMeResponse> {
  const { data } = await api.get<DoctorMeResponse>("/me");
  return data;
}
