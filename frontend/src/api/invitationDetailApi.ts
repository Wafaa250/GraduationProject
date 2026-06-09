import api from "./axiosInstance";
import {
  acceptProjectInvitation,
  rejectProjectInvitation,
} from "./invitationsApi";
import {
  acceptTeamInvitation,
  rejectTeamInvitation,
} from "./studentCoursesApi";
import {
  acceptSupervisorRequest,
  rejectSupervisorRequest,
} from "./doctorDashboardApi";

export type GraduationInvitationDetail = {
  invitationId: number;
  status: string;
  createdAt: string;
  sender: { studentId: number; name: string };
  project: {
    projectId: number;
    title: string;
    description: string;
    ownerName: string;
    teamSize: number;
    currentMembers: number;
    requiredSkills: string[];
    members: { studentId: number; name: string; role: string }[];
  };
};

export type CourseInvitationDetail = {
  invitationId: number;
  status: string;
  invitedAt: string;
  message?: string;
  course: { courseId: number; courseName: string };
  project: {
    projectId: number;
    title: string;
    description: string;
    teamSize: number;
  };
  sender: { studentId: number; name: string; section: string };
  team: {
    currentMembers: { studentId: number; name: string }[];
    memberCount: number;
  };
};

export type SupervisionInvitationDetail = {
  requestId: number;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  project: {
    projectId: number;
    name: string;
    description: string | null;
    requiredSkills: string[];
    projectType: string;
    partnersCount: number;
    memberCount: number;
    members: { studentId: number; name: string; role: string; major: string }[];
  };
  sender: {
    studentId: number;
    name: string;
    major: string;
    university: string;
  };
};

export async function getGraduationInvitationDetail(
  invitationId: number,
): Promise<GraduationInvitationDetail> {
  const { data } = await api.get<GraduationInvitationDetail>(
    `/invitations/${invitationId}/detail`,
  );
  return data;
}

export async function getCourseInvitationDetail(
  invitationId: number,
): Promise<CourseInvitationDetail> {
  const { data } = await api.get<CourseInvitationDetail>(
    `/courses/team-invitations/${invitationId}`,
  );
  return data;
}

export async function getSupervisionInvitationDetail(
  requestId: number,
): Promise<SupervisionInvitationDetail> {
  const { data } = await api.get<SupervisionInvitationDetail>(
    `/doctors/me/requests/${requestId}`,
  );
  return data;
}

export async function acceptGraduationInvitation(invitationId: number): Promise<void> {
  await acceptProjectInvitation(invitationId);
}

export async function rejectGraduationInvitation(invitationId: number): Promise<void> {
  await rejectProjectInvitation(invitationId);
}

export async function acceptCourseInvitation(invitationId: number): Promise<void> {
  await acceptTeamInvitation(invitationId);
}

export async function rejectCourseInvitation(invitationId: number): Promise<void> {
  await rejectTeamInvitation(invitationId);
}

export async function acceptSupervisionInvitation(requestId: number): Promise<void> {
  await acceptSupervisorRequest(requestId);
}

export async function rejectSupervisionInvitation(requestId: number): Promise<void> {
  await rejectSupervisorRequest(requestId);
}
