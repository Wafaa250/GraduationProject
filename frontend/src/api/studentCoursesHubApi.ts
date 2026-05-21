/**
 * Hub-shaped student courses API — same function names/shapes as Lovable studentApi.ts,
 * implemented against the real GraduationProject backend.
 */

import api, { parseApiErrorMessage } from "./axiosInstance";
import {
  acceptTeamInvitation,
  getAiTeamRecommendations,
  getCourseById,
  getCourseStudents,
  getEnrolledCourses,
  getManualTeamStudents,
  getTeamInvitations,
  rejectTeamInvitation,
  sendManualTeamRequest,
  type AiTeamRecommendation,
  type CourseDetails,
  type CourseStudent,
  type EnrolledCourse,
  type ManualTeamStudent,
  type TeamInvitationItem,
} from "./studentCoursesApi";
import type {
  HubAiRecommendation,
  HubApiError,
  HubChatMessage,
  HubCourseDetail,
  HubCourseProject,
  HubEnrolledCourse,
  HubManualStudent,
  HubRosterStudent,
  HubTeamInvitation,
  AvailabilityStatus,
} from "../types/studentCoursesHub";
import {
  formatSectionSchedule,
  normalizeCourseProject,
  type CourseProjectRaw,
} from "../app/pages/courses/components/studentCourseHelpers";

const sid = (v: number | string | null | undefined): string =>
  v == null || v === "" ? "" : String(v);

function toHubError(err: unknown): HubApiError {
  const status =
    (err as { response?: { status?: number } })?.response?.status ?? 500;
  return { status, message: parseApiErrorMessage(err) };
}

function mapEnrolled(c: EnrolledCourse): HubEnrolledCourse {
  const courseId = sid(c.courseId ?? (c as { id?: number }).id);
  const sectionRaw = c.section ?? c.Section;
  let sectionId = "";
  let sectionName = "Section";
  if (typeof sectionRaw === "string" && sectionRaw.trim()) {
    sectionName = sectionRaw.trim();
  } else if (sectionRaw && typeof sectionRaw === "object") {
    sectionId = sid(sectionRaw.sectionId ?? sectionRaw.SectionId);
    sectionName =
      sectionRaw.sectionName ??
      sectionRaw.SectionName ??
      sectionName;
  }
  return {
    courseId,
    name: c.name ?? "",
    code: c.code ?? "",
    semester: c.semester ?? "",
    doctorId: sid(c.doctorId),
    doctorName: c.doctorName ?? "",
    section: { sectionId, sectionName },
  };
}

function mapCourseDetail(d: CourseDetails, courseId: string): HubCourseDetail {
  const raw = d as CourseDetails & {
    mySectionId?: number;
    MySectionId?: number;
    mySectionName?: string;
    MySectionName?: string;
    createdAt?: string;
  };
  const mySectionId = sid(raw.mySectionId ?? raw.MySectionId);
  const mySectionName = raw.mySectionName ?? raw.MySectionName ?? "My section";
  const sections = (d.sections ?? []).map((s) => ({
    sectionId: sid(s.id),
    sectionName: s.name ?? "",
    schedule: formatSectionSchedule(s.days, s.timeFrom, s.timeTo),
    room: (s as { room?: string }).room?.trim() || "—",
  }));
  return {
    courseId,
    name: d.name ?? "",
    code: d.code ?? "",
    semester: d.semester ?? "",
    createdAt: raw.createdAt ?? "",
    doctorId: sid(d.doctorId),
    doctorName: d.doctorName ?? "",
    mySectionId,
    mySectionName,
    sections,
  };
}

function mapRosterStudent(s: CourseStudent): HubRosterStudent {
  return {
    studentId: sid(s.studentId ?? s.StudentId),
    name: String(s.name ?? s.Name ?? ""),
    universityId: String(s.universityId ?? s.UniversityId ?? ""),
    university: String(s.university ?? s.University ?? ""),
    major: String(s.major ?? s.Major ?? ""),
    email: String(s.email ?? s.Email ?? ""),
    enrolledAt: String(s.enrolledAt ?? s.EnrolledAt ?? ""),
    sectionId: sid(s.sectionId ?? s.SectionId),
  };
}

function mapManualStudent(s: ManualTeamStudent): HubManualStudent {
  return {
    id: sid(s.id),
    name: s.name,
    email: s.email,
    skills: s.skills ?? [],
    sectionName: s.sectionName,
    avatar: s.avatar ?? undefined,
    bio: s.bio ?? "",
    hasPendingRequest: s.hasPendingRequest,
    isAlreadyInTeam: s.isAlreadyInTeam,
    availabilityStatus: (s.availabilityStatus ?? "unavailable") as AvailabilityStatus,
    availabilityReason: s.availabilityReason,
  };
}

function mapAiRecommendation(s: AiTeamRecommendation): HubAiRecommendation {
  return {
    studentId: sid(s.studentId),
    name: s.name,
    email: s.email,
    avatar: s.avatar ?? undefined,
    sectionName: s.sectionName,
    skills: s.skills ?? [],
    bio: s.bio ?? "",
    matchScore: s.matchScore,
    matchReason: s.matchReason,
    hasPendingRequest: s.hasPendingRequest,
    isAlreadyInTeam: s.isAlreadyInTeam,
    availabilityStatus: (s.availabilityStatus ?? "unavailable") as AvailabilityStatus,
    availabilityReason: s.availabilityReason,
  };
}

