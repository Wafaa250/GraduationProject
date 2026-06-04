import { Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
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

function isFollowable(hit: FeedSearchResultRow): boolean {
  const type = hit.entityType.toLowerCase();
  return hit.followable === true && (type === "company" || type === "association");
}

type Props = {
  hit: FeedSearchResultRow;
  groupKey?: string;
  onSelect: () => void;
  onFollow?: () => void;
  followBusy?: boolean;
};

export function SearchResultRow({ hit, groupKey, onSelect, onFollow, followBusy }: Props) {
  const src = hitAvatar(hit);
  const meta = getSearchRoleMeta(hit.entityType, groupKey);
  const initials = hit.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const followable = isFollowable(hit);
  const following = hit.isFollowing === true;
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

  const content = (
    <>
      <span className={cn("global-search__result-avatar", meta.avatarClass)}>
        {src ? <img src={src} alt="" /> : initials}
      </span>
      <span className="global-search__result-text">
        <span className="global-search__result-head">
          <span className="global-search__result-title">{hit.name}</span>
          {!followable ? (
            <span className={cn("global-search__badge", meta.badgeClass)}>{meta.label}</span>
          ) : null}
        </span>
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
      {followable ? (
        <div className="global-search__result-actions">
          <span className={cn("global-search__badge", meta.badgeClass)}>{meta.label}</span>
          <Button
            type="button"
            size="sm"
            variant={following ? "secondary" : "outline"}
            className={cn(
              "global-search__follow-btn shrink-0",
              following && "global-search__follow-btn--following",
            )}
            disabled={followBusy}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFollow?.();
            }}
          >
            {followBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : following ? (
              "✓ Following"
            ) : (
              "Follow"
            )}
          </Button>
        </div>
      ) : null}
    </>
  );

  if (followable) {
    return <div className="global-search__result global-search__result--followable">{content}</div>;
  }

  return (
    <button
      type="button"
      className="global-search__result"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
      }}
    >
      {content}
    </button>
  );
}
