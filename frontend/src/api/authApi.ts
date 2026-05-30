import api from "./axiosInstance";

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

export const registerStudent = async (data: RegisterStudentPayload) => {
  const response = await api.post("/auth/register/student", data);
  return response.data;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};

export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
  const { data } = await api.post<{ message?: string; Message?: string }>(
    "/auth/change-password",
    {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      confirmNewPassword: payload.confirmNewPassword,
    },
  );
  return data.message ?? data.Message ?? "Your password has been updated.";
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<string> {
  const { data } = await api.post<{ message?: string; Message?: string }>(
    "/auth/forgot-password",
    payload,
  );
  return (
    data.message ??
    data.Message ??
    "If an account exists for that email, you will receive password reset instructions shortly."
  );
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<string> {
  const { data } = await api.post<{ message?: string; Message?: string }>(
    "/auth/reset-password",
    payload,
  );
  return (
    data.message ??
    data.Message ??
    "Your password has been reset successfully. You can sign in with your new password."
  );
}
