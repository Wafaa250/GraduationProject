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

export function mergeDoctorRequestRows(
  supervisionRequests: SupervisorRequest[],
  cancelRequests: SupervisorCancelRequestItem[],
): RequestRow[] {
  return [
    ...supervisionRequests.map((r) => ({
      kind: "supervision" as const,
      requestId: r.requestId,
      projectName: r.project?.name ?? "",
      studentName: r.sender?.name ?? "",
      status: r.status,
    })),
    ...cancelRequests.map((r) => ({
      kind: "cancellation" as const,
      requestId: r.requestId,
      projectName: r.projectName,
      studentName: r.studentName,
      status: r.status,
    })),
  ].sort((a, b) => {
    const pa = isPendingRequestStatus(a.status) ? 0 : 1;
    const pb = isPendingRequestStatus(b.status) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (a.kind !== b.kind) return a.kind === "supervision" ? -1 : 1;
    return b.requestId - a.requestId;
  });
}
