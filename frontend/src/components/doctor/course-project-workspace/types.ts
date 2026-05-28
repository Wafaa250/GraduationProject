import type {
  CourseEnrolledStudent,
  CourseProject,
  CourseProjectTeamsResponse,
  CourseSectionWorkspace,
} from "@/api/doctorCoursesApi";

export type CourseProjectWorkspaceData = {
  courseId: number;
  courseName: string;
  sectionId: number;
  sectionName: string;
  projectId: number;
  projectTitle: string;
  teamSize: number;
  teamCount: number;
  aiMode: string;
  loading: boolean;
};

export type CourseProjectWorkspaceBundle = {
  project: CourseProject;
  teams: CourseProjectTeamsResponse | null;
  eligibleStudents: CourseEnrolledStudent[];
  allSections: CourseSectionWorkspace[];
};

export type CourseProjectWorkspacePanelProps = {
  workspace: CourseProjectWorkspaceData;
  bundle: CourseProjectWorkspaceBundle | null;
  bundleLoading: boolean;
  onReload: () => void;
};
