import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { MatchScoreBadge } from "./MatchScoreBadge";
import { SkillChip } from "./SkillChip";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

export type SupervisorMatchCardProps = {
  userId: number;
  name: string;
  department: string;
  initials: string;
  matchScore: number;
  expertise: string[];
  matchReason: string;
  onRequest?: () => void;
  requestLoading?: boolean;
  requestDisabled?: boolean;
  className?: string;
};

export function SupervisorMatchCard({
  userId,
  name,
  department,
  initials,
  matchScore,
  expertise,
  matchReason,
  onRequest,
  requestLoading,
  requestDisabled,
  className,
}: SupervisorMatchCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary text-sm font-bold text-primary-foreground shadow-glow">
            {initials}
          </div>
          <div className="min-w-0">
            <Link
              to={`/doctors/${userId}`}
              className="font-display font-semibold text-foreground hover:text-primary"
            >
              {name}
            </Link>
            <p className="text-xs text-muted-foreground line-clamp-2">{department}</p>
          </div>
        </div>
        {matchScore > 0 ? <MatchScoreBadge score={matchScore} /> : null}
      </div>

      {expertise.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {expertise.map((area) => (
            <SkillChip key={area} label={area} />
          ))}
        </div>
      ) : null}

      {matchReason.trim() ? (
        <p className="mt-3 rounded-xl border border-ai/15 bg-ai-soft/60 px-3 py-2 text-xs leading-relaxed text-ai">
          <span className="font-semibold">Best supervisor fit because:</span> {matchReason}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Match based on project skills &amp; specialization
        </p>
        {onRequest ? (
          <Button
            type="button"
            size="sm"
            variant="gradient"
            disabled={requestDisabled || requestLoading}
            onClick={onRequest}
          >
            {requestLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Request supervision"
            )}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
