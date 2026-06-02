/** Matches backend FeedPostSourceTypes / FeedAuthorTypes. */
export const FEED_SOURCE_TYPES = {
  companyOpportunity: "company_opportunity",
  associationEvent: "association_event",
  associationRecruitment: "association_recruitment",
  doctorProject: "doctor_project",
  doctorAnnouncement: "doctor_announcement",
  studentCollaboration: "student_collaboration",
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
  createdAt: string;
  actionText: string;
  actionUrl?: string | null;
  imageUrl?: string | null;
  metadata: { label: string; value: string }[];
};

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
    createdAt: String(raw.createdAt ?? raw.publishedAt ?? new Date().toISOString()),
    actionText: String(raw.actionText ?? raw.actionLabel ?? "View details"),
    actionUrl: (raw.actionUrl ?? raw.actionPath) as string | null | undefined,
    imageUrl: raw.imageUrl as string | null | undefined,
    metadata: Array.isArray(raw.metadata)
      ? (raw.metadata as { label: string; value: string }[])
      : [],
  };
}
