export type ProjectStudentTeamStatus =
  | "in-team"
  | "available"
  | "pending-invite"
  | "not-available";

export type ProjectStudentStatusMeta = {
  status: ProjectStudentTeamStatus;
  label: string;
  detail?: string;
};

export function getProjectStudentTeamStatus(input: {
  isOnProjectTeam: boolean;
  aiMode: string;
  teamCount: number;
  hasOpenTeamSlot?: boolean;
}): ProjectStudentStatusMeta {
  if (input.isOnProjectTeam) {
    return { status: "in-team", label: "In team" };
  }

  const studentLed = input.aiMode.trim().toLowerCase() === "student";

  if (studentLed) {
    if (input.hasOpenTeamSlot ?? true) {
      return { status: "available", label: "Available" };
    }
    return { status: "not-available", label: "Not available" };
  }

  if (input.teamCount === 0) {
    return { status: "available", label: "Available" };
  }

  return { status: "not-available", label: "Not assigned" };
}

export const PROJECT_STUDENT_STATUS_CLASS: Record<ProjectStudentTeamStatus, string> = {
  available: "cpw-student-status cpw-student-status--available",
  "pending-invite": "cpw-student-status cpw-student-status--pending",
  "in-team": "cpw-student-status cpw-student-status--in-team",
  "not-available": "cpw-student-status cpw-student-status--muted",
};
