import { collaborationFormatLabel } from "@/constants/companyRequestCatalog";
import type {
  CompanyProjectRequestDetail,
  CompanyProjectRequestSummary,
  CompanyRequestLifecycleStatus,
  CompanyRequestType,
} from "@/api/companyApi";

export function requestTypeLabel(type: CompanyRequestType | string): string {
  return type === "individual" ? "Individual Contributor" : "AI-Built Team";
}

/** Project title for display — never surfaces generic request-type labels as the headline. */
export function getRequestProjectTitle(
  request: CompanyProjectRequestSummary | CompanyProjectRequestDetail,
): string {
  const trimmed = request.title?.trim();
  if (!trimmed) return "Untitled project request";
  const typeLabel = requestTypeLabel(request.requestType);
  if (trimmed === typeLabel) return "Untitled project request";
  return trimmed;
}

export function getRequestRoleSubtitle(
  request: CompanyProjectRequestSummary | CompanyProjectRequestDetail,
): string | null {
  const roles = getRequestRoleLabels(request);
  if (roles.length === 0) return null;
  return roles.join(" · ");
}

export function formatRequestDuration(request: {
  durationLabel?: string | null;
  durationOngoing?: boolean;
}): string {
  if (request.durationOngoing) return "Ongoing collaboration";
  if (request.durationLabel) return request.durationLabel;
  return "—";
}

export function getRequestRoleLabels(
  request: CompanyProjectRequestSummary | CompanyProjectRequestDetail,
): string[] {
  if (request.roleNames?.length) return request.roleNames;
  if ("roles" in request && request.roles?.length) {
    return request.roles.map((r) => r.roleName).filter(Boolean);
  }
  return [];
}

export function getRequestSkillLabels(
  request: CompanyProjectRequestSummary | CompanyProjectRequestDetail,
): string[] {
  if (request.skillNames?.length) return request.skillNames;
  if ("roles" in request && request.roles?.length) {
    const set = new Set<string>();
    request.roles.forEach((r) => r.skills.forEach((s) => set.add(s.skillName)));
    return [...set];
  }
  return [];
}

export function formatCollaborationLine(collaborationType: string): string {
  if (!collaborationType) return "";
  return collaborationFormatLabel(collaborationType);
}

export function getRequestLifecycleStatus(
  request: Pick<CompanyProjectRequestSummary | CompanyProjectRequestDetail, "requestStatus">,
): CompanyRequestLifecycleStatus {
  const value = (request.requestStatus ?? "active").toLowerCase();
  if (value === "paused" || value === "closed") return value;
  return "active";
}

export function isRequestViewOnly(status: CompanyRequestLifecycleStatus): boolean {
  return status === "paused" || status === "closed";
}

export function requestLifecycleStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "paused") return "Paused";
  if (s === "closed") return "Closed";
  return "Active";
}

export function requestLifecycleStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "paused") return "cw-status-paused";
  if (s === "closed") return "cw-status-closed";
  return "cw-status-active";
}

export function requestStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "submitted") return "Active";
  if (s === "archived") return "Archived";
  if (s === "draft") return "Draft";
  if (s === "matching") return "Matching";
  if (s === "matched") return "Matched";
  return status;
}

export function requestStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "archived") return "text-muted-foreground border-muted-foreground/30";
  if (s === "submitted") return "cw-status-active";
  if (s === "matching" || s === "matched") return "cw-status-primary";
  return "";
}

export function formatDraftSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
