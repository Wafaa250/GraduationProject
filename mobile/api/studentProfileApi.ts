import api from "./axiosInstance";
import type { ProfileStrength } from "@/api/dashboardApi";
import type { GradProject } from "@/api/gradProjectApi";

export type OrganizationMembership = {
  organizationMemberId: number;
  organizationId: number;
  organizationName: string;
  organizationLogoUrl?: string | null;
  roleTitle: string;
  membershipKind: string;
  joinedAt: string;
};

export async function getProfileStrength(): Promise<ProfileStrength> {
  const { data } = await api.get<ProfileStrength>("/dashboard/profile-strength");
  return data;
}

export async function getGraduationProjectsForStudent(profileId: number): Promise<GradProject[]> {
  const { data } = await api.get<GradProject[]>("/graduation-projects", {
    params: { studentId: profileId },
  });
  return Array.isArray(data) ? data : [];
}

export async function getOrganizationMemberships(): Promise<OrganizationMembership[]> {
  const { data } = await api.get<OrganizationMembership[]>("/student/organization-memberships");
  return Array.isArray(data) ? data : [];
}

export type StudentBrowseFilterOptions = {
  universities: string[];
  majors: string[];
  skills: string[];
};

/** GET /api/students/filters — dropdown/pill options for student directory browse. */
export async function getStudentBrowseFilterOptions(): Promise<StudentBrowseFilterOptions> {
  const { data } = await api.get<StudentBrowseFilterOptions>("/students/filters");
  return {
    universities: Array.isArray(data?.universities) ? data.universities : [],
    majors: Array.isArray(data?.majors) ? data.majors : [],
    skills: Array.isArray(data?.skills) ? data.skills : [],
  };
}