function mapInvitation(i: TeamInvitationItem): HubTeamInvitation {
  return {
    invitationId: sid(i.invitationId),
    projectId: sid(i.projectId),
    projectTitle: i.projectTitle,
    courseId: sid(i.courseId),
    courseName: i.courseName,
    senderId: sid(i.senderId),
    senderName: i.senderName,
    senderSection: i.senderSection,
    senderSkills: i.senderSkills ?? [],
    message: i.message ?? "",
    invitedAt: i.invitedAt,
  };
}

export async function getHubEnrolledCourses(): Promise<HubEnrolledCourse[]> {
  try {
    const list = await getEnrolledCourses();
    return list.map(mapEnrolled);
  } catch (e) {
    throw toHubError(e);
  }
}

export async function getHubCourseDetail(courseId: string): Promise<HubCourseDetail> {
  const id = Number(courseId);
  if (!Number.isFinite(id) || id <= 0) throw { status: 400, message: "Invalid course id" };
  try {
    const d = await getCourseById(id);
    return mapCourseDetail(d, courseId);
  } catch (e) {
    throw toHubError(e);
  }
}

export async function getHubCourseStudents(courseId: string): Promise<HubRosterStudent[]> {
  const id = Number(courseId);
  try {
    const list = await getCourseStudents(id);
    return list.map(mapRosterStudent);
  } catch (e) {
    throw toHubError(e);
  }
}

export async function getHubCourseProjects(courseId: string): Promise<HubCourseProject[]> {
  const id = Number(courseId);
  try {
    const res = await api.get<CourseProjectRaw[]>(`/courses/${id}/projects`);
    return (res.data ?? []).map((p) => {
      const n = normalizeCourseProject(p);
      return {
        id: sid(n.id),
        courseId,
        title: n.title,
        description: n.description ?? "",
        teamSize: n.teamSize,
        applyToAllSections: n.applyToAllSections,
        allowCrossSectionTeams: n.allowCrossSectionTeams,
        aiMode: n.aiMode,
        createdAt: n.createdAt ?? "",
        sections: n.sections.map((s) => sid(s.sectionId)),
        hasTeam: n.hasTeam === true,
      };
    });
  } catch (e) {
    throw toHubError(e);
  }
}

export async function getHubManualTeamStudents(courseId: string, projectId: string) {
  const cid = Number(courseId);
  const pid = Number(projectId);
  try {
    const data = await getManualTeamStudents(cid, pid);
    return {
      projectTitle: data.projectTitle,
      teamSize: data.teamSize,
      students: (data.students ?? []).map(mapManualStudent),
    };
  } catch (e) {
    throw toHubError(e);
  }
}

export async function getHubAiRecommendations(courseId: string, projectId: string) {
  const cid = Number(courseId);
  const pid = Number(projectId);
  try {
    const [recs, projectsRes] = await Promise.all([
      getAiTeamRecommendations(cid, pid),
      api.get<CourseProjectRaw[]>(`/courses/${cid}/projects`),
    ]);
    const projects = (projectsRes.data ?? []).map(normalizeCourseProject);
    const project = projects.find((p) => p.id === pid);
    return {
      projectTitle: project?.title ?? `Project #${projectId}`,
      teamSize: project?.teamSize ?? 0,
      recommendations: (recs ?? []).map(mapAiRecommendation),
    };
  } catch (e) {
    throw toHubError(e);
  }
}

export async function sendHubTeamInvitation(
  courseId: string,
  projectId: string,
  receiverId: string,
) {
  try {
    const res = await sendManualTeamRequest(
      Number(courseId),
      Number(projectId),
      Number(receiverId),
    );
    return { status: "pending" as const, receiverId, message: res.message };
  } catch (e) {
    throw toHubError(e);
  }
}

export async function getHubTeamInvitations(): Promise<HubTeamInvitation[]> {
  try {
    const list = await getTeamInvitations();
    return list.map(mapInvitation);
  } catch (e) {
    throw toHubError(e);
  }
}

export async function acceptHubInvitation(invitationId: string) {
  try {
    return await acceptTeamInvitation(Number(invitationId));
  } catch (e) {
    throw toHubError(e);
  }
}

export async function rejectHubInvitation(invitationId: string) {
  try {
    return await rejectTeamInvitation(Number(invitationId));
  } catch (e) {
    throw toHubError(e);
  }
}

export async function getHubSectionChat(
  sectionId: string,
  limit = 100,
): Promise<HubChatMessage[]> {
  try {
    const res = await api.get<HubChatMessage[]>(
      `/sections/${Number(sectionId)}/chat?limit=${limit}`,
    );
    return (res.data ?? []).map((m) => ({
      ...m,
      id: sid(m.id),
      sectionId: sid(sectionId),
      senderUserId: sid(m.senderUserId),
    }));
  } catch (e) {
    throw toHubError(e);
  }
}

export async function postHubSectionChat(
  sectionId: string,
  body: { text: string },
): Promise<HubChatMessage> {
  try {
    const res = await api.post<HubChatMessage>(
      `/sections/${Number(sectionId)}/chat`,
      body,
    );
    return { ...res.data, id: sid(res.data.id), sectionId: sid(sectionId) };
  } catch (e) {
    throw toHubError(e);
  }
}

/** Hub-style team choice URL (query param). Canonical nested route still works. */
export function hubTeamChoicePath(courseId: number | string, projectId: number | string) {
  return `/student/courses/${courseId}/team-choice?projectId=${projectId}`;
}
