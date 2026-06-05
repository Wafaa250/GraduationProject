import type { FeedItem, FeedPublisherType } from "@/lib/feedTypes";

const TAG_LABELS = new Set([
  "skills",
  "track",
  "type",
  "category",
  "request",
  "role",
  "campaign",
  "course",
  "mode",
]);

export function feedPostRoleLabel(type: FeedPublisherType): string {
  switch (type) {
    case "company":
      return "Company";
    case "association":
      return "Association";
    case "doctor":
      return "Doctor";
    case "student":
      return "Student";
    default:
      return "Activity";
  }
}

export function formatFeedPublished(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

function toHashtag(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("#")) return trimmed;
  const compact = trimmed
    .replace(/[^a-zA-Z0-9+\- ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return compact ? `#${compact}` : "";
}

export function extractFeedPostTags(item: FeedItem, max = 5): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const meta of item.metadata) {
    const label = meta.label.trim().toLowerCase();
    if (!TAG_LABELS.has(label)) continue;
    const chunks = meta.value
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const chunk of chunks) {
      const tag = toHashtag(chunk);
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
      if (out.length >= max) return out;
    }
  }

  return out;
}

export function feedPostActionLabel(item: FeedItem): string {
  const fromApi = item.actionText?.trim();
  if (fromApi) return fromApi;
  return "View details";
}

export function isStudentSocialPost(item: FeedItem): boolean {
  return item.relatedEntityType === "student_post";
}

export function isDoctorSocialPost(item: FeedItem): boolean {
  return item.relatedEntityType === "doctor_post";
}

export function isSocialFeedPost(item: FeedItem): boolean {
  return isStudentSocialPost(item) || isDoctorSocialPost(item);
}

export function feedPostSupportsFollow(item: FeedItem): boolean {
  return (
    (item.sourceType === "company" || item.sourceType === "association") &&
    (item.followEntityId ?? 0) > 0
  );
}
