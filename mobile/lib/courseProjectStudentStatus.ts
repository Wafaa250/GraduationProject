export type ProjectStudentTeamStatus = "in-team" | "available" | "pending-invite" | "not-available";

export type ProjectStudentStatusMeta = {
  status: ProjectStudentTeamStatus;
  label: string;
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
