import { getAssociationProfile } from "@/api/associationApi";
import type { StudentAssociationProfile } from "@/api/associationApi";
import {
  listOrganizationEvents,
  type StudentOrganizationEvent,
} from "@/api/organizationEventsApi";
import { listOrganizationTeamMembers } from "@/api/organizationTeamMembersApi";
import {
  getPublicOrganizationProfile,
  type PublicOrganizationMember,
  type PublicOrganizationEventSummary,
  type PublicLeadershipTeamMember,
  type PublicOrganizationProfile,
} from "@/api/organizationsPublicApi";
import type { OrganizationProfileLeadershipMember } from "@/components/association/OrganizationProfileLeadershipSection";

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
    events: org.upcomingEvents.map((e) =>
      mapPublicEvent(e, org.organizationId, org.organizationName, org.logoUrl ?? null),
    ),
    leadership: org.leadershipTeam.map(mapLeadershipMember),
  };
}

/** Loads events + leadership using owner workspace APIs (logged-in organization). */
export async function loadOrganizationProfileExtrasForOwner(): Promise<OrganizationProfileExtras> {
  const [events, teamRows] = await Promise.all([
    listOrganizationEvents(),
    listOrganizationTeamMembers(),
  ]);
  return {
    members: [],
    events,
    leadership: teamRows.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      roleTitle: m.roleTitle,
      major: m.major,
      imageUrl: m.imageUrl,
      linkedInUrl: m.linkedInUrl,
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

export async function getAssociationProfileByOrganizationId(
  organizationProfileId: number,
): Promise<StudentAssociationProfile> {
  const bundle = await loadVisitorOrganizationProfile(organizationProfileId);
  return bundle.profile;
}

export { getAssociationProfile };
