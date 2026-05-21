import type { CourseDetails, CourseStudent } from "../../../../api/studentCoursesApi";

export type CourseProjectSection = { sectionId: number; sectionName: string };

export type CourseProjectRaw = {
  id?: number;
  courseId?: number;
  title?: string;
  description?: string | null;
  teamSize?: number;
  applyToAllSections?: boolean;
  allowCrossSectionTeams?: boolean;
  aiMode?: string;
  createdAt?: string;
  sections?: CourseProjectSection[];
  hasTeam?: boolean;
  Id?: number;
  CourseId?: number;
  Title?: string;
  Description?: string | null;
  TeamSize?: number;
  ApplyToAllSections?: boolean;
  AllowCrossSectionTeams?: boolean;
  AiMode?: string;
  CreatedAt?: string;
  Sections?: CourseProjectSection[];
  HasTeam?: boolean;
};

export type CourseProject = {
  id: number;
  courseId: number;
  title: string;
  description?: string | null;
  teamSize: number;
  applyToAllSections: boolean;
  allowCrossSectionTeams: boolean;
  aiMode: "doctor" | "student";
  createdAt: string;
  sections: CourseProjectSection[];
  hasTeam: boolean;
};

export function normalizeCourseProject(raw: CourseProjectRaw): CourseProject {
  const aiModeRaw = (raw.aiMode ?? raw.AiMode ?? "doctor").toLowerCase().trim();
  return {
    id: raw.id ?? raw.Id ?? 0,
    courseId: raw.courseId ?? raw.CourseId ?? 0,
    title: raw.title ?? raw.Title ?? "",
    description: raw.description ?? raw.Description ?? null,
    teamSize: raw.teamSize ?? raw.TeamSize ?? 2,
    applyToAllSections: raw.applyToAllSections ?? raw.ApplyToAllSections ?? false,
    allowCrossSectionTeams: raw.allowCrossSectionTeams ?? raw.AllowCrossSectionTeams ?? false,
    aiMode: aiModeRaw === "student" ? "student" : "doctor",
    createdAt: raw.createdAt ?? raw.CreatedAt ?? "",
    sections: (raw.sections ?? raw.Sections ?? []).map((s) => ({
      sectionId:
        (s as { sectionId?: number; SectionId?: number }).sectionId ??
        (s as { sectionId?: number; SectionId?: number }).SectionId ??
        0,
      sectionName:
        (s as { sectionName?: string; SectionName?: string }).sectionName ??
        (s as { sectionName?: string; SectionName?: string }).SectionName ??
        "",
    })),
    hasTeam: !!(raw.hasTeam ?? raw.HasTeam),
  };
}

export type CourseBundle = {
  detail: CourseDetails;
  roster: CourseStudent[];
};

export type CourseTab = "section" | "chat" | "projects";

export type ChatMessage = {
  id: number;
  sectionId: number;
  senderUserId: number;
  senderName: string;
  text: string;
  sentAt: string;
};

export function normalizeChatMessage(raw: unknown): ChatMessage {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? r.Id ?? 0),
    sectionId: Number(r.sectionId ?? r.SectionId ?? 0),
    senderUserId: Number(r.senderUserId ?? r.SenderUserId ?? 0),
    senderName: String(r.senderName ?? r.SenderName ?? ""),
    text: String(r.text ?? r.Text ?? ""),
    sentAt: String(r.sentAt ?? r.SentAt ?? ""),
  };
}

/** GET /api/me returns `userId`, not `id`. */
export function getAuthUserIdFromMe(me: unknown): number | null {
  const u = me as {
    userId?: unknown;
    UserId?: unknown;
    id?: unknown;
    Id?: unknown;
  } | null;
  const raw = u?.userId ?? u?.UserId ?? u?.id ?? u?.Id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function asText(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function getStudentProfileIdFromUser(user: unknown): number | null {
  const obj = user as {
    profileId?: unknown;
    ProfileId?: unknown;
    studentProfileId?: unknown;
    StudentProfileId?: unknown;
  };
  const raw =
    obj.profileId ?? obj.ProfileId ?? obj.studentProfileId ?? obj.StudentProfileId;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function getCourseStudentProfileId(student: CourseStudent): number | null {
  const row = student as CourseStudent & { id?: number; Id?: number };
  const raw = row.studentId ?? row.StudentId ?? row.id ?? row.Id;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

import type { EnrolledCourse } from "../../../../api/studentCoursesApi";

/** Display label for enrolled course cards (e.g. "Section A"). */
/** Hub label for project teams, e.g. "Team A". */
export function formatTeamDisplayName(teamIndex: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letter = letters[teamIndex] ?? String(teamIndex + 1);
  return `Team ${letter}`;
}

export function formatSectionDisplayName(raw: string): string {
  const name = raw.trim();
  if (!name) return "Section";
  if (/^section\b/i.test(name)) return name;
  if (/^[A-Za-z]$/.test(name)) return `Section ${name.toUpperCase()}`;
  return name;
}

export function getEnrolledSectionLabel(course: EnrolledCourse): string {
  const section =
    course.section ??
    (course as EnrolledCourse & { Section?: EnrolledCourse["section"] }).Section;
  if (typeof section === "string" && section.trim()) {
    return formatSectionDisplayName(section);
  }
  if (section && typeof section === "object") {
    const name =
      section.sectionName ??
      section.SectionName ??
      (section as { name?: string }).name;
    if (typeof name === "string" && name.trim()) {
      return formatSectionDisplayName(name);
    }
  }
  return "Section";
}

export function formatEnrolledSemester(semester: string | null | undefined): string {
  const s = semester?.trim();
  if (!s) return "";
  return s.replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase());
}

function capitalizeDayLabel(day: string): string {
  const t = day.trim().toLowerCase();
  if (!t) return day.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Hub-style schedule line, e.g. "Sun & Tue · 10:00–11:30". */
export function formatSectionSchedule(
  days: string[] | undefined,
  from?: string | null,
  to?: string | null,
): string {
  const dayPart =
    Array.isArray(days) && days.length > 0
      ? days.map(capitalizeDayLabel).join(" & ")
      : "Schedule not specified";
  if (!from || !to) return dayPart;
  return `${dayPart} · ${from}–${to}`;
}

export function getSectionRoom(
  section: { room?: string | null; Room?: string | null } | null | undefined,
): string {
  const raw = section?.room ?? section?.Room;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "—";
}

export function isDoctorAssignedProject(project: CourseProject): boolean {
  const projectRaw = project as CourseProject & {
    teamFormationMode?: string;
    assignmentMode?: string;
    teamMode?: string;
    formationMode?: string;
    isDoctorAssigned?: boolean;
    allowStudentSelection?: boolean;
  };
  const modeText = String(
    projectRaw.teamFormationMode ??
      projectRaw.assignmentMode ??
      projectRaw.teamMode ??
      projectRaw.formationMode ??
      "",
  )
    .trim()
    .toLowerCase();
  const doctorAssignedByMode =
    modeText.includes("doctor") || modeText.includes("ai") || modeText.includes("auto");
  const studentAssignedByMode =
    modeText.includes("student") || modeText.includes("manual") || modeText.includes("self");
  if (typeof projectRaw.isDoctorAssigned === "boolean") return projectRaw.isDoctorAssigned;
  if (typeof projectRaw.allowStudentSelection === "boolean") {
    return !projectRaw.allowStudentSelection;
  }
  if (doctorAssignedByMode) return true;
  if (studentAssignedByMode) return false;
  return project.aiMode === "doctor";
}
