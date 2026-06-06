/** Association route paths aligned with web ASSOCIATION_ROUTES. */
export const ASSOCIATION_ROUTES = {
  dashboard: "/association/dashboard",
  events: "/association/events",
  eventsCreate: "/association/events/create",
  recruitment: "/association/recruitment",
  recruitmentCreate: "/association/recruitment/create",
  leadership: "/association/leadership",
  profile: "/association/profile",
  settings: "/association/settings",
  notifications: "/association/notifications",
} as const;

export function associationEventPath(eventId: number): string {
  return `/association/events/${eventId}`;
}

export function associationEventEditPath(eventId: number): string {
  return `/association/events/${eventId}/edit`;
}

export function associationEventRegistrationFormPath(eventId: number): string {
  return `/association/events/${eventId}/registration-form`;
}

export function associationEventRegistrationDetailPath(
  eventId: number,
  registrationId: number,
): string {
  return `/association/events/${eventId}/registrations/${registrationId}`;
}

export function associationRecruitmentCampaignPath(campaignId: number): string {
  return `/association/recruitment/${campaignId}`;
}

export function associationRecruitmentCampaignEditPath(campaignId: number): string {
  return `/association/recruitment/${campaignId}/edit`;
}

export function associationRecruitmentPositionFormPath(
  campaignId: number,
  positionId: number,
): string {
  return `/association/recruitment/${campaignId}/positions/${positionId}/form`;
}

export function associationRecruitmentApplicationPath(
  campaignId: number,
  applicationId: number,
): string {
  return `/association/recruitment/${campaignId}/applications/${applicationId}`;
}
