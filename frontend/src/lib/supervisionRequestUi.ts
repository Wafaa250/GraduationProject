import type { DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import { formatDoctorHubDate, initialsFromName } from "@/lib/doctorHubMappers";

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-primary to-primary-deep",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
] as const;

export function avatarGradientClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return `bg-gradient-to-br ${AVATAR_GRADIENTS[hash]}`;
}

export type SupervisionRequestStatus = "pending" | "accepted" | "rejected";

export function normalizeSupervisionStatus(status: string): SupervisionRequestStatus {
  const s = status.toLowerCase();
  if (s === "accepted" || s === "rejected") return s;
  return "pending";
}

const STATUS_UI: Record<
  SupervisionRequestStatus,
  { dot: string; label: string; cls: string }
> = {
  pending: {
    dot: "bg-warning",
    label: "Pending review",
    cls: "bg-warning/10 text-warning border-warning/20",
  },
  accepted: {
    dot: "bg-success",
    label: "Accepted",
    cls: "bg-success/10 text-success border-success/20",
  },
  rejected: {
    dot: "bg-danger",
    label: "Rejected",
    cls: "bg-danger/10 text-danger border-danger/25",
  },
};

export function supervisionStatusUi(status: string) {
  return STATUS_UI[normalizeSupervisionStatus(status)];
}

export function formatSupervisionSubmittedDate(iso: string): string {
  return formatDoctorHubDate(iso);
}

import { projectTypeLabel as resolveGraduationTypeLabel } from "@/lib/graduationProjectTypes";

export function formatProjectTypeLabel(
  projectType: string,
  faculty?: string | null,
  major?: string | null,
): string {
  return resolveGraduationTypeLabel(projectType, faculty, major);
}

export function teamSizeLabel(request: DoctorSupervisorRequest): number {
  return request.project.partnersCount > 0
    ? request.project.partnersCount
    : request.project.memberCount;
}

export function studentInitials(request: DoctorSupervisorRequest): string {
  return request.sender.initials?.trim() || initialsFromName(request.sender.name || "?");
}

export function aiMatchSummary(request: DoctorSupervisorRequest): string {
  const matches = request.aiCompatibility?.matches ?? [];
  if (matches.length === 0) return "No skill overlap detected";
  return matches.join(" · ");
}

export function filterSupervisionRequestsByTab(
  requests: DoctorSupervisorRequest[],
  tab: "all" | SupervisionRequestStatus,
): DoctorSupervisorRequest[] {
  if (tab === "all") return requests;
  return requests.filter((r) => normalizeSupervisionStatus(r.status) === tab);
}

export function supervisionTabCounts(requests: DoctorSupervisorRequest[]) {
  return {
    all: requests.length,
    pending: requests.filter((r) => normalizeSupervisionStatus(r.status) === "pending").length,
    accepted: requests.filter((r) => normalizeSupervisionStatus(r.status) === "accepted").length,
    rejected: requests.filter((r) => normalizeSupervisionStatus(r.status) === "rejected").length,
  };
}
