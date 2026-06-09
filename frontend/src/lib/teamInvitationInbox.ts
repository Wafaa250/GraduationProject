import type { ReceivedProjectInvitation } from "@/api/invitationsApi";
import type { GraduationNotification } from "@/api/notificationsApi";
import type { TeamInvitationItem } from "@/api/studentCoursesApi";
import { isPendingInvitationStatus } from "@/lib/graduationInvitationResolver";

export type TeamInvitationKind = "course" | "graduation" | "future";

export type UnifiedTeamInvitation = {
  /** Stable list key, e.g. graduation:57 */
  id: string;
  rawId: string;
  kind: TeamInvitationKind;
  inviter: string;
  inviterInitials: string;
  team: string;
  project: string;
  status: string;
  actionable: boolean;
};

export type InvitationAuditRow = {
  invitationId: string;
  invitationType: TeamInvitationKind;
  apiReturned: "Yes" | "No";
  filteredOut: "Yes" | "No";
  reason: string;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function mapCourseTeamInvitations(items: TeamInvitationItem[]): UnifiedTeamInvitation[] {
  return items.map((inv) => ({
    id: `course:${inv.invitationId}`,
    rawId: String(inv.invitationId),
    kind: "course" as const,
    inviter: inv.senderName,
    inviterInitials: initials(inv.senderName),
    team: inv.senderSection || inv.courseName,
    project: inv.projectTitle,
    status: "pending",
    actionable: true,
  }));
}

/** Map all graduation invites returned by the API — no status filtering. */
export function mapGraduationTeamInvitations(
  items: ReceivedProjectInvitation[],
): UnifiedTeamInvitation[] {
  return items.map((inv) => {
    const pending = isPendingInvitationStatus(inv.status);
    return {
      id: `graduation:${inv.invitationId}`,
      rawId: String(inv.invitationId),
      kind: "graduation" as const,
      inviter: inv.senderName,
      inviterInitials: initials(inv.senderName),
      team: "Graduation project",
      project: inv.projectName,
      status: inv.status || "unknown",
      actionable: pending,
    };
  });
}

export function mergeTeamInvitationInbox(
  course: UnifiedTeamInvitation[],
  graduation: UnifiedTeamInvitation[],
  future: UnifiedTeamInvitation[] = [],
): UnifiedTeamInvitation[] {
  return [...graduation, ...course, ...future];
}

function graduationInviteIdFromNotification(n: GraduationNotification): string | null {
  const match = n.dedupKey?.match(/^gp:invite:(\d+):/);
  if (!match) return null;
  return match[1];
}

/** Compare notification rows to API payloads and dashboard display. Logs a trace table in dev. */
export function auditTeamInvitationInbox(input: {
  notifications: GraduationNotification[];
  courseFromApi: TeamInvitationItem[];
  courseAfterEligibleFilter: TeamInvitationItem[];
  gradFromApi: ReceivedProjectInvitation[];
  gradAfterPendingFilter: ReceivedProjectInvitation[];
  displayed: UnifiedTeamInvitation[];
}): InvitationAuditRow[] {
  const rows: InvitationAuditRow[] = [];

  const teamNotifications = input.notifications.filter(
    (n) =>
      (n.category === "graduation_project" &&
        n.eventType === "invitation_received" &&
        n.dedupKey?.startsWith("gp:invite:")) ||
      (n.category === "course" && n.eventType === "course_teammate_invitation_pending"),
  );

  for (const n of teamNotifications) {
    if (n.category === "graduation_project") {
      const inviteId = graduationInviteIdFromNotification(n);
      if (!inviteId) continue;

      const inApi = input.gradFromApi.some((g) => String(g.invitationId) === inviteId);
      const removedByPending = inApi &&
        !input.gradAfterPendingFilter.some((g) => String(g.invitationId) === inviteId);
      const inDisplay = input.displayed.some(
        (d) => d.kind === "graduation" && d.rawId === inviteId,
      );

      let filteredOut: "Yes" | "No" = "No";
      let reason = "Shown in Team Invitations";

      if (!inApi) {
        filteredOut = "Yes";
        reason = "Not returned by GET /invitations/received";
      } else if (removedByPending) {
        filteredOut = inDisplay ? "No" : "Yes";
        reason = inDisplay
          ? "Previously filtered by pending-only rule (now fixed)"
          : "Filtered by pending-only status rule in mapGraduationInvitations";
      } else if (!inDisplay) {
        filteredOut = "Yes";
        reason = "Missing from merged Team Invitations list";
      }

      rows.push({
        invitationId: inviteId,
        invitationType: "graduation",
        apiReturned: inApi ? "Yes" : "No",
        filteredOut,
        reason,
      });
      continue;
    }

    const inviteId = String(n.id);
    const inApi = input.courseFromApi.some((c) => String(c.invitationId) === inviteId);
    const removedByEligible =
      inApi &&
      !input.courseAfterEligibleFilter.some((c) => String(c.invitationId) === inviteId);
    const inDisplay = input.displayed.some(
      (d) => d.kind === "course" && d.rawId === inviteId,
    );

    let filteredOut: "Yes" | "No" = "No";
    let reason = "Shown in Team Invitations";

    if (!inApi) {
      filteredOut = "Yes";
      reason = "Not returned by GET /courses/team-invitations";
    } else if (removedByEligible) {
      filteredOut = inDisplay ? "No" : "Yes";
      reason = inDisplay
        ? "Previously filtered by getEligibleTeamInvitations (now fixed)"
        : "Filtered by getEligibleTeamInvitations section eligibility check";
    } else if (!inDisplay) {
      filteredOut = "Yes";
      reason = "Missing from merged Team Invitations list";
    }

    rows.push({
      invitationId: inviteId,
      invitationType: "course",
      apiReturned: inApi ? "Yes" : "No",
      filteredOut,
      reason,
    });
  }

  for (const inv of input.gradFromApi) {
    const id = String(inv.invitationId);
    if (rows.some((r) => r.invitationType === "graduation" && r.invitationId === id)) continue;
    const inDisplay = input.displayed.some(
      (d) => d.kind === "graduation" && d.rawId === id,
    );
    rows.push({
      invitationId: id,
      invitationType: "graduation",
      apiReturned: "Yes",
      filteredOut: inDisplay ? "No" : "Yes",
      reason: inDisplay ? "Shown in Team Invitations" : "No matching notification row",
    });
  }

  for (const inv of input.courseFromApi) {
    const id = String(inv.invitationId);
    if (rows.some((r) => r.invitationType === "course" && r.invitationId === id)) continue;
    const inDisplay = input.displayed.some((d) => d.kind === "course" && d.rawId === id);
    rows.push({
      invitationId: id,
      invitationType: "course",
      apiReturned: "Yes",
      filteredOut: inDisplay ? "No" : "Yes",
      reason: inDisplay ? "Shown in Team Invitations" : "No matching notification row",
    });
  }

  console.table(rows);
  console.info("[TeamInvitationInboxAudit]", {
    stage: "audit_complete",
    totalRows: rows.length,
    filteredCount: rows.filter((r) => r.filteredOut === "Yes").length,
    displayedCount: input.displayed.length,
  });

  return rows;
}

/** @deprecated Use isPendingInvitationStatus — kept for audit simulations. */
export function filterPendingGraduationInvitations(
  items: ReceivedProjectInvitation[],
): ReceivedProjectInvitation[] {
  return items.filter((inv) => isPendingInvitationStatus(inv.status));
}
