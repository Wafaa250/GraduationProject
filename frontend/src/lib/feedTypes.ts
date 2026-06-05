function numOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Matches backend FeedPostSourceTypes / FeedAuthorTypes. */
export const FEED_SOURCE_TYPES = {
  companyOpportunity: "company_opportunity",
  companyTalentRequest: "company_talent_request",
  associationEvent: "association_event",
  associationRecruitment: "association_recruitment",
  associationRecruitmentPosition: "association_recruitment_position",
  doctorProject: "doctor_project",
  doctorCourseProject: "doctor_course_project",
  doctorAnnouncement: "doctor_announcement",
  studentCollaboration: "student_collaboration",
  studentPost: "student_post",
  doctorPost: "doctor_post",
} as const;

export type FeedPublisherType = "company" | "association" | "doctor" | "student";

export type FeedItem = {
  id: string;
  sourceType: FeedPublisherType;
  sourceName: string;
  sourceAvatarUrl?: string | null;
  sourceImageBase64?: string | null;
  sourceSubtitle?: string | null;
  title: string;
  description: string;
  relatedEntityType: string;
  relatedEntityId: number;
  /** Student or doctor author user id for social posts. */
  authorUserId?: number;
  /** Company profile or association org id for Follow actions. */
  followEntityId?: number;
  eventId?: number;
  recruitmentCampaignId?: number;
  positionId?: number;
  companyRequestId?: number;
  companyProfileId?: number;
  organizationProfileId?: number;
  createdAt: string;
  actionText: string;
  actionUrl?: string | null;
  imageUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: "Image" | "File" | null;
  metadata: { label: string; value: string }[];
};

/** Hub-unpublished company content is excluded from the Communication Hub timeline. */
export function isCompanyFeedItem(item: Pick<FeedItem, "sourceType" | "relatedEntityType">): boolean {
  return (
    item.relatedEntityType === FEED_SOURCE_TYPES.companyTalentRequest ||
    (item.sourceType === "company" &&
      item.relatedEntityType !== FEED_SOURCE_TYPES.companyOpportunity)
  );
}

/** Normalize API payload (supports legacy publisher* fields). */
export function normalizeFeedItem(raw: Record<string, unknown>): FeedItem {
  const sourceType = (raw.sourceType ?? raw.publisherType ?? "student") as FeedPublisherType;
  return {
    id: String(raw.id ?? raw.postKey ?? ""),
    sourceType,
    sourceName: String(raw.sourceName ?? raw.publisherName ?? "Activity"),
    sourceAvatarUrl: (raw.sourceAvatarUrl ?? raw.publisherAvatarUrl) as string | null | undefined,
    sourceImageBase64: (raw.sourceImageBase64 ?? raw.publisherImageBase64) as string | null | undefined,
    sourceSubtitle: (raw.sourceSubtitle as string | null | undefined) ?? null,
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    relatedEntityType: String(raw.relatedEntityType ?? raw.sourceType ?? ""),
    relatedEntityId: Number(raw.relatedEntityId ?? raw.entityId ?? 0),
    authorUserId: numOrUndef(raw.authorUserId ?? raw.AuthorUserId),
    followEntityId: Number(raw.followEntityId ?? raw.FollowEntityId ?? 0) || undefined,
    eventId: numOrUndef(raw.eventId ?? raw.EventId),
    recruitmentCampaignId: numOrUndef(raw.recruitmentCampaignId ?? raw.RecruitmentCampaignId),
    positionId: numOrUndef(raw.positionId ?? raw.PositionId),
    companyRequestId: numOrUndef(raw.companyRequestId ?? raw.CompanyRequestId),
    companyProfileId: numOrUndef(raw.companyProfileId ?? raw.CompanyProfileId),
    organizationProfileId: numOrUndef(raw.organizationProfileId ?? raw.OrganizationProfileId),
    createdAt: String(raw.createdAt ?? raw.publishedAt ?? new Date().toISOString()),
    actionText: String(raw.actionText ?? raw.actionLabel ?? "View details"),
    actionUrl: (raw.actionUrl ?? raw.actionPath) as string | null | undefined,
    imageUrl: raw.imageUrl as string | null | undefined,
    attachmentUrl: (raw.attachmentUrl ?? raw.AttachmentUrl) as string | null | undefined,
    attachmentType: (() => {
      const t = raw.attachmentType ?? raw.AttachmentType;
      return t === "Image" || t === "File" ? t : null;
    })(),
    metadata: Array.isArray(raw.metadata)
      ? (raw.metadata as { label: string; value: string }[])
      : [],
  };
}
