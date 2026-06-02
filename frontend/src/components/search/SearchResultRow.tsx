import { cn } from "@/components/ui/utils";
import type { SearchHit } from "@/api/searchApi";
import { resolveApiFileUrl } from "@/api/axiosInstance";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { getSearchRoleMeta } from "@/lib/searchRoleMeta";

function hitAvatar(hit: SearchHit): string | null {
  if (hit.avatarBase64) {
    const src = profilePhotoUrl(hit.avatarBase64);
    if (src) return src;
  }
  if (hit.avatarUrl) return resolveApiFileUrl(hit.avatarUrl) ?? hit.avatarUrl;
  return null;
}

type Props = {
  hit: SearchHit;
  groupKey?: string;
  onSelect: () => void;
};

export function SearchResultRow({ hit, groupKey, onSelect }: Props) {
  const src = hitAvatar(hit);
  const meta = getSearchRoleMeta(hit.roleType, groupKey);
  const initials = hit.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <button
      type="button"
      className="global-search__result"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
    >
      <span className={cn("global-search__result-avatar", meta.avatarClass)}>
        {src ? <img src={src} alt="" /> : initials}
      </span>
      <span className="global-search__result-text">
        <span className="global-search__result-head">
          <span className="global-search__result-title">{hit.title}</span>
          <span className={cn("global-search__badge", meta.badgeClass)}>{meta.label}</span>
        </span>
        {hit.subtitle ? (
          <span className="global-search__result-subtitle">{hit.subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}
