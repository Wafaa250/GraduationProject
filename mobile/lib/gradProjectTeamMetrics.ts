import type { GradProject } from "@/api/gradProjectApi";

/** Team occupancy helpers aligned with web GraduationProjectWorkspacePage. */
export function getGradProjectTeamMetrics(
  project: Pick<GradProject, "partnersCount" | "currentMembers" | "remainingSeats">,
): {
  desiredSize: number;
  currentMembers: number;
  seatsLeft: number;
} {
  const desiredSize = project.partnersCount ?? 0;
  const currentMembers = project.currentMembers ?? 0;
  const seatsLeft =
    project.remainingSeats ?? Math.max(0, desiredSize - currentMembers);
  return { desiredSize, currentMembers, seatsLeft };
}
