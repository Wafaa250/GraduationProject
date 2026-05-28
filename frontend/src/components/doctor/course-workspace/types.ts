import type { CourseWorkspaceBundle } from "@/hooks/useCourseWorkspace";
import type { SectionWorkspaceBundle } from "@/hooks/useSectionWorkspace";

export type OverviewMetricState = "loading" | "value" | "empty" | "unavailable";

export type CourseWorkspaceData = {
  courseId: number;
  name: string;
  code: string;
  semester: string | null;
  sections: number;
  students: number;
  /** Course team-formation projects */
  projects: number;
  loading: boolean;
};

export type CourseWorkspacePanelProps = {
  course: CourseWorkspaceData;
  bundle: CourseWorkspaceBundle | null;
  bundleLoading: boolean;
  onReload: () => void;
};

export type SectionWorkspaceData = {
  courseId: number;
  courseName: string;
  courseCode: string;
  sectionId: number;
  sectionName: string;
  schedule: {
    days: string[];
    timeFrom: string | null;
    timeTo: string | null;
  };
  capacity: number;
  students: number;
  projects: number;
  loading: boolean;
};

export type SectionWorkspacePanelProps = {
  section: SectionWorkspaceData;
  bundle: SectionWorkspaceBundle | null;
  bundleLoading: boolean;
  onReload: () => void;
};
