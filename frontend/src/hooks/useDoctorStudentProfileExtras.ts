import { useEffect, useState } from "react";
import { getDoctorCourses, getCourseWorkspace } from "@/api/doctorCoursesApi";
import { getGraduationProjectsForStudent } from "@/api/studentProfileApi";
import type { GradProject } from "@/api/gradProjectApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";

export type DoctorStudentCourseTeam = {
  courseId: number;
  courseName: string;
  courseCode: string;
  sectionId: number;
  projectId: number;
  projectTitle: string;
  teamId: number;
  teamIndex: number;
  teamLabel: string;
};

export type DoctorStudentProfileExtras = {
  graduationProjects: GradProject[];
  courseTeams: DoctorStudentCourseTeam[];
  enrollmentCount: number;
  loading: boolean;
  error: string | null;
};

export function useDoctorStudentProfileExtras(
  profileId: number | null,
  userId: number | null,
): DoctorStudentProfileExtras {
  const [graduationProjects, setGraduationProjects] = useState<GradProject[]>([]);
  const [courseTeams, setCourseTeams] = useState<DoctorStudentCourseTeam[]>([]);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId || !userId) {
      setGraduationProjects([]);
      setCourseTeams([]);
      setEnrollmentCount(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const [projects, courses] = await Promise.all([
          getGraduationProjectsForStudent(profileId).catch(() => [] as GradProject[]),
          getDoctorCourses(),
        ]);

        const workspaces = await Promise.all(
          courses.map((c) => getCourseWorkspace(c.courseId).catch(() => null)),
        );

        const teams: DoctorStudentCourseTeam[] = [];
        const enrolledCourseIds = new Set<number>();

        workspaces.forEach((ws, index) => {
          if (!ws) return;
          const course = courses[index];
          const isEnrolled = ws.students.some(
            (s) => s.userId === userId || s.studentId === profileId,
          );
          if (isEnrolled) enrolledCourseIds.add(course.courseId);

          for (const team of ws.teams) {
            const isMember = team.members.some(
              (m) => m.userId === userId || m.studentId === profileId,
            );
            if (!isMember) continue;

            const project = ws.courseProjects.find((p) => p.id === team.courseProjectId);
            const enrolled = ws.students.find(
              (s) => s.userId === userId || s.studentId === profileId,
            );
            const sectionId =
              enrolled?.sectionId ??
              project?.sections[0]?.sectionId ??
              ws.sections[0]?.id;
            if (sectionId == null) continue;

            teams.push({
              courseId: course.courseId,
              courseName: course.name,
              courseCode: course.code,
              sectionId,
              projectId: team.courseProjectId,
              projectTitle: team.courseProjectTitle,
              teamId: team.teamId,
              teamIndex: team.teamIndex,
              teamLabel: `Team ${team.teamIndex + 1}`,
            });
          }
        });

        if (!cancelled) {
          setGraduationProjects(projects);
          setCourseTeams(
            teams.sort((a, b) => a.courseName.localeCompare(b.courseName)),
          );
          setEnrollmentCount(enrolledCourseIds.size);
        }
      } catch (err) {
        if (!cancelled) setError(parseApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId, userId]);

  return { graduationProjects, courseTeams, enrollmentCount, loading, error };
}
