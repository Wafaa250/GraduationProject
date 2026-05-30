import type { DoctorSupervisedProject, DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import type { DoctorCourseWithStats } from "@/api/doctorCoursesApi";
import type { DoctorMeResponse } from "@/api/meApi";
import { resolveGraduationProjectLabel } from "@/lib/graduationProjectTypes";

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

export function mapDoctorMeToProfile(me: DoctorMeResponse) {
  const name = me.user?.name?.trim() || "";
  const dp = me.doctorProfile;
  const photo = dp?.profilePictureBase64?.trim() || me.user?.profilePictureBase64?.trim() || null;
  return {
    profileId: (me.profileId ?? me.doctorProfile?.profileId ?? null) as number | null,
    userId: (me.userId ?? me.user?.userId ?? null) as number | null,
    displayName: name || "—",
    email: me.user?.email?.trim() || "",
    initials: initialsFromName(name || "?"),
    title: dp?.specialization?.trim() || "—",
    department: dp?.department?.trim() || "—",
    faculty: dp?.faculty?.trim() || "—",
    semester: "—",
    profilePhoto: photo?.startsWith("data:") ? photo : photo ? `data:image/jpeg;base64,${photo}` : null,
  };
}

export function mapSupervisorRequestToCard(r: DoctorSupervisorRequest) {
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
    resolveGraduationProjectLabel(
      p.owner.faculty,
      p.owner.major,
      p.projectType ?? "GP",
    );
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

export function mapCourseToCard(c: DoctorCourseWithStats, index: number) {
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
