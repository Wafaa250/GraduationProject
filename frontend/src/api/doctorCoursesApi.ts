import api from "./axiosInstance";

export type DoctorCourse = {
  courseId: number;
  name: string;
  code: string;
  semester: string | null;
  createdAt: string;
  doctorId: number;
  doctorName: string;
};

export type DoctorCourseWithStats = DoctorCourse & {
  sections: number;
  students: number;
  projects: number;
};

export async function getDoctorCourses(): Promise<DoctorCourse[]> {
  const { data } = await api.get<DoctorCourse[]>("/courses/my");
  return Array.isArray(data) ? data : [];
}

/** GET /api/courses/{courseId} */
export async function getDoctorCourseById(courseId: number): Promise<DoctorCourse> {
  const { data } = await api.get<DoctorCourse>(`/courses/${courseId}`);
  return data;
}

export async function getCourseSectionsCount(courseId: number): Promise<number> {
  const { data } = await api.get<unknown[]>(`/courses/${courseId}/sections`);
  return Array.isArray(data) ? data.length : 0;
}

export async function getCourseStudentsCount(courseId: number): Promise<number> {
  const { data } = await api.get<unknown[]>(`/courses/${courseId}/enrolled-students`);
  return Array.isArray(data) ? data.length : 0;
}

export async function getCourseProjectsCount(courseId: number): Promise<number> {
  const { data } = await api.get<unknown[]>(`/courses/${courseId}/projects`);
  return Array.isArray(data) ? data.length : 0;
}

/** Loads doctor courses with section/student/project counts from existing per-course endpoints. */
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
