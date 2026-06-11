import api from "./axiosInstance";
import { appendMobileUploadFile, type MobileUploadFile } from "./mobileUpload";

function projectAppliesToSection(project: CourseProject, sectionId: number): boolean {
  if (project.applyToAllSections) return true;
  return project.sections.some((s) => s.sectionId === sectionId);
}

export type DoctorCourse = {
  courseId: number;
  name: string;
  code: string;
  semester: string | null;
  academicYear?: string | null;
  description?: string | null;
  allowCourseProjects?: boolean;
  allowTeamFormation?: boolean;
  allowAiTeamSuggestions?: boolean;
  allowStudentCollaboration?: boolean;
  defaultTeamFormationStrategy?: "doctor" | "student";
  createdAt: string;
  doctorId: number;
  doctorName: string;
};

export type DoctorCourseWithStats = DoctorCourse & {
  sections: number;
  students: number;
  projects: number;
};

export type CourseSection = {
  id: number;
  courseId: number;
  name: string;
  days: string[];
  timeFrom: string | null;
  timeTo: string | null;
  capacity: number;
  createdAt: string;
};

export type CourseEnrolledStudent = {
  studentId: number;
  name: string | null;
  universityId: string | null;
  university: string | null;
  major: string | null;
  email: string | null;
  enrolledAt: string;
  sectionId: number | null;
  userId?: number | null;
  skills?: string[];
};

export type CourseProjectSectionRef = {
  sectionId: number;
  sectionName: string;
};

export type CourseProject = {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  teamSize: number;
  applyToAllSections: boolean;
  allowCrossSectionTeams: boolean;
  aiMode: string;
  createdAt: string;
  sections: CourseProjectSectionRef[];
};

export type CourseProjectWithTeams = CourseProject & {
  teamCount: number;
};

export type CourseTeamMember = {
  studentId: number;
  userId: number;
  name: string;
  universityId?: string;
  matchScore?: number;
  skills?: string[];
};

export type CourseWorkspaceTeam = {
  courseProjectId: number;
  courseProjectTitle: string;
  teamId: number;
  teamIndex: number;
  memberCount: number;
  members: CourseTeamMember[];
};

export type CourseWorkspaceStats = {
  sections: number;
  students: number;
  courseProjectCount: number;
};

export type CourseSectionWorkspace = CourseSection & {
  studentCount: number;
  courseProjectCount: number;
};

export type CourseWorkspaceResponse = {
  course: DoctorCourse;
  stats: CourseWorkspaceStats;
  sections: CourseSectionWorkspace[];
  students: CourseEnrolledStudent[];
  courseProjects: CourseProjectWithTeams[];
  teams: CourseWorkspaceTeam[];
};

export type CreateCoursePayload = {
  name: string;
  code: string;
  semester: string;
  academicYear: string;
  description?: string;
  allowCourseProjects: boolean;
  allowTeamFormation: boolean;
  allowAiTeamSuggestions: boolean;
  allowStudentCollaboration: boolean;
  defaultTeamFormationStrategy: "doctor" | "student";
};

export type CreateCourseSectionPayload = {
  name: string;
  days: string[];
  timeFrom: string;
  timeTo: string;
  capacity: number;
};

export type CreateCourseProjectPayload = {
  title: string;
  description: string;
  teamSize: number;
  applyToAllSections: boolean;
  allowCrossSectionTeams: boolean;
  aiMode: "doctor" | "student";
  sectionIds: number[];
};

export type CourseTeam = {
  teamId: number;
  teamIndex: number;
  memberCount: number;
  members: CourseTeamMember[];
};

export type CourseProjectTeamsResponse = {
  projectId: number;
  projectTitle: string;
  teamSize: number;
  teamCount: number;
  teams: CourseTeam[];
};

export type AddSectionStudentsResult = {
  added: number;
  notFound: string[];
  alreadyEnrolled: string[];
};

export type ImportedStudentSummary = {
  universityId: string;
  name: string | null;
};

export type ImportSectionStudentsResult = {
  parsedCount: number;
  added: number;
  addedStudents: ImportedStudentSummary[];
  skipped: string[];
  invalidIds: string[];
};

