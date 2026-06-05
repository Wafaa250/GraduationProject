import api from "./axiosInstance";
import type { AuthLoginRequest, AuthLoginResponse } from "@/types/auth";

export interface RegisterStudentPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePictureBase64: string | null;
  studentId: string;
  university: string;
  faculty: string;
  major: string;
  academicYear: string;
  gpa: number | null;
  roles: string[];
  technicalSkills: string[];
  tools: string[];
  generalSkills: string[];
  majorSkills: string[];
}

export async function login(payload: AuthLoginRequest): Promise<AuthLoginResponse> {
  const { data } = await api.post<AuthLoginResponse>("/auth/login", payload);
  return data;
}

export async function registerStudent(payload: RegisterStudentPayload): Promise<AuthLoginResponse> {
  const { data } = await api.post<AuthLoginResponse>("/auth/register/student", payload);
  return data;
}

export interface RegisterDoctorPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  university: string;
  faculty: string;
  department: string;
  specialization: string;
  bio: string;
  profilePictureBase64: string | null;
  role: "doctor";
}

export async function registerDoctor(payload: RegisterDoctorPayload): Promise<AuthLoginResponse> {
  const { data } = await api.post<AuthLoginResponse>("/auth/register/doctor", payload);
  return data;
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function changePassword(payload: ChangePasswordPayload): Promise<AuthLoginResponse> {
  const { data } = await api.post<AuthLoginResponse>("/auth/change-password", payload);
  return data;
}
