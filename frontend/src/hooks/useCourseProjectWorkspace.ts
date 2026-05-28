import { useCallback, useEffect, useState } from "react";
import {
  getCourseEnrolledStudents,
  getCourseProjectTeams,
  getCourseProjects,
  getCourseWorkspace,
} from "@/api/doctorCoursesApi";
import { projectAppliesToSection } from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import type {
  CourseProjectWorkspaceBundle,
  CourseProjectWorkspaceData,
} from "@/components/doctor/course-project-workspace/types";
import { parseApiErrorMessage } from "@/api/axiosInstance";

export function useCourseProjectWorkspace(
  courseId: number,
  sectionId: number,
  projectId: number,
) {
  const [pageLoading, setPageLoading] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(true);
  const [workspace, setWorkspace] = useState<CourseProjectWorkspaceData>({
    courseId: 0,
    courseName: "",
    sectionId: 0,
    sectionName: "",
    projectId: 0,
    projectTitle: "",
    teamSize: 0,
    teamCount: 0,
    aiMode: "doctor",
    loading: true,
  });
  const [bundle, setBundle] = useState<CourseProjectWorkspaceBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectMissing, setProjectMissing] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(courseId) || !Number.isFinite(sectionId) || !Number.isFinite(projectId)) {
      return;
    }

    setPageLoading(true);
    setBundleLoading(true);
    setError(null);
    setProjectMissing(false);
    setWorkspace((prev) => ({ ...prev, loading: true }));

    try {
      const [courseWorkspace, projects, teams, allStudents] = await Promise.all([
        getCourseWorkspace(courseId),
        getCourseProjects(courseId),
        getCourseProjectTeams(courseId, projectId),
        getCourseEnrolledStudents(courseId),
      ]);

      const section = courseWorkspace.sections.find((s) => s.id === sectionId);
      const project = projects.find((p) => p.id === projectId);

      if (!section || !project || !projectAppliesToSection(project, sectionId)) {
        setProjectMissing(true);
        setBundle(null);
        return;
      }

      const sectionIds = new Set<number>();
      if (project.applyToAllSections) {
        courseWorkspace.sections.forEach((s) => sectionIds.add(s.id));
      } else {
        project.sections.forEach((s) => sectionIds.add(s.sectionId));
      }

      const eligibleStudents = allStudents.filter(
        (s) => s.sectionId != null && sectionIds.has(s.sectionId),
      );

      setBundle({
        project,
        teams,
        eligibleStudents,
        allSections: courseWorkspace.sections,
      });

      setWorkspace({
        courseId,
        courseName: courseWorkspace.course.name,
        sectionId,
        sectionName: section.name,
        projectId,
        projectTitle: project.title,
        teamSize: project.teamSize,
        teamCount: teams.teamCount,
        aiMode: project.aiMode,
        loading: false,
      });
    } catch (err) {
      setError(parseApiErrorMessage(err));
      setBundle(null);
    } finally {
      setPageLoading(false);
      setBundleLoading(false);
      setWorkspace((prev) => ({ ...prev, loading: false }));
    }
  }, [courseId, sectionId, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    workspace,
    bundle,
    pageLoading,
    bundleLoading,
    error,
    projectMissing,
    reload: load,
  };
}