function num(raw: unknown, fallback = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(raw: unknown, fallback = ""): string {
  return typeof raw === "string" ? raw : fallback;
}

function normalizeDoctorCourse(raw: Record<string, unknown>): DoctorCourse {
  return {
    courseId: num(raw.courseId ?? raw.CourseId),
    name: str(raw.name ?? raw.Name),
    code: str(raw.code ?? raw.Code),
    semester: (raw.semester ?? raw.Semester ?? null) as string | null,
    academicYear: (raw.academicYear ?? raw.AcademicYear ?? null) as string | null,
    description: (raw.description ?? raw.Description ?? null) as string | null,
    allowCourseProjects: Boolean(raw.allowCourseProjects ?? raw.AllowCourseProjects),
    allowTeamFormation: Boolean(raw.allowTeamFormation ?? raw.AllowTeamFormation),
    allowAiTeamSuggestions: Boolean(raw.allowAiTeamSuggestions ?? raw.AllowAiTeamSuggestions),
    allowStudentCollaboration: Boolean(raw.allowStudentCollaboration ?? raw.AllowStudentCollaboration),
    defaultTeamFormationStrategy: (raw.defaultTeamFormationStrategy ??
      raw.DefaultTeamFormationStrategy ??
      "doctor") as "doctor" | "student",
    createdAt: str(raw.createdAt ?? raw.CreatedAt),
    doctorId: num(raw.doctorId ?? raw.DoctorId),
    doctorName: str(raw.doctorName ?? raw.DoctorName),
  };
}

function normalizeCourseSection(raw: Record<string, unknown>): CourseSection {
  const daysRaw = raw.days ?? raw.Days;
  return {
    id: num(raw.id ?? raw.Id),
    courseId: num(raw.courseId ?? raw.CourseId),
    name: str(raw.name ?? raw.Name),
    days: Array.isArray(daysRaw) ? daysRaw.map(String) : [],
    timeFrom: (raw.timeFrom ?? raw.TimeFrom ?? null) as string | null,
    timeTo: (raw.timeTo ?? raw.TimeTo ?? null) as string | null,
    capacity: num(raw.capacity ?? raw.Capacity, 30),
    createdAt: str(raw.createdAt ?? raw.CreatedAt),
  };
}

function normalizeEnrolledStudent(raw: Record<string, unknown>): CourseEnrolledStudent {
  const skillsRaw = raw.skills ?? raw.Skills;
  return {
    studentId: num(raw.studentId ?? raw.StudentId),
    name: (raw.name ?? raw.Name ?? null) as string | null,
    universityId: (raw.universityId ?? raw.UniversityId ?? null) as string | null,
    university: (raw.university ?? raw.University ?? null) as string | null,
    major: (raw.major ?? raw.Major ?? null) as string | null,
    email: (raw.email ?? raw.Email ?? null) as string | null,
    enrolledAt: str(raw.enrolledAt ?? raw.EnrolledAt),
    sectionId: (raw.sectionId ?? raw.SectionId ?? null) as number | null,
    userId: (raw.userId ?? raw.UserId ?? null) as number | null,
    skills: Array.isArray(skillsRaw) ? skillsRaw.map(String).filter(Boolean) : [],
  };
}

function normalizeCourseProject(raw: Record<string, unknown>): CourseProjectWithTeams {
  const sectionsRaw = raw.sections ?? raw.Sections;
  const sections = Array.isArray(sectionsRaw)
    ? sectionsRaw.map((s) => {
        const row = s as Record<string, unknown>;
        return {
          sectionId: num(row.sectionId ?? row.SectionId),
          sectionName: str(row.sectionName ?? row.SectionName),
        };
      })
    : [];

  return {
    id: num(raw.id ?? raw.Id),
    courseId: num(raw.courseId ?? raw.CourseId),
    title: str(raw.title ?? raw.Title),
    description: (raw.description ?? raw.Description ?? null) as string | null,
    teamSize: num(raw.teamSize ?? raw.TeamSize, 1),
    applyToAllSections: Boolean(raw.applyToAllSections ?? raw.ApplyToAllSections),
    allowCrossSectionTeams: Boolean(raw.allowCrossSectionTeams ?? raw.AllowCrossSectionTeams),
    aiMode: str(raw.aiMode ?? raw.AiMode, "doctor"),
    createdAt: str(raw.createdAt ?? raw.CreatedAt),
    sections,
    teamCount: num(raw.teamCount ?? raw.TeamCount),
  };
}

function isValidCourseProject(p: CourseProjectWithTeams): boolean {
  return Number.isFinite(p.id) && p.id > 0 && p.title.trim().length > 0;
}

function normalizeCourseWorkspaceResponse(raw: Record<string, unknown>): CourseWorkspaceResponse {
  const courseRaw = (raw.course ?? raw.Course ?? {}) as Record<string, unknown>;
  const statsRaw = (raw.stats ?? raw.Stats ?? {}) as Record<string, unknown>;
  const sectionsRaw = raw.sections ?? raw.Sections;
  const studentsRaw = raw.students ?? raw.Students;
  const projectsRaw = raw.courseProjects ?? raw.CourseProjects;
  const teamsRaw = raw.teams ?? raw.Teams;

  const courseProjects = (Array.isArray(projectsRaw) ? projectsRaw : [])
    .map((p) => normalizeCourseProject(p as Record<string, unknown>))
    .filter(isValidCourseProject);

  return {
    course: normalizeDoctorCourse(courseRaw),
    stats: {
      sections: num(statsRaw.sections ?? statsRaw.Sections),
      students: num(statsRaw.students ?? statsRaw.Students),
      courseProjectCount: courseProjects.length,
    },
    sections: (Array.isArray(sectionsRaw) ? sectionsRaw : []).map((s) => {
      const row = s as Record<string, unknown>;
      const base = normalizeCourseSection(row);
      return {
        ...base,
        studentCount: num(row.studentCount ?? row.StudentCount),
        courseProjectCount: num(row.courseProjectCount ?? row.CourseProjectCount),
      };
    }),
    students: (Array.isArray(studentsRaw) ? studentsRaw : []).map((s) =>
      normalizeEnrolledStudent(s as Record<string, unknown>),
    ),
    courseProjects,
    teams: (Array.isArray(teamsRaw) ? teamsRaw : []).map((t) => {
      const row = t as Record<string, unknown>;
      const membersRaw = row.members ?? row.Members;
      return {
        courseProjectId: num(row.courseProjectId ?? row.CourseProjectId),
        courseProjectTitle: str(row.courseProjectTitle ?? row.CourseProjectTitle),
        teamId: num(row.teamId ?? row.TeamId),
        teamIndex: num(row.teamIndex ?? row.TeamIndex),
        memberCount: num(row.memberCount ?? row.MemberCount),
        members: Array.isArray(membersRaw) ? (membersRaw as CourseTeamMember[]) : [],
      };
    }),
  };
}

export async function getDoctorCourses(): Promise<DoctorCourse[]> {
  const { data } = await api.get<unknown[]>("/courses/my");
  return Array.isArray(data) ? data.map((row) => normalizeDoctorCourse(row as Record<string, unknown>)) : [];
}

/** POST /api/courses */
export async function createCourse(payload: CreateCoursePayload): Promise<DoctorCourse> {
  const { data } = await api.post<unknown>("/courses", {
    name: payload.name.trim(),
    code: payload.code.trim(),
    semester: payload.semester.trim(),
    academicYear: payload.academicYear.trim(),
    description: payload.description?.trim() || undefined,
    allowCourseProjects: payload.allowCourseProjects,
    allowTeamFormation: payload.allowTeamFormation,
    allowAiTeamSuggestions: payload.allowAiTeamSuggestions,
    allowStudentCollaboration: payload.allowStudentCollaboration,
    defaultTeamFormationStrategy: payload.defaultTeamFormationStrategy,
  });
  return normalizeDoctorCourse(data as Record<string, unknown>);
}

function finalizeCourseWorkspaceResponse(raw: CourseWorkspaceResponse): CourseWorkspaceResponse {
  const courseProjects = (raw.courseProjects ?? [])
    .map((p) => ({
      ...p,
      teamCount: typeof p.teamCount === "number" ? p.teamCount : 0,
      sections: p.sections ?? [],
    }))
    .filter(isValidCourseProject);

  return {
    course: raw.course,
    stats: {
      sections: raw.stats?.sections ?? 0,
      students: raw.stats?.students ?? 0,
      courseProjectCount: courseProjects.length,
    },
    sections: (raw.sections ?? []).map((s) => ({
      ...s,
      studentCount: s.studentCount ?? 0,
      courseProjectCount: s.courseProjectCount ?? 0,
    })),
    students: (raw.students ?? []).map((s) => ({
      ...s,
      userId: s.userId ?? null,
      skills: Array.isArray(s.skills) ? s.skills.filter(Boolean) : [],
    })),
    courseProjects,
    teams: (raw.teams ?? []).map((t) => ({
      courseProjectId: t.courseProjectId,
      courseProjectTitle: t.courseProjectTitle,
      teamId: t.teamId,
      teamIndex: t.teamIndex,
      memberCount: t.memberCount,
      members: t.members ?? [],
    })),
  };
}

/** Client-side aggregation — same pipeline as WEB (no GET /courses/{id}/workspace). */
export async function getCourseWorkspace(courseId: number): Promise<CourseWorkspaceResponse> {
  const [course, sections, students, projects] = await Promise.all([
    getDoctorCourseById(courseId),
    getCourseSections(courseId),
    getCourseEnrolledStudents(courseId),
    getCourseProjects(courseId),
  ]);

  const teamsResponses = await Promise.all(
    projects.map((project) => getCourseProjectTeams(courseId, project.id).catch(() => null)),
  );

  const teamsByProjectId = new Map<number, CourseProjectTeamsResponse>();
  projects.forEach((project, index) => {
    const response = teamsResponses[index];
    if (response) teamsByProjectId.set(project.id, response);
  });

  const teams: CourseWorkspaceTeam[] = [];
  for (const project of projects) {
    const teamsRes = teamsByProjectId.get(project.id);
    if (!teamsRes) continue;
    for (const team of teamsRes.teams) {
      teams.push({
        courseProjectId: project.id,
        courseProjectTitle: project.title,
        teamId: team.teamId,
        teamIndex: team.teamIndex,
        memberCount: team.memberCount,
        members: team.members ?? [],
      });
    }
  }

  const courseProjects: CourseProjectWithTeams[] = projects.map((project) => ({
    ...project,
    teamCount: teamsByProjectId.get(project.id)?.teamCount ?? 0,
  }));

  const sectionWorkspace: CourseSectionWorkspace[] = sections.map((section) => ({
    ...section,
    studentCount: students.filter((s) => s.sectionId === section.id).length,
    courseProjectCount: projects.filter((p) => projectAppliesToSection(p, section.id)).length,
  }));

  return finalizeCourseWorkspaceResponse({
    course,
    stats: {
      sections: sections.length,
      students: students.length,
      courseProjectCount: projects.length,
    },
    sections: sectionWorkspace,
    students,
    courseProjects,
    teams,
  });
}

export async function getCourseSections(courseId: number): Promise<CourseSection[]> {
  const { data } = await api.get<unknown[]>(`/courses/${courseId}/sections`);
  return Array.isArray(data)
    ? data.map((row) => normalizeCourseSection(row as Record<string, unknown>))
    : [];
}

export async function createCourseSection(
  courseId: number,
  payload: CreateCourseSectionPayload,
): Promise<CourseSection> {
  const { data } = await api.post<Record<string, unknown>>(`/courses/${courseId}/sections`, {
    name: payload.name.trim(),
    days: payload.days,
    timeFrom: payload.timeFrom.trim() || null,
    timeTo: payload.timeTo.trim() || null,
    capacity: payload.capacity,
  });
  return normalizeCourseSection(data ?? {});
}

export async function updateCourseSection(
  sectionId: number,
  payload: CreateCourseSectionPayload,
): Promise<CourseSection> {
  const { data } = await api.put<Record<string, unknown>>(`/courses/sections/${sectionId}`, {
    name: payload.name.trim(),
    days: payload.days,
    timeFrom: payload.timeFrom.trim() || null,
    timeTo: payload.timeTo.trim() || null,
    capacity: payload.capacity,
  });
  return normalizeCourseSection(data ?? {});
}

export async function deleteCourseSection(sectionId: number): Promise<void> {
  await api.delete(`/courses/sections/${sectionId}`);
}

export async function getCourseEnrolledStudents(courseId: number): Promise<CourseEnrolledStudent[]> {
  const { data } = await api.get<unknown[]>(`/courses/${courseId}/enrolled-students`);
  return Array.isArray(data)
    ? data.map((row) => normalizeEnrolledStudent(row as Record<string, unknown>))
    : [];
}

export async function addStudentsToSection(
  sectionId: number,
  studentIds: string[],
): Promise<AddSectionStudentsResult> {
  const { data } = await api.post<Record<string, unknown>>(`/courses/sections/${sectionId}/students`, {
    studentIds,
  });
  return {
    added: num(data?.added ?? data?.Added),
    notFound: (data?.notFound ?? data?.NotFound ?? []) as string[],
    alreadyEnrolled: (data?.alreadyEnrolled ?? data?.AlreadyEnrolled ?? []) as string[],
  };
}

export async function importStudentsToSection(
  sectionId: number,
  file: MobileUploadFile,
): Promise<ImportSectionStudentsResult> {
  const form = new FormData();
  appendMobileUploadFile(form, "file", file);

  const { data } = await api.post<Record<string, unknown>>(
    `/courses/sections/${sectionId}/students/import`,
    form,
  );

  const addedStudentsRaw = data?.addedStudents ?? data?.AddedStudents;
  return {
    parsedCount: num(data?.parsedCount ?? data?.ParsedCount),
    added: num(data?.added ?? data?.Added),
    addedStudents: Array.isArray(addedStudentsRaw)
      ? addedStudentsRaw.map((s) => {
          const row = s as Record<string, unknown>;
          return {
            universityId: str(row.universityId ?? row.UniversityId),
            name: (row.name ?? row.Name ?? null) as string | null,
          };
        })
      : [],
    skipped: (data?.skipped ?? data?.Skipped ?? []) as string[],
    invalidIds: (data?.invalidIds ?? data?.InvalidIds ?? []) as string[],
  };
}

export async function removeStudentFromSection(sectionId: number, studentProfileId: number): Promise<void> {
  await api.delete(`/courses/sections/${sectionId}/students/${studentProfileId}`);
}

async function getCourseSectionsCount(courseId: number): Promise<number> {
  const sections = await getCourseSections(courseId);
  return sections.length;
}

async function getCourseStudentsCount(courseId: number): Promise<number> {
  const students = await getCourseEnrolledStudents(courseId);
  return students.length;
}

export async function getDoctorCourseById(courseId: number): Promise<DoctorCourse> {
  const { data } = await api.get<Record<string, unknown>>(`/courses/${courseId}`);
  return normalizeDoctorCourse(data ?? {});
}

function normalizeCourseTeamMember(raw: Record<string, unknown>): CourseTeamMember {
  const skillsRaw = raw.skills ?? raw.Skills;
  return {
    studentId: num(raw.studentId ?? raw.StudentId),
    userId: num(raw.userId ?? raw.UserId),
    name: str(raw.name ?? raw.Name),
    universityId: str(raw.universityId ?? raw.UniversityId) || undefined,
    matchScore: num(raw.matchScore ?? raw.MatchScore) || undefined,
    skills: Array.isArray(skillsRaw) ? skillsRaw.map(String).filter(Boolean) : undefined,
  };
}

function normalizeCourseProjectTeamsResponse(raw: Record<string, unknown>): CourseProjectTeamsResponse {
  const teamsRaw = raw.teams ?? raw.Teams;
  return {
    projectId: num(raw.projectId ?? raw.ProjectId),
    projectTitle: str(raw.projectTitle ?? raw.ProjectTitle),
    teamSize: num(raw.teamSize ?? raw.TeamSize, 1),
    teamCount: num(raw.teamCount ?? raw.TeamCount),
    teams: (Array.isArray(teamsRaw) ? teamsRaw : []).map((t) => {
      const row = t as Record<string, unknown>;
      const membersRaw = row.members ?? row.Members;
      return {
        teamId: num(row.teamId ?? row.TeamId),
        teamIndex: num(row.teamIndex ?? row.TeamIndex),
        memberCount: num(row.memberCount ?? row.MemberCount),
        members: Array.isArray(membersRaw)
          ? membersRaw.map((m) => normalizeCourseTeamMember(m as Record<string, unknown>))
          : [],
      };
    }),
  };
}

export async function getCourseProjects(courseId: number): Promise<CourseProjectWithTeams[]> {
  const { data } = await api.get<unknown[]>(`/courses/${courseId}/projects`);
  return Array.isArray(data)
    ? data.map((row) => normalizeCourseProject(row as Record<string, unknown>))
    : [];
}

export async function createCourseProject(
  courseId: number,
  payload: CreateCourseProjectPayload,
): Promise<CourseProject> {
  const { data } = await api.post<Record<string, unknown>>(`/courses/${courseId}/projects`, {
    title: payload.title.trim(),
    description: payload.description?.trim() ?? "",
    teamSize: payload.teamSize,
    applyToAllSections: payload.applyToAllSections,
    allowCrossSectionTeams: payload.allowCrossSectionTeams,
    aiMode: payload.aiMode,
    sectionIds: payload.sectionIds,
  });
  return normalizeCourseProject(data ?? {});
}

export async function updateCourseProject(
  projectId: number,
  payload: CreateCourseProjectPayload,
): Promise<CourseProject> {
  const { data } = await api.put<Record<string, unknown>>(`/courses/projects/${projectId}`, {
    title: payload.title.trim(),
    description: payload.description?.trim() ?? "",
    teamSize: payload.teamSize,
    applyToAllSections: payload.applyToAllSections,
    allowCrossSectionTeams: payload.allowCrossSectionTeams,
    aiMode: payload.aiMode,
    sectionIds: payload.sectionIds,
  });
  return normalizeCourseProject(data ?? {});
}

export async function deleteCourseProject(projectId: number): Promise<void> {
  await api.delete(`/courses/projects/${projectId}`);
}

export async function getCourseProjectTeams(
  courseId: number,
  projectId: number,
): Promise<CourseProjectTeamsResponse> {
  const { data } = await api.get<Record<string, unknown>>(
    `/courses/${courseId}/projects/${projectId}/teams`,
  );
  return normalizeCourseProjectTeamsResponse(data ?? {});
}

export async function generateCourseProjectTeams(
  courseId: number,
  projectId: number,
): Promise<CourseProjectTeamsResponse> {
  const { data } = await api.post<Record<string, unknown>>(
    `/courses/${courseId}/projects/${projectId}/generate-teams`,
  );
  return normalizeCourseProjectTeamsResponse(data ?? {});
}

export async function previewCourseProjectTeams(
  courseId: number,
  projectId: number,
): Promise<CourseProjectTeamsResponse> {
  const { data } = await api.post<Record<string, unknown>>(
    `/courses/${courseId}/projects/${projectId}/preview-teams`,
  );
  return normalizeCourseProjectTeamsResponse(data ?? {});
}

async function getCourseProjectsCount(courseId: number): Promise<number> {
  const projects = await getCourseProjects(courseId);
  return projects.length;
}

export async function getDoctorCoursesWithStats(): Promise<DoctorCourseWithStats[]> {
  const courses = await getDoctorCourses();
  return Promise.all(
    courses.map(async (course) => {
      const [sections, students, projects] = await Promise.all([
        getCourseSectionsCount(course.courseId),
        getCourseStudentsCount(course.courseId),
        getCourseProjectsCount(course.courseId),
      ]);
      return { ...course, sections, students, projects };
    }),
  );
}
