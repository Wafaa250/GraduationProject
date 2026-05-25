import { Bookmark, Check, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

function availabilityDot(availability: RecommendationCandidate["availability"]): string {
  if (availability === "Available") return "bg-emerald-500";
  if (availability === "Limited") return "bg-amber-500";
  return "bg-red-500";
}

type Props = {
  candidate: RecommendationCandidate;
  saved: boolean;
  invitationSent: boolean;
  onViewProfile: () => void;
  onInvite: () => void;
  onToggleSave: () => void;
};

export function CompanyCandidateCard({
  candidate,
  saved,
  invitationSent,
  onViewProfile,
  onInvite,
  onToggleSave,
}: Props) {
  return (
    <Card className="cw-card-elevated cw-candidate-card h-full">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="cw-candidate-avatar-fallback text-sm font-medium">
                {initials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">{candidate.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{candidate.major}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {candidate.university} · {candidate.year}
              </p>
            </div>
          </div>
          <CompatibilityRing value={candidate.matchScore} size={56} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn("h-2 w-2 rounded-full shrink-0", availabilityDot(candidate.availability))}
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">{candidate.availability}</span>
        </div>

        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
            Matching skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {candidate.matchingSkills.map((skill) => (
              <Badge key={skill} className="cw-candidate-skill-badge rounded-md text-[10px]">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 flex-1">
          <p className="text-[11px] font-medium text-primary flex items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden />
            Why this match?
          </p>
          <ul className="text-[11px] text-muted-foreground mt-2 space-y-1 leading-relaxed">
            {candidate.insights.slice(0, 4).map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl flex-1"
            onClick={onViewProfile}
          >
            View Profile
          </Button>
          <Button
            type="button"
            size="sm"
            variant={invitationSent ? "outline" : "default"}
            className={cn(
              "rounded-xl flex-1",
              invitationSent
                ? "text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                : "cw-btn-gradient shadow-sm border-0",
            )}
            disabled={invitationSent}
            onClick={onInvite}
          >
            {invitationSent ? (
              <>
                <Check className="h-4 w-4 mr-1 shrink-0" aria-hidden />
                Invitation Sent
              </>
            ) : (
              "Invite"
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("rounded-xl shrink-0", saved && "text-primary bg-primary/10")}
            aria-label={saved ? "Unsave candidate" : "Save candidate"}
            onClick={onToggleSave}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
