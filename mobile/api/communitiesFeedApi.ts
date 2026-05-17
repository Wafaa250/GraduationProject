import {
  getPublicOrganization,
  getPublicOrganizationEvent,
  type PublicOrganizationEventDetail,
  type PublicOrganizationEventSummary,
} from "./publicOrganizationsApi";
import {
  getPublicRecruitmentCampaign,
  listPublicRecruitmentCampaigns,
  type PublicRecruitmentCampaignSummary,
} from "./organizationRecruitmentCampaignsApi";
import type { PublicOrganizationDiscovery } from "./organizationsApi";

const FETCH_CONCURRENCY = 8;

export type EventRegistrationStatus = "open" | "closed" | "none";

export type CommunityFeedEvent = PublicOrganizationEventSummary & {
  organizationId: number;
  organizationName: string;
  organizationLogoUrl?: string | null;
  registrationStatus: EventRegistrationStatus;
};

export type CommunityFeedRecruitment = PublicRecruitmentCampaignSummary & {
  organizationId: number;
  organizationName: string;
  organizationLogoUrl?: string | null;
  roleTitle: string;
  skillTags: string[];
};

export type FollowingActivityItem = {
  id: string;
  type: "event" | "recruitment";
  organizationId: number;
  organizationName: string;
  organizationLogoUrl?: string | null;
  title: string;
  detail: string;
  timestamp: string;
  href: string;
};

export type CommunityFeedPayload = {
  events: CommunityFeedEvent[];
  recruitment: CommunityFeedRecruitment[];
  activity: FollowingActivityItem[];
};

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await mapper(items[i]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () => worker()),
  );
  return results;
}

function parseSkillTags(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function eventTimestamp(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function deriveRegistrationStatus(detail: PublicOrganizationEventDetail): EventRegistrationStatus {
  if (!detail.registrationForm) return "none";
  if (detail.registrationDeadline) {
    const deadline = new Date(detail.registrationDeadline).getTime();
    if (!Number.isNaN(deadline) && deadline < Date.now()) return "closed";
  }
  return "open";
}

async function fetchOrgFeedSlice(org: PublicOrganizationDiscovery) {
  try {
    const [profile, campaigns] = await Promise.all([
      getPublicOrganization(org.id),
      listPublicRecruitmentCampaigns(org.id).catch(() => [] as PublicRecruitmentCampaignSummary[]),
    ]);

    const events: CommunityFeedEvent[] = (profile.upcomingEvents ?? []).map((event) => ({
      ...event,
      organizationId: org.id,
      organizationName: profile.organizationName,
      organizationLogoUrl: profile.logoUrl,
      registrationStatus: "none" as EventRegistrationStatus,
    }));

    const recruitment: CommunityFeedRecruitment[] = campaigns.map((campaign) => ({
      ...campaign,
      organizationId: org.id,
      organizationName: profile.organizationName,
      organizationLogoUrl: profile.logoUrl,
      roleTitle: campaign.title,
      skillTags: [],
    }));

    return { events, recruitment };
  } catch {
    return { events: [] as CommunityFeedEvent[], recruitment: [] as CommunityFeedRecruitment[] };
  }
}

async function enrichEventRegistration(event: CommunityFeedEvent): Promise<CommunityFeedEvent> {
  try {
    const detail = await getPublicOrganizationEvent(event.organizationId, event.id);
    return { ...event, registrationStatus: deriveRegistrationStatus(detail) };
  } catch {
    return event;
  }
}

async function enrichRecruitmentItem(item: CommunityFeedRecruitment): Promise<CommunityFeedRecruitment> {
  try {
    const detail = await getPublicRecruitmentCampaign(item.organizationId, item.id);
    const first = detail.positions?.[0];
    return {
      ...item,
      roleTitle: first?.roleTitle?.trim() || item.title,
      skillTags: parseSkillTags(first?.requiredSkills),
    };
  } catch {
    return item;
  }
}

function buildActivity(
  events: CommunityFeedEvent[],
  recruitment: CommunityFeedRecruitment[],
  followedIds: Set<number>,
): FollowingActivityItem[] {
  const items: FollowingActivityItem[] = [];

  for (const event of events) {
    if (!followedIds.has(event.organizationId)) continue;
    items.push({
      id: `event-${event.organizationId}-${event.id}`,
      type: "event",
      organizationId: event.organizationId,
      organizationName: event.organizationName,
      organizationLogoUrl: event.organizationLogoUrl,
      title: event.title,
      detail: "Posted a new event",
      timestamp: event.eventDate,
      href: `/public-organizations/${event.organizationId}/events/${event.id}`,
    });
  }

  for (const campaign of recruitment) {
    if (!followedIds.has(campaign.organizationId)) continue;
    items.push({
      id: `recruitment-${campaign.organizationId}-${campaign.id}`,
      type: "recruitment",
      organizationId: campaign.organizationId,
      organizationName: campaign.organizationName,
      organizationLogoUrl: campaign.organizationLogoUrl,
      title: campaign.roleTitle,
      detail: "Opened recruitment",
      timestamp: campaign.applicationDeadline,
      href: `/public-organizations/${campaign.organizationId}/recruitment-campaigns/${campaign.id}`,
    });
  }

  return items.sort((a, b) => eventTimestamp(b.timestamp) - eventTimestamp(a.timestamp));
}

export async function loadCommunityFeed(
  organizations: PublicOrganizationDiscovery[],
  following: PublicOrganizationDiscovery[],
): Promise<CommunityFeedPayload> {
  if (organizations.length === 0) {
    return { events: [], recruitment: [], activity: [] };
  }

  const slices = await mapPool(organizations, FETCH_CONCURRENCY, fetchOrgFeedSlice);

  const allEventsRaw = slices
    .flatMap((s) => s.events)
    .sort((a, b) => eventTimestamp(a.eventDate) - eventTimestamp(b.eventDate));

  const allRecruitmentRaw = slices
    .flatMap((s) => s.recruitment)
    .sort((a, b) => eventTimestamp(a.applicationDeadline) - eventTimestamp(b.applicationDeadline));

  const [events, recruitment] = await Promise.all([
    mapPool(allEventsRaw, FETCH_CONCURRENCY, enrichEventRegistration),
    mapPool(allRecruitmentRaw, FETCH_CONCURRENCY, enrichRecruitmentItem),
  ]);

  const followedIds = new Set(following.map((o) => o.id));
  const activity = followedIds.size > 0 ? buildActivity(events, recruitment, followedIds) : [];

  return { events, recruitment, activity };
}
