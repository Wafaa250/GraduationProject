import type {
  CourseEnrollmentStudent,
  EnrolledCourse,
  StudentCourseDetail,
  StudentCourseProject,
  StudentCourseSection,
} from "@/api/studentCoursesApi";
import { parseCourseProjectDescription } from "@/lib/courseProjectDescription";

export type CourseCardColor = "primary" | "info" | "success" | "warning";

const CARD_COLORS: CourseCardColor[] = ["primary", "info", "success", "warning"];

export type ManageCourseCardModel = {
  id: string;
  courseId: number;
  name: string;
  code: string;
  section: string;
  doctor: string;
  doctorTitle: string;
  students: number;
  projects: number;
  schedule: string;
  color: CourseCardColor;
  description: string;
  semester?: string | null;
};

export type ManageCourseDetailModel = ManageCourseCardModel & {
  mySectionId: number;
  officeHours: string;
};

export type ManageClassmateModel = {
  id: string;
  courseId: string;
  name: string;
  major: string;
  skills: string[];
  initials: string;
  teamStatus: string;
  userId?: number | null;
};

export type ManageProjectModel = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  skills: string[];
  teamSize: number;
  type: string;
  aiMode: string;
  hasTeam: boolean;
  teamStatus: string;
  sectionsLabel: string;
  applyToAllSections: boolean;
  createdAt: string;
};

export type CourseOverviewSummary = {
  classmatesInSection: number;
  availableProjects: number;
  teamStatusSummary: string;
  latestAnnouncementLabel: string;
  recentProjects: ManageProjectModel[];
  latestAnnouncement: {
    id: number;
    title: string;
    message: string;
    doctor: string;
    date: string;
  } | null;
};

function formatAiMode(mode: string): string {
  return mode === "student" ? "Student-led teams" : "Doctor generates teams";
}

