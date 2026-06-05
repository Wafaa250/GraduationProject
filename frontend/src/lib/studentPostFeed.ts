import type { DoctorPost } from "@/api/doctorPostsApi";
import type { StudentPost } from "@/api/studentPostsApi";
import { resolveFeedPostActionUrl } from "@/lib/feedActionRoutes";
import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";
import { ROUTES } from "@/routes/paths";

/** Map API student post into a Communication Hub feed card item. */
export function studentPostToFeedItem(post: StudentPost, previous?: FeedItem): FeedItem {
  const attachmentUrl = post.attachmentUrl ?? null;
  const isImage = post.attachmentType === "Image";

  return {
    id: `student_post:${post.id}`,
    sourceType: "student",
    sourceName: post.authorName || previous?.sourceName || "Student",
    sourceAvatarUrl: previous?.sourceAvatarUrl ?? null,
    sourceImageBase64: post.authorAvatarBase64 ?? previous?.sourceImageBase64 ?? null,
    sourceSubtitle: post.authorSubtitle ?? previous?.sourceSubtitle ?? null,
    title: "",
    description: post.content,
    relatedEntityType: FEED_SOURCE_TYPES.studentPost,
    relatedEntityId: post.id,
    authorUserId: post.userId,
    followEntityId: undefined,
    createdAt: post.createdAt,
    actionText: previous?.actionText ?? "View profile",
    actionUrl: previous?.actionUrl ?? ROUTES.studentDirectoryProfile(post.userId),
    imageUrl: isImage ? attachmentUrl : null,
    attachmentUrl,
    attachmentType: post.attachmentType ?? null,
    metadata: previous?.metadata ?? [],
  };
}

export function getCurrentUserId(): number {
  const id = Number(localStorage.getItem("userId") ?? "0");
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export function isOwnStudentPost(item: FeedItem): boolean {
  const userId = getCurrentUserId();
  return userId > 0 && item.authorUserId === userId;
}

/** Map API doctor post into a Communication Hub feed card item. */
export function doctorPostToFeedItem(post: DoctorPost, previous?: FeedItem): FeedItem {
  const attachmentUrl = post.attachmentUrl ?? null;
  const isImage = post.attachmentType === "Image";

  return {
    id: `doctor_post:${post.id}`,
    sourceType: "doctor",
    sourceName: post.authorName || previous?.sourceName || "Doctor",
    sourceAvatarUrl: previous?.sourceAvatarUrl ?? null,
    sourceImageBase64: post.authorAvatarBase64 ?? previous?.sourceImageBase64 ?? null,
    sourceSubtitle: post.authorSubtitle ?? previous?.sourceSubtitle ?? null,
    title: "",
    description: post.content,
    relatedEntityType: FEED_SOURCE_TYPES.doctorPost,
    relatedEntityId: post.id,
    authorUserId: post.userId,
    followEntityId: undefined,
    createdAt: post.createdAt,
    actionText: previous?.actionText ?? "View profile",
    actionUrl: previous?.actionUrl ?? ROUTES.doctorPublicProfile(post.userId),
    imageUrl: isImage ? attachmentUrl : null,
    attachmentUrl,
    attachmentType: post.attachmentType ?? null,
    metadata: previous?.metadata ?? [],
  };
}

export function isOwnDoctorPost(item: FeedItem): boolean {
  const userId = getCurrentUserId();
  return userId > 0 && item.authorUserId === userId;
}

export function socialPostAuthorProfileUrl(item: FeedItem): string {
  if (item.authorUserId && item.authorUserId > 0) {
    if (item.relatedEntityType === FEED_SOURCE_TYPES.doctorPost) {
      return ROUTES.doctorPublicProfile(item.authorUserId);
    }
    return ROUTES.studentDirectoryProfile(item.authorUserId);
  }
  return resolveFeedPostActionUrl(item);
}
