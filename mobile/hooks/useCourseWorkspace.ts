import { useCallback, useEffect, useState } from "react";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getCourseWorkspace,
  type CourseEnrolledStudent,
  type CourseProjectWithTeams,
  type CourseSectionWorkspace,
  type CourseWorkspaceTeam,
} from "@/api/doctorCoursesApi";

export type CourseSectionView = CourseSectionWorkspace;

export type CourseTeamView = {
  courseProjectId: number;
  courseProjectTitle: string;
  team: {
    teamId: number;
    teamIndex: number;
    memberCount: number;
    members: CourseWorkspaceTeam["members"];
  };
};

export type CourseWorkspaceBundle = {
  sections: CourseSectionView[];
  students: CourseEnrolledStudent[];
  courseProjects: CourseProjectWithTeams[];
  teams: CourseTeamView[];
};

export type CourseWorkspaceData = {
  courseId: number;
  name: string;
  code: string;
  semester: string | null;
  sections: number;
  students: number;
  projects: number;
  loading: boolean;
};

export function useCourseWorkspace(courseId: number) {
  const [pageLoading, setPageLoading] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(true);
  const [course, setCourse] = useState<CourseWorkspaceData>({
    courseId: 0,
    name: "",
    code: "",
    semester: null,
    sections: 0,
    students: 0,
    projects: 0,
    loading: true,
  });
  const [bundle, setBundle] = useState<CourseWorkspaceBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(courseId)) return;
    setPageLoading(true);
    setBundleLoading(true);
    setError(null);
    setCourse((prev) => ({ ...prev, loading: true }));

    try {
      const workspace = await getCourseWorkspace(courseId);
      const header = workspace.course;

      const teams: CourseTeamView[] = workspace.teams.map((entry) => ({
        courseProjectId: entry.courseProjectId,
        courseProjectTitle: entry.courseProjectTitle,
        team: {
          teamId: entry.teamId,
          teamIndex: entry.teamIndex,
          memberCount: entry.memberCount,
          members: entry.members,
        },
      }));

      setBundle({
        sections: workspace.sections,
        students: workspace.students,
        courseProjects: workspace.courseProjects,
        teams,
      });

      setCourse({
        courseId,
        name: header.name,
        code: header.code,
        semester: header.semester,
        sections: workspace.stats.sections,
        students: workspace.stats.students,
        projects: workspace.stats.courseProjectCount,
        loading: false,
      });
    } catch (err) {
      setError(parseApiErrorMessage(err));
      setBundle(null);
    } finally {
      setPageLoading(false);
      setBundleLoading(false);
      setCourse((prev) => ({ ...prev, loading: false }));
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    course,
    bundle,
    pageLoading,
    bundleLoading,
    error,
    reload: load,
  };
}
