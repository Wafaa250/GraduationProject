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
      .map((r) => ({
        kind: "supervision" as const,
        requestId: r.requestId,
        projectName: r.project?.name ?? "",
        studentName: r.sender?.name ?? "",
        status: r.status,
      })),
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
