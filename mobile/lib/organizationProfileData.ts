import { getPublicOrganizationProfile } from "@/api/publicProfilesApi";
import { listOrganizationEvents } from "@/api/organizationEventsApi";
import { listOrganizationTeamMembers } from "@/api/organizationTeamMembersApi";
import type { StudentOrganizationEvent } from "@/api/organizationEventsApi";

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
  events: StudentOrganizationEvent[];
  leadership: OrganizationProfileLeadershipMember[];
};

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

export function isUpcomingEvent(dateIso: string): boolean {
  const time = new Date(dateIso).getTime();
  return !Number.isNaN(time) && time >= Date.now() - 86_400_000;
}
