import api from "./axiosInstance";

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

export type CourseWorkspaceStats = {
  sections: number;
  students: number;
  courseProjectCount: number;
};

export type CourseSectionWorkspace = CourseSection & {
  studentCount: number;
  courseProjectCount: number;
};

export type CourseWorkspaceTeam = {
  courseProjectId: number;
  courseProjectTitle: string;
  teamId: number;
  teamIndex: number;
  memberCount: number;
  members: CourseTeamMember[];
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

export async function getDoctorCourses(): Promise<DoctorCourse[]> {
  const { data } = await api.get<DoctorCourse[]>("/courses/my");
  return Array.isArray(data) ? data : [];
}

/** POST /api/courses */
export async function createCourse(payload: CreateCoursePayload): Promise<DoctorCourse> {
  const { data } = await api.post<DoctorCourse>("/courses", {
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
  return data;
}

export async function getDoctorCourseById(courseId: number): Promise<DoctorCourse> {
  const { data } = await api.get<DoctorCourse>(`/courses/${courseId}`);
  return data;
}

export async function getCourseWorkspace(courseId: number): Promise<CourseWorkspaceResponse> {
  const { data } = await api.get<CourseWorkspaceResponse>(`/courses/${courseId}/workspace`);
  return normalizeCourseWorkspaceResponse(data);
}

function isValidCourseProject(p: CourseProjectWithTeams): boolean {
  return Number.isFinite(p.id) && p.id > 0 && typeof p.title === "string" && p.title.trim().length > 0;
}

function normalizeCourseWorkspaceResponse(raw: CourseWorkspaceResponse): CourseWorkspaceResponse {
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

export async function getCourseSections(courseId: number): Promise<CourseSection[]> {
  const { data } = await api.get<CourseSection[]>(`/courses/${courseId}/sections`);
  return Array.isArray(data) ? data : [];
}

export async function createCourseSection(
  courseId: number,
  payload: CreateCourseSectionPayload,
): Promise<CourseSection> {
  const { data } = await api.post<CourseSection>(`/courses/${courseId}/sections`, {
    name: payload.name.trim(),
    days: payload.days,
    timeFrom: payload.timeFrom.trim() || null,
    timeTo: payload.timeTo.trim() || null,
    capacity: payload.capacity,
  });
  return data;
}

export async function updateCourseSection(
  sectionId: number,
  payload: CreateCourseSectionPayload,
): Promise<CourseSection> {
  const { data } = await api.put<CourseSection>(`/courses/sections/${sectionId}`, {
    name: payload.name.trim(),
    days: payload.days,
    timeFrom: payload.timeFrom.trim() || null,
    timeTo: payload.timeTo.trim() || null,
    capacity: payload.capacity,
  });
  return data;
}

export async function deleteCourseSection(sectionId: number): Promise<void> {
  await api.delete(`/courses/sections/${sectionId}`);
}

export async function getCourseEnrolledStudents(courseId: number): Promise<CourseEnrolledStudent[]> {
  const { data } = await api.get<CourseEnrolledStudent[]>(`/courses/${courseId}/enrolled-students`);
  return Array.isArray(data) ? data : [];
}

export async function addStudentsToSection(
  sectionId: number,
  studentIds: string[],
): Promise<AddSectionStudentsResult> {
  const { data } = await api.post<AddSectionStudentsResult>(`/courses/sections/${sectionId}/students`, {
    studentIds,
  });
  return {
    added: data?.added ?? 0,
    notFound: data?.notFound ?? [],
    alreadyEnrolled: data?.alreadyEnrolled ?? [],
  };
}

export async function importStudentsToSection(
  sectionId: number,
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<ImportSectionStudentsResult> {
  const form = new FormData();
  form.append("file", file);

  const { data } = await api.post<ImportSectionStudentsResult>(
    `/courses/sections/${sectionId}/students/import`,
    form,
    {
      onUploadProgress: (event) => {
        if (!onUploadProgress) return;
        const total = event.total ?? event.loaded;
        if (total <= 0) return;
        onUploadProgress(Math.min(100, Math.round((event.loaded / total) * 100)));
      },
    },
  );

  return {
    parsedCount: data?.parsedCount ?? 0,
    added: data?.added ?? 0,
    addedStudents: data?.addedStudents ?? [],
    skipped: data?.skipped ?? [],
    invalidIds: data?.invalidIds ?? [],
  };
}

export async function removeStudentFromSection(
  sectionId: number,
  studentProfileId: number,
): Promise<void> {
  await api.delete(`/courses/sections/${sectionId}/students/${studentProfileId}`);
}

export async function moveStudentToSection(
  fromSectionId: number,
  studentProfileId: number,
  targetSectionId: number,
): Promise<CourseEnrolledStudent> {
  const { data } = await api.patch<CourseEnrolledStudent>(
    `/courses/sections/${fromSectionId}/students/${studentProfileId}/move`,
    { targetSectionId },
  );
  return data;
}

export async function getCourseProjects(courseId: number): Promise<CourseProject[]> {
  const { data } = await api.get<CourseProject[]>(`/courses/${courseId}/projects`);
  return Array.isArray(data) ? data : [];
}

export async function createCourseProject(
  courseId: number,
  payload: CreateCourseProjectPayload,
): Promise<CourseProject> {
  const { data } = await api.post<CourseProject>(`/courses/${courseId}/projects`, {
    title: payload.title.trim(),
    description: payload.description?.trim() ?? "",
    teamSize: payload.teamSize,
    applyToAllSections: payload.applyToAllSections,
    allowCrossSectionTeams: payload.allowCrossSectionTeams,
    aiMode: payload.aiMode,
    sectionIds: payload.sectionIds,
  });
  return data;
}

export async function updateCourseProject(
  projectId: number,
  payload: CreateCourseProjectPayload,
): Promise<CourseProject> {
  const { data } = await api.put<CourseProject>(`/courses/projects/${projectId}`, {
    title: payload.title.trim(),
    description: payload.description?.trim() ?? "",
    teamSize: payload.teamSize,
    applyToAllSections: payload.applyToAllSections,
    allowCrossSectionTeams: payload.allowCrossSectionTeams,
    aiMode: payload.aiMode,
    sectionIds: payload.sectionIds,
  });
  return data;
}

export async function deleteCourseProject(projectId: number): Promise<void> {
  await api.delete(`/courses/projects/${projectId}`);
}

export async function generateCourseProjectTeams(
  courseId: number,
  projectId: number,
): Promise<CourseProjectTeamsResponse> {
  const { data } = await api.post<CourseProjectTeamsResponse>(
    `/courses/${courseId}/projects/${projectId}/generate-teams`,
  );
  return data;
}

export async function previewCourseProjectTeams(
  courseId: number,
  projectId: number,
): Promise<CourseProjectTeamsResponse> {
  const { data } = await api.post<CourseProjectTeamsResponse>(
    `/courses/${courseId}/projects/${projectId}/preview-teams`,
  );
  return data;
}

export async function getCourseProjectById(
  courseId: number,
  projectId: number,
): Promise<CourseProject | null> {
  const projects = await getCourseProjects(courseId);
  return projects.find((p) => p.id === projectId) ?? null;
}

export async function getCourseProjectTeams(
  courseId: number,
  projectId: number,
): Promise<CourseProjectTeamsResponse> {
  const { data } = await api.get<CourseProjectTeamsResponse>(
    `/courses/${courseId}/projects/${projectId}/teams`,
  );
  return data;
}

export async function getCourseSectionsCount(courseId: number): Promise<number> {
  const sections = await getCourseSections(courseId);
  return sections.length;
}

export async function getCourseStudentsCount(courseId: number): Promise<number> {
  const students = await getCourseEnrolledStudents(courseId);
  return students.length;
}

export async function getCourseProjectsCount(courseId: number): Promise<number> {
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
