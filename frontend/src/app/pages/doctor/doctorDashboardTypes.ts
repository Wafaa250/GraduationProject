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

export type DoctorDashboardSection = "overview" | "requests" | "projects" | "deleted";

export type RequestRow =
  | {
      kind: "supervision";
      requestId: number;
      projectName: string;
      studentName: string;
      status: string;
    }
  | {
      kind: "cancellation";
      requestId: number;
      projectName: string;
      studentName: string;
      status: string;
    };
