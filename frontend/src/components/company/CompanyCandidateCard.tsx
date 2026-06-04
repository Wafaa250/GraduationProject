import { Bookmark, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import { cn } from "@/lib/utils";
import type { RecommendationCandidate } from "@/types/companyRecommendation";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  candidate: RecommendationCandidate;
  saved: boolean;
  saveDisabled?: boolean;
  onViewProfile: () => void;
  onToggleSave: () => void;
};

export function CompanyCandidateCard({
  candidate,
  saved,
  saveDisabled = false,
  onViewProfile,
  onToggleSave,
}: Props) {
  const hasContact = Boolean(
    candidate.contact.email ||
      candidate.contact.linkedin ||
      candidate.contact.github ||
      candidate.contact.portfolio,
  );

  return (
    <article className="cw-card-elevated cw-candidate-card h-full flex flex-col overflow-hidden">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <Avatar className="h-11 w-11 shrink-0 border border-border/60">
              <AvatarFallback className="cw-avatar-solid text-sm">
                {initials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-[0.9375rem] tracking-tight leading-tight truncate">
                {candidate.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{candidate.major}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {candidate.university} · {candidate.year}
              </p>
            </div>
          </div>
          <CompatibilityRing value={candidate.matchScore} size={52} />
        </div>

        <div className="mt-4">
          <p className="cw-section-label mb-2">Matching skills</p>
          <div className="flex flex-wrap gap-1.5">
            {candidate.matchingSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="rounded-md text-[10px] font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4 cw-insight-panel flex-1">
          <p className="text-[11px] font-semibold text-[hsl(var(--cw-accent))] flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden />
            Why this match
          </p>
          <ul className="text-xs text-muted-foreground mt-2.5 space-y-1.5 leading-relaxed">
            {candidate.insights.slice(0, 4).map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-[hsl(var(--cw-accent))]/60 shrink-0">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/60">
          <Button
            type="button"
            size="sm"
            className="rounded-lg flex-1 h-9 cw-btn-gradient border-0"
            onClick={onViewProfile}
          >
            {hasContact ? (
              <>
                <Mail className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                Profile & contact
              </>
            ) : (
              "View profile"
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              "rounded-lg shrink-0 h-9 w-9 p-0",
              saved && "text-[hsl(var(--cw-accent))] border-[hsl(var(--cw-accent)/0.35)] bg-[hsl(var(--cw-accent-muted))]",
            )}
            aria-label={saved ? "Unsave candidate" : "Save candidate"}
            disabled={saveDisabled}
            onClick={onToggleSave}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </Button>
        </div>
      </div>
    </article>
  );
}
