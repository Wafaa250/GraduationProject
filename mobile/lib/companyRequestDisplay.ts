import type {
  CompanyProjectRequestDetail,
  CompanyProjectRequestSummary,
  CompanyRequestLifecycleStatus,
} from "@/api/companyApi";
import { collaborationFormatLabel } from "@/lib/collaborationFormat";

export function requestTypeLabel(type: string): string {
  return type === "individual" ? "Individual Contributor" : "AI-Built Team";
}

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

export function requestLifecycleStatusColors(status: string): {
  bg: "successMuted" | "pausedMuted" | "closedMuted";
  text: "success" | "paused" | "closed";
} {
  const s = status.toLowerCase();
  if (s === "paused") return { bg: "pausedMuted", text: "paused" };
  if (s === "closed") return { bg: "closedMuted", text: "closed" };
  return { bg: "successMuted", text: "success" };
}

export function canPublishRequest(
  request: Pick<
    CompanyProjectRequestSummary | CompanyProjectRequestDetail,
    "status" | "requestStatus" | "isPublishedToHub"
  >,
): boolean {
  const lifecycle = getRequestLifecycleStatus(request);
  return request.status !== "draft" && lifecycle === "active" && !(request.isPublishedToHub ?? false);
}

export function canUnpublishRequest(
  request: Pick<CompanyProjectRequestSummary | CompanyProjectRequestDetail, "isPublishedToHub">,
): boolean {
  return request.isPublishedToHub ?? false;
}

export function requestHubVisibilityLabel(
  request: Pick<
    CompanyProjectRequestSummary | CompanyProjectRequestDetail,
    "status" | "requestStatus" | "isPublishedToHub"
  >,
): string {
  if (request.status === "draft") return "Draft";
  const lifecycle = getRequestLifecycleStatus(request);
  if (lifecycle === "closed") return "Closed";
  if (lifecycle === "paused") return "Paused";
  return (request.isPublishedToHub ?? false) ? "Published" : "Active";
}

export function requestHubVisibilityColors(
  request: Pick<
    CompanyProjectRequestSummary | CompanyProjectRequestDetail,
    "status" | "requestStatus" | "isPublishedToHub"
  >,
): { bg: "accentSoft" | "successMuted" | "pausedMuted" | "closedMuted"; text: "accent" | "success" | "paused" | "closed" | "muted" } {
  const label = requestHubVisibilityLabel(request);
  if (label === "Published") return { bg: "accentSoft", text: "accent" };
  if (label === "Closed") return { bg: "closedMuted", text: "closed" };
  if (label === "Paused") return { bg: "pausedMuted", text: "paused" };
  if (label === "Draft") return { bg: "closedMuted", text: "muted" };
  return { bg: "successMuted", text: "success" };
}

export function formatRequestDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function countRequestStatuses(requests: CompanyProjectRequestSummary[]) {
  let active = 0;
  let paused = 0;
  let closed = 0;
  for (const r of requests) {
    const s = getRequestLifecycleStatus(r);
    if (s === "paused") paused += 1;
    else if (s === "closed") closed += 1;
    else active += 1;
  }
  return { total: requests.length, active, paused, closed };
}

export function formatDraftSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
