import { Link } from "react-router-dom";
import { Loader2, MessageCircle, UserPlus } from "lucide-react";

import { MatchScoreBadge } from "./MatchScoreBadge";
import { SkillChip } from "./SkillChip";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

export type TeammateMatchCardProps = {
  /** AspNetUsers.Id — profile route /students/:userId */
  userId: number;
  /** StudentProfile.Id — graduation project invite API */
  studentProfileId: number;
  name: string;
  subtitle: string;
  initials: string;
  profilePicture?: string | null;
  matchScore: number;
  skills: string[];
  matchReason?: string;
  onInvite?: () => void;
  inviteLoading?: boolean;
  inviteDisabled?: boolean;
  inviteLabel?: string;
  /** Shown as primary action when `onInvite` is not provided (e.g. browse without project). */
  profileHref?: string;
  profileLabel?: string;
  className?: string;
};

export function TeammateMatchCard({
  userId,
  studentProfileId,
  name,
  subtitle,
  initials,
  profilePicture,
  matchScore,
  skills,
  matchReason,
  onInvite,
  inviteLoading,
  inviteDisabled,
  inviteLabel = "Invite",
  profileHref: profileHrefProp,
  profileLabel = "View profile",
  className,
}: TeammateMatchCardProps) {
  const nameProfileHref = userId > 0 ? `/students/${userId}` : "#";
  const primaryProfileHref = profileHrefProp ?? nameProfileHref;
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground shadow-glow">
            {profilePicture ? (
              <img src={profilePicture} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <Link
              to={nameProfileHref}
              className="font-display font-semibold leading-tight text-foreground hover:text-primary"
            >
              {name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {matchScore > 0 ? <MatchScoreBadge score={matchScore} /> : null}
      </div>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map((skill) => (
            <SkillChip key={skill} label={skill} variant="have" />
          ))}
        </div>
      ) : matchReason ? (
        <p className="text-xs text-muted-foreground">No listed skills on profile yet.</p>
      ) : null}

      {matchReason ? (
        <p className="rounded-xl border border-ai/15 bg-ai-soft/60 px-3 py-2 text-xs leading-relaxed text-ai">
          <span className="font-semibold">AI:</span> {matchReason}
        </p>
      ) : null}

      <div className="flex gap-2 pt-1">
        {onInvite ? (
          <Button
            type="button"
            size="sm"
            variant="gradient"
            className="flex-1"
            disabled={inviteDisabled || inviteLoading}
            onClick={onInvite}
          >
            {inviteLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                {inviteLabel}
              </>
            )}
          </Button>
        ) : primaryProfileHref && primaryProfileHref !== "#" ? (
          <Button type="button" size="sm" variant="gradient" className="flex-1" asChild>
            <Link to={primaryProfileHref}>{profileLabel}</Link>
          </Button>
        ) : (
          <div className="flex-1" aria-hidden />
        )}
        <Button type="button" size="sm" variant="outline" className="shrink-0" asChild>
          <Link to="/messages" aria-label="Message">
            <MessageCircle className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
