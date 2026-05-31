import { Bookmark, Sparkles, Mail } from "lucide-react";
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

        <div className="mt-4 cw-insight-panel flex-1">
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
            className="rounded-xl flex-1 cw-btn-gradient shadow-sm border-0"
            onClick={onViewProfile}
          >
            {hasContact ? (
              <>
                <Mail className="h-3.5 w-3.5 mr-1 shrink-0" />
                Profile & contact
              </>
            ) : (
              "View profile"
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("rounded-xl shrink-0", saved && "text-primary bg-primary/10")}
            aria-label={saved ? "Unsave candidate" : "Save candidate"}
            disabled={saveDisabled}
            onClick={onToggleSave}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