export function courseCardColor(index: number): CourseCardColor {
  return CARD_COLORS[index % CARD_COLORS.length];
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatSectionSchedule(section: StudentCourseSection | undefined): string {
  if (!section) return "—";
  const days = section.days?.length ? section.days.join(" · ") : "";
  const time =
    section.timeFrom && section.timeTo
      ? `${section.timeFrom} – ${section.timeTo}`
      : section.timeFrom || section.timeTo || "";
  return [days, time].filter(Boolean).join("  ·  ") || "—";
}

export function buildCourseDescription(
  detail: Pick<StudentCourseDetail, "name" | "code" | "semester">,
  doctorBio?: string | null,
): string {
  const bio = doctorBio?.trim();
  if (bio) return bio;
  const semester = detail.semester?.trim();
  if (semester) {
    return `${detail.name} (${detail.code}) — ${semester}.`;
  }
  return `${detail.name} (${detail.code}).`;
}

export function mapEnrolledToCard(
  enrolled: EnrolledCourse,
  index: number,
  stats: { students: number; projects: number },
  detail?: StudentCourseDetail | null,
  doctorTitle?: string,
  schedule?: string,
  description?: string,
): ManageCourseCardModel {
  const mySection =
    detail?.sections.find((s) => s.id === detail.mySectionId) ??
    detail?.sections.find((s) => s.name === enrolled.section.sectionName);

  return {
    id: String(enrolled.courseId),
    courseId: enrolled.courseId,
    name: enrolled.name,
    code: enrolled.code,
    section: enrolled.section.sectionName,
    doctor: enrolled.doctorName,
    doctorTitle: doctorTitle?.trim() || "Instructor",
    students: stats.students,
    projects: stats.projects,
    schedule: schedule ?? formatSectionSchedule(mySection),
    color: courseCardColor(index),
    description:
      description ??
      buildCourseDescription({
        name: enrolled.name,
        code: enrolled.code,
        semester: enrolled.semester,
      }),
    semester: enrolled.semester,
  };
}

export function mapDetailToModel(
  card: ManageCourseCardModel,
  detail: StudentCourseDetail,
  officeHours: string,
): ManageCourseDetailModel {
  return {
    ...card,
    mySectionId: detail.mySectionId,
    section: detail.mySectionName,
    schedule: formatSectionSchedule(detail.sections.find((s) => s.id === detail.mySectionId)),
    officeHours,
  };
}

export function mapClassmates(
  courseId: number,
  students: CourseEnrollmentStudent[],
  mySectionId: number,
  currentStudentId?: number | null,
  teamStatusByStudentId?: Record<number, string>,
): ManageClassmateModel[] {
  return students
    .filter((s) => s.sectionId === mySectionId && s.studentId !== currentStudentId)
    .map((s) => ({
      id: String(s.studentId),
      courseId: String(courseId),
      name: s.name?.trim() || "—",
      major: s.major?.trim() || "—",
      skills: s.skills ?? [],
      initials: initialsFromName(s.name?.trim() || "?"),
      teamStatus: teamStatusByStudentId?.[s.studentId] ?? "—",
      userId: s.userId ?? null,
    }));
}

export function mapProjects(
  courseId: number,
  projects: StudentCourseProject[],
): ManageProjectModel[] {
  return projects.map((p) => {
    const aiMode = p.aiMode?.trim().toLowerCase() === "student" ? "student" : "doctor";
    const { publicDescription, requiredSkills } = parseCourseProjectDescription(p.description);
    return {
      id: String(p.id),
      courseId: String(courseId),
      title: p.title,
      description: publicDescription.trim() || "No description provided.",
      skills: requiredSkills,
      teamSize: p.teamSize,
      type: formatAiMode(aiMode),
      aiMode,
      hasTeam: Boolean(p.hasTeam),
      teamStatus: formatProjectTeamStatus(aiMode, Boolean(p.hasTeam)),
      sectionsLabel: formatProjectSectionsLabel(p),
      applyToAllSections: Boolean(p.applyToAllSections),
      createdAt: p.createdAt ?? "",
    };
  });
}

export function buildCourseOverviewSummary(
  classmates: ManageClassmateModel[],
  projects: ManageProjectModel[],
  announcements: {
    id: number;
    title: string;
    message: string;
    doctor: string;
    date: string;
  }[],
): CourseOverviewSummary {
  const withTeam = projects.filter((p) => p.hasTeam).length;
  const total = projects.length;

  let teamStatusSummary = "No projects in your section";
  if (total > 0) {
    if (withTeam === total) {
      teamStatusSummary = `Teams set on all ${total} project${total === 1 ? "" : "s"}`;
    } else if (withTeam === 0) {
      const awaitingDoctor = projects.some((p) => p.aiMode === "doctor");
      const studentLed = projects.some((p) => p.aiMode === "student");
      if (awaitingDoctor && !studentLed) {
        teamStatusSummary = "Waiting for doctor team assignment";
      } else if (studentLed && !awaitingDoctor) {
        teamStatusSummary = "Form your team";
      } else {
        teamStatusSummary = "Teams not assigned yet";
      }
    } else {
      teamStatusSummary = `Teams on ${withTeam} of ${total} projects`;
    }
  }

  const latest = announcements[0] ?? null;
  const recentProjects = [...projects]
    .sort((a, b) => {
      const ta = Date.parse(a.createdAt) || 0;
      const tb = Date.parse(b.createdAt) || 0;
      return tb - ta;
    })
    .slice(0, 3);

  return {
    classmatesInSection: classmates.length,
    availableProjects: total,
    teamStatusSummary,
    latestAnnouncementLabel: latest?.title?.trim() || "No announcements yet",
    recentProjects,
    latestAnnouncement: latest,
  };
}

export function formatProjectSectionsLabel(project: StudentCourseProject): string {
  if (project.applyToAllSections) return "All sections";
  const names = (project.sections ?? [])
    .map((s) => s.sectionName?.trim())
    .filter(Boolean) as string[];
  if (names.length === 0) return "—";
  return names.join(", ");
}

export function formatProjectTeamStatus(aiMode: string, hasTeam: boolean): string {
  if (hasTeam) return "Team assigned";
  return aiMode === "student" ? "Form your team" : "Awaiting team assignment";
}

export function countSectionStudents(
  students: CourseEnrollmentStudent[],
  sectionId: number,
): number {
  return students.filter((s) => s.sectionId === sectionId).length;
}

export async function buildClassmateTeamStatusMap(
  courseId: number,
  projects: StudentCourseProject[],
  studentIds: number[],
  myStudentId: number | null,
  loaders: {
    getMyTeam: (projectId: number) => Promise<{ members: { studentId: number }[] } | null>;
    getManualStudents: (
      courseId: number,
      projectId: number,
    ) => Promise<{ students: { id: number; availabilityStatus: string; availabilityReason: string }[] }>;
  },
): Promise<Record<number, string>> {
  const inTeam = new Set<number>();
  const myTeammates = new Set<number>();

  await Promise.all(
    projects.map(async (project) => {
      try {
        const team = await loaders.getMyTeam(project.id);
        if (team?.members) {
          for (const member of team.members) {
            inTeam.add(member.studentId);
            if (myStudentId != null && member.studentId !== myStudentId) {
              myTeammates.add(member.studentId);
            }
          }
        }
      } catch {
        /* not on a team */
      }

      if (project.aiMode?.trim().toLowerCase() === "student") {
        try {
          const roster = await loaders.getManualStudents(courseId, project.id);
          for (const student of roster.students) {
            if (
              student.availabilityStatus === "unavailable" &&
              student.availabilityReason === "Already in team"
            ) {
              inTeam.add(student.id);
            }
          }
        } catch {
          /* roster unavailable */
        }
      }
    }),
  );

  const result: Record<number, string> = {};
  for (const id of studentIds) {
    if (myTeammates.has(id)) result[id] = "Your teammate";
    else if (inTeam.has(id)) result[id] = "In a team";
    else result[id] = "Available";
  }
  return result;
}
