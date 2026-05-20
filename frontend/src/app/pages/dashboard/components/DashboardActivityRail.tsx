import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Trophy, UserPlus, Users } from "lucide-react";

import type { SuggestedTeammate } from "../../../../api/dashboardApi";
import { AIRecommendationCard } from "../../../components/design-system";
import { Button } from "../../../components/ui/button";
import { getProfileUrl } from "../../../components/common/ProfileLink";

export type DashboardActivityRailProps = {
  teammateCount: number | string;
  matchedProjects: number | string;
  bestMatch: string;
  inviteCount: number;
  topTeammate?: SuggestedTeammate | null;
  onViewMatch?: () => void;
};

export function DashboardActivityRail({
  teammateCount,
  matchedProjects,
  bestMatch,
  inviteCount,
  topTeammate,
  onViewMatch,
}: DashboardActivityRailProps) {
  const matchReason = topTeammate
    ? topTeammate.skills.length > 0
      ? `Your profile aligns on ${topTeammate.skills.slice(0, 3).join(", ")} — ${topTeammate.matchScore}% compatibility.`
      : `${topTeammate.name} is a ${topTeammate.matchScore}% match for your current skills and goals.`
    : undefined;

  return (
    <div className="space-y-4">
      {topTeammate ? (
        <AIRecommendationCard
          title={`Pair with ${topTeammate.name}`}
          reason={matchReason}
        >
          {onViewMatch ? (
            <Button size="sm" variant="ai" className="mt-3" onClick={onViewMatch}>
              View match
            </Button>
          ) : (
            <Button size="sm" variant="ai" className="mt-3" asChild>
              <Link
                to={
                  getProfileUrl({ role: "student", userId: topTeammate.userId }) ??
                  "/students"
                }
              >
                View match
              </Link>
            </Button>
          )}
        </AIRecommendationCard>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="font-display text-sm font-semibold">Your activity</h3>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatPill icon={Users} label="Matches" value={String(teammateCount)} />
          <StatPill icon={UserPlus} label="Invites" value={String(inviteCount)} />
          <StatPill icon={Briefcase} label="Projects" value={String(matchedProjects)} />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            Best match
          </span>
          <span className="font-bold text-foreground">{bestMatch}</span>
        </div>
      </div>

      <Link
        to="/student/courses"
        className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-soft transition-colors hover:bg-muted/40"
      >
        <span>Explore course teams & legacy projects</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-2 py-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 font-display text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
