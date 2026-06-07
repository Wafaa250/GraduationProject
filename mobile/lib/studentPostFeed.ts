import type { StudentPost } from "@/api/studentPostsApi";
import { resolveFeedPostActionUrl } from "@/lib/feedActionRoutes";
import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";
import { getItem } from "@/utils/authStorage";

export async function getCurrentUserId(): Promise<number> {
  const id = Number(await getItem("userId"));
  return Number.isFinite(id) && id > 0 ? id : 0;
}

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
    actionUrl: previous?.actionUrl ?? `/students/${post.userId}`,
    imageUrl: isImage ? attachmentUrl : null,
    attachmentUrl,
    attachmentType: post.attachmentType ?? null,
    metadata: previous?.metadata ?? [],
  };
}

export function isOwnStudentPost(item: FeedItem, userId: number): boolean {
  return userId > 0 && item.authorUserId === userId;
}

export function socialPostAuthorProfileUrl(item: FeedItem): string {
  if (item.authorUserId && item.authorUserId > 0) {
    if (item.relatedEntityType === FEED_SOURCE_TYPES.doctorPost) {
      return `/doctors/${item.authorUserId}`;
    }
    return `/students/${item.authorUserId}`;
  }
  return resolveFeedPostActionUrl(item);
}
