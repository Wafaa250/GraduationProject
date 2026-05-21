import { Link } from "react-router-dom";

import { getProfileUrl } from "../../../../components/common/ProfileLink";
import { MatchScoreBadge } from "../../../../components/design-system/MatchScoreBadge";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { cn } from "../../../../components/ui/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Team workspace member row. */
export function CourseHubTeamMemberCard({
  name,
  userId,
  universityId,
  matchScore,
  isMe,
  compact = false,
}: {
  name: string;
  userId: number;
  universityId?: string;
  matchScore?: number;
  isMe?: boolean;
  /** Sidebar list inside team workspace panel. */
  compact?: boolean;
}) {
  const subtitle = universityId?.trim() ? `ID: ${universityId.trim()}` : "";
  const profileHref = getProfileUrl({ role: "student", userId });

  const nameEl = profileHref ? (
    <Link
      to={profileHref}
      className={cn(
        "truncate font-medium leading-tight text-foreground transition-colors hover:text-primary",
        compact ? "text-xs" : "text-sm",
      )}
    >
      {name}
    </Link>
  ) : (
    <p
      className={cn(
        "truncate font-medium leading-tight text-foreground",
        compact ? "text-xs" : "text-sm",
      )}
    >
      {name}
    </p>
  );

  if (compact) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
          isMe ? "bg-primary-soft/60" : "hover:bg-muted/50",
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {nameEl}
            {isMe ? (
              <span className="course-hub-chip shrink-0 px-1.5 py-px text-[9px] font-semibold leading-none">
                You
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="truncate text-[10px] leading-snug text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4",
        "shadow-card transition-shadow hover:shadow-elegant",
        isMe && "border-primary/25 bg-primary-soft/30",
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary">
          {initials(name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {nameEl}
          {isMe ? (
            <span className="course-hub-chip shrink-0 px-2 py-0.5 text-[10px] font-semibold">
              You
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="truncate text-xs leading-snug text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {matchScore != null && matchScore > 0 ? (
        <MatchScoreBadge score={Math.round(matchScore)} className="shrink-0" />
      ) : null}
    </div>
  );
}
