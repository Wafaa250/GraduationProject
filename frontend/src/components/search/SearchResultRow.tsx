import { cn } from "@/components/ui/utils";
import type { FeedSearchResultRow } from "@/api/feedApi";
import { resolveApiFileUrl } from "@/api/axiosInstance";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { getSearchRoleMeta } from "@/lib/searchRoleMeta";

function hitAvatar(hit: FeedSearchResultRow): string | null {
  if (hit.avatarBase64) {
    const src = profilePhotoUrl(hit.avatarBase64);
    if (src) return src;
  }
  if (hit.avatarUrl) return resolveApiFileUrl(hit.avatarUrl) ?? hit.avatarUrl;
  return null;
}

type Props = {
  hit: FeedSearchResultRow;
  groupKey?: string;
  onSelect: () => void;
  onMessage?: () => void;
  onFollow?: () => void;
  isFollowing?: boolean;
  messaging?: boolean;
};

export function SearchResultRow({
  hit,
  groupKey,
  onSelect,
  onMessage,
  onFollow,
  isFollowing = false,
  messaging = false,
}: Props) {
  const src = hitAvatar(hit);
  const meta = getSearchRoleMeta(hit.entityType, groupKey);
  const initials = hit.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const entityKind = hit.entityType.toLowerCase();
  const isCompany = entityKind === "company";
  const rawUsername = hit.username?.trim();
  const usernameLine = isCompany
    ? rawUsername || null
    : rawUsername
      ? rawUsername.startsWith("@")
        ? rawUsername
        : `@${rawUsername}`
      : hit.email?.includes("@")
        ? `@${hit.email.split("@")[0]}`
        : null;

  const entityType = hit.entityType.toLowerCase();
  const isPerson = entityType === "student" || entityType === "doctor";
  const isFollowable = entityType === "company" || entityType === "association";

  return (
    <div className="global-search__result global-search__result--row">
      <button type="button" className="global-search__result-main" onClick={() => onSelect()}>
        <span className={cn("global-search__result-avatar", meta.avatarClass)}>
          {src ? <img src={src} alt="" /> : initials}
        </span>
        <span className="global-search__result-text">
          <span className="global-search__result-title">{hit.name}</span>
          {usernameLine ? (
            <span
              className={cn(
                "global-search__result-username",
                isCompany && "global-search__result-username--company",
              )}
            >
              {usernameLine}
            </span>
          ) : null}
          {hit.subtitle &&
          (!isCompany || hit.subtitle.trim() !== (usernameLine ?? "").trim()) ? (
            <span className="global-search__result-subtitle">{hit.subtitle}</span>
          ) : null}
        </span>
      </button>
      {isPerson && onMessage ? (
        <button
          type="button"
          className="global-search__result-action"
          disabled={messaging}
          onClick={(e) => {
            e.stopPropagation();
            onMessage();
          }}
        >
          {messaging ? "…" : "Message"}
        </button>
      ) : null}
      {isFollowable && onFollow ? (
        <button
          type="button"
          className="global-search__result-action"
          onClick={(e) => {
            e.stopPropagation();
            onFollow();
          }}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      ) : null}
      {!isPerson && !isFollowable ? (
        <button type="button" className="global-search__result-action" onClick={() => onSelect()}>
          View
        </button>
      ) : isPerson ? (
        <button type="button" className="global-search__result-action" onClick={() => onSelect()}>
          View
        </button>
      ) : null}
    </div>
  );
}
