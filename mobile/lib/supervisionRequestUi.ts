import type { DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import { formatDoctorHubDate, initialsFromName } from "@/lib/doctorHubMappers";
import { projectTypeLabel } from "@/lib/graduationProjectTypes";

export type SupervisionRequestStatus = "pending" | "accepted" | "rejected";

export type SupervisionRequestTab = "all" | SupervisionRequestStatus;

export type SupervisionRequestSort = "newest" | "oldest" | "compatibility" | "student";

export function normalizeSupervisionStatus(status: string): SupervisionRequestStatus {
  const s = status.toLowerCase();
  if (s === "accepted" || s === "rejected") return s;
  return "pending";
}

const STATUS_UI: Record<
  SupervisionRequestStatus,
  { dot: string; label: string; bg: string; text: string; border: string }
> = {
  pending: {
    dot: "#F59E0B",
    label: "Pending review",
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#D97706",
    border: "rgba(245, 158, 11, 0.25)",
  },
  accepted: {
    dot: "#10B981",
    label: "Accepted",
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#059669",
    border: "rgba(16, 185, 129, 0.25)",
  },
  rejected: {
    dot: "#EF4444",
    label: "Rejected",
    bg: "rgba(239, 68, 68, 0.1)",
    text: "#DC2626",
    border: "rgba(239, 68, 68, 0.22)",
  },
};

export function supervisionStatusUi(status: string) {
  return STATUS_UI[normalizeSupervisionStatus(status)];
}

export function formatSupervisionSubmittedDate(iso: string): string {
  return formatDoctorHubDate(iso);
}

export function formatProjectTypeLabel(
  projectType: string,
  faculty?: string | null,
  major?: string | null,
): string {
  return projectTypeLabel(projectType, faculty, major);
}

export function teamSizeLabel(request: DoctorSupervisorRequest): number {
  return request.project.partnersCount > 0
    ? request.project.partnersCount
    : request.project.memberCount;
}

export function studentInitials(request: DoctorSupervisorRequest): string {
  return request.sender.initials?.trim() || initialsFromName(request.sender.name || "?");
}

export function requestCodeLabel(request: DoctorSupervisorRequest): string {
  return request.requestCode ?? `REQ-${String(request.requestId).padStart(5, "0")}`;
}

export function aiMatchSummary(request: DoctorSupervisorRequest): string {
  const matches = request.aiCompatibility?.matches ?? [];
  if (matches.length === 0) return "No skill overlap detected";
  return matches.join(" · ");
}

export function aiMatchScore(request: DoctorSupervisorRequest): number {
  return request.aiCompatibility?.score ?? 0;
}

export function filterSupervisionRequestsByTab(
  requests: DoctorSupervisorRequest[],
  tab: SupervisionRequestTab,
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

export function sortSupervisionRequests(
  requests: DoctorSupervisorRequest[],
  sort: SupervisionRequestSort,
): DoctorSupervisorRequest[] {
  const copy = [...requests];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "compatibility":
      return copy.sort((a, b) => aiMatchScore(b) - aiMatchScore(a));
    case "student":
      return copy.sort((a, b) =>
        (a.sender.name || "").localeCompare(b.sender.name || "", undefined, { sensitivity: "base" }),
      );
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function searchSupervisionRequests(
  requests: DoctorSupervisorRequest[],
  query: string,
): DoctorSupervisorRequest[] {
  const q = query.trim().toLowerCase();
  if (!q) return requests;

  return requests.filter((r) => {
    const haystack = [
      r.sender.name,
      r.sender.major,
      r.sender.university,
      r.sender.faculty,
      r.sender.academicYear,
      r.project.name,
      r.project.description,
      requestCodeLabel(r),
      ...(r.project.requiredSkills ?? []),
      ...(r.project.preferredRoles ?? []),
      ...(r.project.technologies ?? []),
      ...(r.aiCompatibility?.matches ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export const SORT_OPTIONS: { id: SupervisionRequestSort; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "compatibility", label: "Highest match" },
  { id: "student", label: "Student name" },
];

export const STATUS_TABS: { id: SupervisionRequestTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];
