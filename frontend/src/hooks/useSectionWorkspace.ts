import { useMemo } from "react";
import {
  filterProjectsForSection,
  filterStudentsForSection,
  filterTeamsForSection,
} from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import type { SectionWorkspaceData } from "@/components/doctor/course-workspace/types";
import type { CourseWorkspaceBundle } from "@/hooks/useCourseWorkspace";
import { useCourseWorkspace } from "@/hooks/useCourseWorkspace";

export type SectionWorkspaceBundle = {
  section: CourseWorkspaceBundle["sections"][number];
  students: CourseWorkspaceBundle["students"];
  courseProjects: CourseWorkspaceBundle["courseProjects"];
  teams: CourseWorkspaceBundle["teams"];
  /** All course sections (e.g. move student between sections). */
  allSections: CourseWorkspaceBundle["sections"];
};

export function useSectionWorkspace(courseId: number, sectionId: number) {
  const workspace = useCourseWorkspace(courseId);

  const sectionBundle = useMemo((): SectionWorkspaceBundle | null => {
    if (!workspace.bundle) return null;
    const section = workspace.bundle.sections.find((s) => s.id === sectionId);
    if (!section) return null;

    const courseProjects = filterProjectsForSection(workspace.bundle.courseProjects, sectionId);
    const projectIds = new Set(courseProjects.map((p) => p.id));
    const students = filterStudentsForSection(workspace.bundle.students, sectionId);
    const teams = filterTeamsForSection(workspace.bundle.teams, projectIds);

    return {
      section,
      students,
      courseProjects,
      teams,
      allSections: workspace.bundle.sections,
    };
  }, [workspace.bundle, sectionId]);

  const sectionMeta = useMemo((): SectionWorkspaceData | null => {
    if (!sectionBundle || !workspace.course.courseId) return null;
    return {
      courseId: workspace.course.courseId,
      courseName: workspace.course.name,
      courseCode: workspace.course.code,
      sectionId: sectionBundle.section.id,
      sectionName: sectionBundle.section.name,
      schedule: sectionBundle.section,
      capacity: sectionBundle.section.capacity,
      students: sectionBundle.students.length,
      projects: sectionBundle.courseProjects.length,
      loading: workspace.course.loading,
    };
  }, [sectionBundle, workspace.course]);

  const sectionMissing =
    !workspace.pageLoading && !workspace.bundleLoading && workspace.bundle != null && sectionBundle == null;

  return {
    ...workspace,
    section: sectionMeta,
    sectionBundle,
    sectionMissing,
  };
}
