import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveApiFileUrl } from "@/api/axiosInstance";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import type { FeedItem, FeedPublisherType } from "@/lib/feedTypes";

function roleLabel(type: FeedPublisherType): string {
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

function formatPublished(iso: string): string {
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

function avatarForItem(item: FeedItem): { src?: string; initials: string } {
  const initials = item.sourceName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (item.sourceImageBase64) {
    const src = profilePhotoUrl(item.sourceImageBase64);
    if (src) return { src, initials };
  }
  if (item.sourceAvatarUrl) {
    const src = resolveApiFileUrl(item.sourceAvatarUrl) ?? item.sourceAvatarUrl;
    return { src, initials };
  }
  return { initials };
}

type Props = {
  item: FeedItem;
};

export function FeedPostCard({ item }: Props) {
  const avatar = avatarForItem(item);
  const imageSrc = item.imageUrl ? resolveApiFileUrl(item.imageUrl) ?? item.imageUrl : null;

  return (
    <article className={`hub-card feed-post feed-post--${item.sourceType}`}>
      <header className="feed-post__header">
        <div className="feed-post__avatar">
          {avatar.src ? (
            <img src={avatar.src} alt="" className="h-full w-full object-cover" />
          ) : (
            avatar.initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div>
            <span className="feed-post__author">{item.sourceName}</span>
            <span
              className={`feed-post__type-badge feed-post__type-badge--${item.sourceType}`}
            >
              {roleLabel(item.sourceType)}
            </span>
          </div>
          {item.sourceSubtitle ? (
            <div className="feed-post__subtitle truncate">{item.sourceSubtitle}</div>
          ) : null}
          <div className="feed-post__date">{formatPublished(item.createdAt)}</div>
        </div>
      </header>
      <h3 className="feed-post__title">{item.title}</h3>
      {item.description ? <p className="feed-post__content">{item.description}</p> : null}
      {item.metadata.length > 0 ? (
        <div className="feed-post__meta-list">
          {item.metadata.map((meta) => (
            <span key={`${item.id}-${meta.label}`} className="feed-post__meta-chip">
              <strong>{meta.label}:</strong> {meta.value}
            </span>
          ))}
        </div>
      ) : null}
      {imageSrc ? (
        <img src={imageSrc} alt="" className="feed-post__image" loading="lazy" />
      ) : null}
      <div className="feed-post__footer">
        {item.actionUrl ? (
          <Link
            to={item.actionUrl}
            className={`feed-post__primary-btn feed-post__primary-btn--${item.sourceType}`}
          >
            {item.actionText}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <button
            type="button"
            className={`feed-post__primary-btn feed-post__primary-btn--${item.sourceType}`}
            disabled
          >
            {item.actionText}
          </button>
        )}
      </div>
    </article>
  );
}
