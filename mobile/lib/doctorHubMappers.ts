import type { DoctorSupervisedProject, DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import type { DoctorCourseWithStats } from "@/api/doctorCoursesApi";
import type { DoctorMeResponse } from "@/api/meApi";
import { resolveProfileImageUri } from "@/lib/profilePhotoUrl";
import { projectTypeLabel } from "@/lib/graduationProjectTypes";

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDoctorHubDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function stripDoctorPrefix(name: string): string {
  return name.trim().replace(/^dr\.?\s+/i, "").trim();
}

/** Title-case display name for profile surfaces (settings, headers). */
export function formatDoctorDisplayName(name: string): string {
  const cleaned = stripDoctorPrefix(name.trim());
  if (!cleaned) return "Doctor";
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function firstNameFromName(name: string): string {
  const cleaned = stripDoctorPrefix(name);
  const first = cleaned.split(/\s+/).filter(Boolean)[0];
  return first ?? "";
}

export function formatDoctorGreetingName(name: string): string {
  const first = firstNameFromName(name);
  if (!first || /^dr\.?$/i.test(first)) return "Doctor";
  return `Dr. ${first}`;
}

export function mapDoctorMeToHeaderProfile(me: DoctorMeResponse) {
  const rawName = me.user?.name?.trim() || "";
  const displayName = stripDoctorPrefix(rawName) || rawName || "Doctor";
  const dp = me.doctorProfile as Record<string, unknown> | undefined;
  const user = me.user as Record<string, unknown> | undefined;
  const photoRaw =
    (dp?.profilePictureBase64 ?? dp?.ProfilePictureBase64 ?? user?.profilePictureBase64 ??
      user?.ProfilePictureBase64) as string | null | undefined;
  const profilePhoto = resolveProfileImageUri(photoRaw);
  return {
    displayName,
    greetingName: formatDoctorGreetingName(rawName),
    email: me.user?.email?.trim() || "",
    initials: initialsFromName(displayName || "?"),
    profilePhoto,
  };
}

export type DoctorRequestCardModel = {
  id: string;
  requestId: number;
  student: string;
  avatarInitials: string;
  major: string;
  title: string;
  skills: string[];
  team: number;
  date: string;
  status: string;
};

export function mapSupervisorRequestToCard(r: DoctorSupervisorRequest): DoctorRequestCardModel {
  return {
    id: String(r.requestId),
    student: r.sender.name,
    avatarInitials: initialsFromName(r.sender.name || "?"),
    major: r.sender.major || "—",
    title: r.project.name,
    skills: r.project.requiredSkills ?? [],
    team: r.project.partnersCount ?? r.project.memberCount ?? 0,
    date: formatDoctorHubDate(r.createdAt),
    status: r.status.toLowerCase(),
    requestId: r.requestId,
  };
}

export function formatDoctorHubRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return formatDoctorHubDate(iso);
  } catch {
    return "";
  }
}

export type DoctorHubProjectCardModel = {
  id: string;
  title: string;
  category: string;
  members: { name: string; initials: string }[];
  memberCount: number;
  updated: string;
  progress: number | null;
  risk: string | null;
};

export function mapSupervisedProjectToCard(p: DoctorSupervisedProject): DoctorHubProjectCardModel {
  const ownerName = p.owner.name || "—";
  const category =
    p.projectTypeLabel?.trim() ||
    projectTypeLabel(p.projectType, p.owner.faculty, p.owner.major);
  return {
    id: String(p.projectId),
    title: p.name,
    category,
    members: [{ name: ownerName, initials: initialsFromName(ownerName) }],
    memberCount: p.memberCount,
    updated: `Created ${formatDoctorHubRelativeTime(p.createdAt)}`,
    progress: null,
    risk: null,
  };
}

const COURSE_TONES = ["primary", "info", "success", "warning"] as const;

export type DoctorHubCourseCardModel = {
  courseId: number;
  code: string;
  name: string;
  sections: number;
  students: number;
  projects: number;
  color: (typeof COURSE_TONES)[number];
  semester: string | null;
};

export function mapCourseToCard(c: DoctorCourseWithStats, index: number): DoctorHubCourseCardModel {
  return {
    courseId: c.courseId,
    code: c.code,
    name: c.name,
    sections: c.sections,
    students: c.students,
    projects: c.projects,
    color: COURSE_TONES[index % COURSE_TONES.length],
    semester: c.semester,
  };
}

export function countUniqueSupervisedStudents(projects: DoctorSupervisedProject[]): number {
  const ids = new Set<number>();
  for (const p of projects) {
    if (p.owner?.studentId) ids.add(p.owner.studentId);
  }
  return ids.size;
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
