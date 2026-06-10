import type {
  DoctorSupervisorCancelRequest,
  DoctorSupervisorRequest,
} from "@/api/doctorDashboardApi";

export type DoctorRequestInboxKind = "supervision" | "cancellation";

export type DoctorRequestInboxRow = {
  kind: DoctorRequestInboxKind;
  requestId: number;
  projectName: string;
  studentName: string;
  status: string;
};

export function isPendingRequestStatus(status: string): boolean {
  return status?.toLowerCase() === "pending";
}

export function supervisionRequestLabel(kind: DoctorRequestInboxKind): string {
  return kind === "supervision" ? "Supervision request" : "Cancellation request";
}

/**
 * Pending inbox rows: only pending supervision and cancellation requests.
 * Supervision rows sort before cancellation; then by requestId descending.
 */
export function mergeDoctorRequestRows(
  supervisionRequests: DoctorSupervisorRequest[],
  cancelRequests: DoctorSupervisorCancelRequest[],
): DoctorRequestInboxRow[] {
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

export function inboxActionKey(
  kind: DoctorRequestInboxKind,
  requestId: number,
  action: "accept" | "reject",
): string {
  const prefix = kind === "supervision" ? "sup" : "can";
  return `${prefix}-${requestId}-${action}`;
}

export function filterCancelRequestsByTab(
  requests: DoctorSupervisorCancelRequest[],
  tab: "all" | "pending" | "accepted" | "rejected",
): DoctorSupervisorCancelRequest[] {
  if (tab === "all") return requests;
  return requests.filter((r) => {
    const status = r.status.toLowerCase();
    if (tab === "pending") return status === "pending";
    if (tab === "accepted") return status === "accepted";
    if (tab === "rejected") return status === "rejected";
    return false;
  });
}

export function cancelRequestTabCounts(requests: DoctorSupervisorCancelRequest[]) {
  return {
    all: requests.length,
    pending: requests.filter((r) => isPendingRequestStatus(r.status)).length,
    accepted: requests.filter((r) => r.status.toLowerCase() === "accepted").length,
    rejected: requests.filter((r) => r.status.toLowerCase() === "rejected").length,
  };
}
