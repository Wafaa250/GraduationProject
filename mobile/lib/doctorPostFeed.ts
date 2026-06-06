import type { DoctorPost } from "@/api/doctorPostsApi";
import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";
import { getItem } from "@/utils/authStorage";

export async function getCurrentUserId(): Promise<number> {
  const id = Number(await getItem("userId"));
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export function doctorPostToFeedItem(post: DoctorPost): FeedItem {
  const attachmentUrl = post.attachmentUrl ?? null;
  const isImage = post.attachmentType === "Image";

  return {
    id: `doctor_post:${post.id}`,
    sourceType: "doctor",
    sourceName: post.authorName || "Doctor",
    sourceAvatarUrl: null,
    sourceImageBase64: post.authorAvatarBase64 ?? null,
    sourceSubtitle: post.authorSubtitle ?? null,
    title: "",
    description: post.content,
    relatedEntityType: FEED_SOURCE_TYPES.doctorPost,
    relatedEntityId: post.id,
    authorUserId: post.userId,
    createdAt: post.createdAt,
    actionText: "View profile",
    actionUrl: `/doctors/${post.userId}`,
    imageUrl: isImage ? attachmentUrl : null,
    attachmentUrl,
    attachmentType: post.attachmentType ?? null,
    metadata: [],
  };
}

export function formatAnnouncementDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date} • ${time}`;
  } catch {
    return "";
  }
}
