import { getReceivedProjectInvitations, type ReceivedProjectInvitation } from "@/api/invitationsApi";
import type { GraduationNotification } from "@/api/notificationsApi";
import {
  parseInvitationNotification,
  type ParsedInvitationNotification,
} from "@/lib/notificationInvitationRouting";
import { studentGraduationInvitationPath } from "@/routes/paths";

function idFromDedup(dedupKey: string | null | undefined, pattern: RegExp): number | null {
  if (!dedupKey) return null;
  const match = dedupKey.match(pattern);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function isPendingInvitationStatus(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "pending";
}

/** Extract ProjectInvitation.Id from a graduation team notification payload. */
export function extractGraduationInvitationId(
  n: GraduationNotification,
  parsed: ParsedInvitationNotification = parseInvitationNotification(n),
): number | null {
  const fromParsed = parsed.invitationId;
  if (fromParsed != null && fromParsed > 0) return fromParsed;

  const fromDedup =
    idFromDedup(n.dedupKey, /^gp:invite:(\d+):/) ??
    idFromDedup(n.dedupKey, /^gp:invite:(\d+)$/);

  return fromDedup;
}

/**
 * When dedupKey is missing/stale, resolve ProjectInvitation.Id from GET /invitations/received.
 * Matches by notification.projectId first, then single pending invite fallback.
 */
export async function lookupGraduationInvitationIdFromInbox(
  n: GraduationNotification,
): Promise<{ invitationId: number | null; pendingRows: ReceivedProjectInvitation[] }> {
  const rows = await getReceivedProjectInvitations();
  const pending = rows.filter((row) => isPendingInvitationStatus(row.status));

  if (n.projectId != null && Number.isFinite(n.projectId)) {
    const byProject =
      pending.find((row) => row.projectId === n.projectId) ??
      rows.find((row) => row.projectId === n.projectId);
    if (byProject) {
      return { invitationId: byProject.invitationId, pendingRows: pending };
    }
  }

  if (pending.length === 1) {
    return { invitationId: pending[0].invitationId, pendingRows: pending };
  }

  if (rows.length === 1) {
    return { invitationId: rows[0].invitationId, pendingRows: pending };
  }

  return { invitationId: null, pendingRows: pending };
}

export type GraduationInvitationRouteResolution = {
  route: string | null;
  notificationId: number;
  parsedKind: string;
  extractedInvitationId: number | null;
  resolvedInvitationId: number | null;
  projectId: number | null;
  dedupKey: string | null;
  pendingInboxCount: number;
  resolution: "dedup" | "inbox_project_match" | "inbox_single_pending" | "unresolved";
};

/** Resolve a graduation team invitation notification to a detail-page route. */
export async function resolveGraduationInvitationRoute(
  n: GraduationNotification,
): Promise<GraduationInvitationRouteResolution> {
  const parsed = parseInvitationNotification(n);
  const extracted = extractGraduationInvitationId(n, parsed);

  const base = {
    notificationId: n.id,
    parsedKind: parsed.kind,
    extractedInvitationId: extracted,
    projectId: n.projectId,
    dedupKey: n.dedupKey ?? null,
    pendingInboxCount: 0,
    resolvedInvitationId: null as number | null,
    route: null as string | null,
    resolution: "unresolved" as GraduationInvitationRouteResolution["resolution"],
  };

  if (extracted != null) {
    return {
      ...base,
      resolvedInvitationId: extracted,
      route: studentGraduationInvitationPath(extracted),
      resolution: "dedup",
    };
  }

  const { invitationId, pendingRows } = await lookupGraduationInvitationIdFromInbox(n);
  base.pendingInboxCount = pendingRows.length;

  if (invitationId != null) {
    const resolution =
      n.projectId != null && pendingRows.some((r) => r.projectId === n.projectId)
        ? "inbox_project_match"
        : "inbox_single_pending";

    return {
      ...base,
      resolvedInvitationId: invitationId,
      route: studentGraduationInvitationPath(invitationId),
      resolution,
    };
  }

  return base;
}
