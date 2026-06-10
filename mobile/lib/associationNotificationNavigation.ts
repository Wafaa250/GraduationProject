import type { GraduationNotification } from "@/api/notificationsApi";
import { listOrganizationRecruitmentCampaigns } from "@/api/recruitmentCampaignsApi";
import { listOrganizationRecruitmentApplications } from "@/api/recruitmentApplicationsApi";
import {
  ASSOCIATION_ROUTES,
  associationEventPath,
  associationRecruitmentApplicationPath,
} from "@/lib/associationRoutes";

function conversationIdFromChatDedupKey(dedupKey: string | null | undefined): number | null {
  if (!dedupKey) return null;
  const direct = dedupKey.match(/^chat:direct:(\d+):/);
  if (direct) return Number(direct[1]);
  const team = dedupKey.match(/^chat:team-conv:(\d+):/);
  if (team) return Number(team[1]);
  const started = dedupKey.match(/^chat:conversation_started:(\d+):/);
  if (started) return Number(started[1]);
  return null;
}

function eventIdFromOrganizationEventDedupKey(dedupKey: string | null | undefined): number | null {
  if (!dedupKey) return null;
  const match = dedupKey.match(/^organization_event:(\d+):/);
  if (!match) return null;
  const eventId = Number(match[1]);
  return Number.isFinite(eventId) ? eventId : null;
}

function applicationIdFromRecruitmentDedupKey(dedupKey: string | null | undefined): number | null {
  if (!dedupKey) return null;
  const match = dedupKey.match(/^recruitment:(?:accepted|rejected):(\d+):/);
  if (!match) return null;
  const applicationId = Number(match[1]);
  return Number.isFinite(applicationId) ? applicationId : null;
}

const RECRUITMENT_APPLICATION_PREFIX = "association-recruitment-application:";

/** Resolve association workspace notification targets — not student hub routes. */
export function getAssociationNotificationTarget(n: GraduationNotification): string | null {
  // WEB has no association messages inbox — do not route chat notifications to student hub.
  if (n.category === "chat") {
    return null;
  }

  if (n.category === "organization_event") {
    const eventId = eventIdFromOrganizationEventDedupKey(n.dedupKey);
    if (eventId != null) return associationEventPath(eventId);
    return ASSOCIATION_ROUTES.events;
  }

  if (n.category === "organization_recruitment") {
    const applicationId =
      applicationIdFromRecruitmentDedupKey(n.dedupKey) ??
      (n.projectId != null && Number.isFinite(n.projectId) ? n.projectId : null);
    if (applicationId != null) {
      return `${RECRUITMENT_APPLICATION_PREFIX}${applicationId}`;
    }
    return ASSOCIATION_ROUTES.recruitment;
  }

  if (n.category === "graduation_project" || n.category === "course" || n.category === "ai") {
    return ASSOCIATION_ROUTES.dashboard;
  }

  return null;
}

/** Resolve async targets that need campaign lookup (recruitment application deep links). */
export async function resolveAssociationNotificationTarget(
  n: GraduationNotification,
): Promise<string | null> {
  const target = getAssociationNotificationTarget(n);
  if (!target) return null;
  if (!target.startsWith(RECRUITMENT_APPLICATION_PREFIX)) return target;

  const applicationId = Number(target.slice(RECRUITMENT_APPLICATION_PREFIX.length));
  if (!Number.isFinite(applicationId)) return ASSOCIATION_ROUTES.recruitment;

  try {
    const campaigns = await listOrganizationRecruitmentCampaigns();
    for (const campaign of campaigns) {
      const apps = await listOrganizationRecruitmentApplications(campaign.id);
      if (apps.some((app) => app.id === applicationId)) {
        return associationRecruitmentApplicationPath(campaign.id, applicationId);
      }
    }
  } catch {
    /* fall through */
  }

  return ASSOCIATION_ROUTES.recruitment;
}

export function getAssociationNotificationTargetLabel(n: GraduationNotification): string | null {
  return getAssociationNotificationTarget(n) ? "View" : null;
}
