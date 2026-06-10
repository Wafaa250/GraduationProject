import type { StudentAssociationProfile } from "@/api/associationApi";
import type { StudentOrganizationEvent } from "@/api/organizationEventsApi";
import {
  getPublicOrganizationProfile,
  type PublicLeadershipTeamMember,
  type PublicOrganizationEventSummary,
  type PublicOrganizationMember,
  type PublicOrganizationProfile,
} from "@/api/publicProfilesApi";
import { listOrganizationEvents } from "@/api/organizationEventsApi";
import { listOrganizationTeamMembers } from "@/api/organizationTeamMembersApi";

export type OrganizationProfileLeadershipMember = {
  id: number;
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
};

export type OrganizationProfileExtras = {
  followersCount?: number;
  members: PublicOrganizationMember[];
  events: StudentOrganizationEvent[];
  leadership: OrganizationProfileLeadershipMember[];
};

function mapPublicEvent(
  event: PublicOrganizationEventSummary,
  organizationId: number,
  organizationName: string,
  organizationLogoUrl: string | null,
): StudentOrganizationEvent {
  return {
    id: event.id,
    organizationProfileId: organizationId,
    title: event.title,
    description: "",
    eventType: event.eventType,
    category: event.category,
    coverImageUrl: event.coverImageUrl ?? null,
    eventDate: event.eventDate,
    registrationDeadline: null,
    location: event.location ?? null,
    isOnline: event.isOnline,
    createdAt: event.eventDate,
    isPublished: true,
    organizationName,
    organizationLogoUrl,
  };
}

function mapLeadershipMember(member: PublicLeadershipTeamMember): OrganizationProfileLeadershipMember {
  return {
    id: member.id,
    fullName: member.fullName,
    roleTitle: member.roleTitle,
    major: member.major,
    imageUrl: member.imageUrl,
    linkedInUrl: member.linkedInUrl,
  };
}

function mapPublicOrgToAssociationProfile(org: PublicOrganizationProfile): StudentAssociationProfile {
  const handle =
    org.organizationName.replace(/\s+/g, "").slice(0, 24).toLowerCase() || "org";
  return {
    id: org.organizationId,
    userId: 0,
    role: "studentassociation",
    associationName: org.organizationName,
    username: handle,
    email: "",
    description: org.description ?? null,
    faculty: org.faculty ?? "",
    category: org.category ?? "",
    logoUrl: org.logoUrl ?? null,
    instagramUrl: org.instagramUrl ?? null,
    facebookUrl: org.facebookUrl ?? null,
    linkedInUrl: org.linkedInUrl ?? null,
    isVerified: org.isVerified,
    createdAt: org.createdAt,
  };
}

function mapPublicOrgToExtras(org: PublicOrganizationProfile): OrganizationProfileExtras {
  return {
    followersCount: org.followersCount,
    members: org.members,
    events: org.upcomingEvents.map((event) =>
      mapPublicEvent(event, org.organizationId, org.organizationName, org.logoUrl ?? null),
    ),
    leadership: org.leadershipTeam.map(mapLeadershipMember),
  };
}

/** Same data bundle as web `loadOrganizationProfileExtrasForOwner`, plus followers from public profile. */
export async function loadOrganizationProfileExtrasForOwner(
  organizationProfileId?: number,
): Promise<OrganizationProfileExtras> {
  const [events, teamRows, publicProfile] = await Promise.all([
    listOrganizationEvents(),
    listOrganizationTeamMembers(),
    organizationProfileId && organizationProfileId > 0
      ? getPublicOrganizationProfile(organizationProfileId).catch(() => null)
      : Promise.resolve(null),
  ]);
  return {
    followersCount: publicProfile?.followersCount,
    members: publicProfile?.members ?? [],
    events,
    leadership: teamRows.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      roleTitle: member.roleTitle,
      major: member.major,
      imageUrl: member.imageUrl,
      linkedInUrl: member.linkedInUrl,
    })),
  };
}

/** Single request for visitor profile page (same sections as owner view). */
export async function loadVisitorOrganizationProfile(organizationProfileId: number): Promise<{
  profile: StudentAssociationProfile;
  extras: OrganizationProfileExtras;
}> {
  const org = await getPublicOrganizationProfile(organizationProfileId);
  return {
    profile: mapPublicOrgToAssociationProfile(org),
    extras: mapPublicOrgToExtras(org),
  };
}

export function isUpcomingEvent(dateIso: string): boolean {
  const time = new Date(dateIso).getTime();
  return !Number.isNaN(time) && time >= Date.now() - 86_400_000;
}
