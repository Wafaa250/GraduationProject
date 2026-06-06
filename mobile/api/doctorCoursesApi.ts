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
  sections: { sectionId: number; sectionName: string }[];
};

export async function getDoctorCourses(): Promise<DoctorCourse[]> {
  const { data } = await api.get<DoctorCourse[]>("/courses/my");
  return Array.isArray(data) ? data : [];
}

async function getCourseSections(courseId: number): Promise<CourseSection[]> {
  const { data } = await api.get<CourseSection[]>(`/courses/${courseId}/sections`);
  return Array.isArray(data) ? data : [];
}

async function getCourseEnrolledStudents(courseId: number): Promise<CourseEnrolledStudent[]> {
  const { data } = await api.get<CourseEnrolledStudent[]>(`/courses/${courseId}/enrolled-students`);
  return Array.isArray(data) ? data : [];
}

async function getCourseProjects(courseId: number): Promise<CourseProject[]> {
  const { data } = await api.get<CourseProject[]>(`/courses/${courseId}/projects`);
  return Array.isArray(data) ? data : [];
}

async function getCourseSectionsCount(courseId: number): Promise<number> {
  const sections = await getCourseSections(courseId);
  return sections.length;
}

async function getCourseStudentsCount(courseId: number): Promise<number> {
  const students = await getCourseEnrolledStudents(courseId);
  return students.length;
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
