/** Section row passed into the create-project flow via router location state (no API). */
export type CourseWorkspaceSectionOption = {
  id: string;
  name: string;
};

/** Payload returned to the course workspace after creating a project (local only). */
export type NewWorkspaceProjectPayload = {
  title: string;
  abstract: string;
  teamSize: number;
  duration: string;
  sectionLabel: string;
  aiMode: "doctor" | "student";
};

export type CourseProjectCreateLocationState = {
  sections?: CourseWorkspaceSectionOption[];
};

export type CourseWorkspaceLocationState = {
  newProject?: NewWorkspaceProjectPayload;
  /** Dedupes strict-mode double effect when merging a newly created project. */
  importNonce?: number;
  /** Optional header labels (merged into sessionStorage; no API). */
  courseName?: string;
  courseCode?: string;
};
