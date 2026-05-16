import type {
  SupervisorCancelRequestItem,
  SupervisorRequest,
} from "../../../api/supervisorApi";
import type { RequestRow } from "./doctorDashboardTypes";

export function isPendingRequestStatus(status: string): boolean {
  return status?.toLowerCase() === "pending";
}

export function supervisionRequestLabel(kind: RequestRow["kind"]): string {
  return kind === "supervision"
    ? "Supervision request"
    : "Cancellation request";
}

/**
 * Inbox rows: only **pending** items. Accepted/rejected supervision and cancellation
 * requests must not stay in the inbox (they belong in history / My Projects).
 */
export function mergeDoctorRequestRows(
  supervisionRequests: SupervisorRequest[],
  cancelRequests: SupervisorCancelRequestItem[],
): RequestRow[] {
  return [
    ...supervisionRequests
      .filter((r) => isPendingRequestStatus(r.status))
      .map((r) => {
        const p = r.project;
        const teamMembers = (p?.members ?? []).map((m) => ({
          studentId: m.studentId,
          name: m.name ?? "",
          role: m.role ?? "member",
          major: m.major ?? "",
        }));
        return {
          kind: "supervision" as const,
          requestId: r.requestId,
          projectId: p?.projectId ?? 0,
          projectName: p?.name ?? "",
          studentName: r.sender?.name ?? "",
          status: r.status,
          projectAbstract: p?.description ?? null,
          requiredSkills: Array.isArray(p?.requiredSkills) ? p.requiredSkills : [],
          projectType: p?.projectType ?? "GP",
          partnersCount: typeof p?.partnersCount === "number" ? p.partnersCount : 0,
          memberCount: typeof p?.memberCount === "number" ? p.memberCount : teamMembers.length,
          teamMembers,
        };
      }),
    ...cancelRequests
      .filter((r) => isPendingRequestStatus(r.status))
      .map((r) => ({
        kind: "cancellation" as const,
        requestId: r.requestId,
        projectName: r.projectName,
        studentName: r.studentName,
        status: r.status,
      })),
  ].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "supervision" ? -1 : 1;
    return b.requestId - a.requestId;
  });
}
