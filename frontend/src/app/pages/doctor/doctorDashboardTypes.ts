// ─── GET /api/me (doctor) ───────────────────────────────────────────────────
export interface DoctorMeResponse {
  role: string;
  profileId: number;
  name: string;
  email: string;
  specialization?: string | null;
}

// ─── GET /api/doctors/me/supervised-projects ─────────────────────────────────
export interface DoctorSupervisedProject {
  projectId: number;
  name: string;
  /** Prefer for display: `abstract ?? description` */
  abstract?: string | null;
  description: string | null;
  requiredSkills: string[];
  partnersCount: number;
  memberCount: number;
  isFull: boolean;
  owner: {
    studentId: number;
    userId: number;
    name: string;
    university: string;
    major: string;
  };
  createdAt: string;
}

// ─── GET /api/doctors/me/dashboard-summary ───────────────────────────────────
export interface DoctorDashboardSummary {
  pendingRequestsCount: number;
  supervisedCount: number;
  pendingCancelCount: number;
}

export type DoctorDashboardSection =
  | "overview"
  | "requests"
  | "projects"
  | "deleted"
  | "courses";

export type RequestRowSupervisionTeamMember = {
  studentId: number;
  name: string;
  role: string;
  major: string;
};

export type RequestRow =
  | {
      kind: "supervision";
      requestId: number;
      projectId: number;
      projectName: string;
      studentName: string;
      status: string;
      /** Abstract / idea */
      projectAbstract: string | null;
      requiredSkills: string[];
      projectType: string;
      partnersCount: number;
      memberCount: number;
      teamMembers: RequestRowSupervisionTeamMember[];
    }
  | {
      kind: "cancellation";
      requestId: number;
      projectName: string;
      studentName: string;
      status: string;
    };

/** Local-only course row merged into My Courses for UI testing (no API). */
export type DoctorUiTestCourse = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  semester: string | null;
  useSharedProjectAcrossSections: boolean;
  allowCrossSectionTeams: boolean;
};
