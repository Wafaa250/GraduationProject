import type { FeedDiscoverMember } from "@/api/feedApi";
import { resolveApiFileUrl } from "@/api/axiosInstance";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";

function roleLabel(entityType: FeedDiscoverMember["entityType"]): string {
  switch (entityType) {
    case "company":
      return "Company";
    case "association":
      return "Association";
    case "doctor":
      return "Doctor";
    case "student":
      return "Student";
    default:
      return "Member";
  }
}

function avatarForMember(member: FeedDiscoverMember): { src?: string; initials: string } {
  const initials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (member.avatarBase64) {
    const src = profilePhotoUrl(member.avatarBase64);
    if (src) return { src, initials };
  }
  if (member.avatarUrl) {
    const src = resolveApiFileUrl(member.avatarUrl) ?? member.avatarUrl;
    return { src, initials };
  }
  return { initials };
}

type Props = {
  member: FeedDiscoverMember;
};

export function FeedDiscoverMemberRow({ member }: Props) {
  const avatar = avatarForMember(member);

  return (
    <div className="hub-discover-row">
      <div className="hub-discover-row__avatar" aria-hidden>
        {avatar.src ? (
          <img src={avatar.src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{avatar.initials}</span>
        )}
      </div>
      <div className="hub-discover-row__body min-w-0">
        <div className="hub-discover-row__head">
          <span className="hub-discover-row__name truncate">{member.name}</span>
          <span
            className={`hub-discover-row__badge hub-discover-row__badge--${member.entityType}`}
          >
            {roleLabel(member.entityType)}
          </span>
        </div>
        {member.subtitle ? (
          <p className="hub-discover-row__subtitle truncate">{member.subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
