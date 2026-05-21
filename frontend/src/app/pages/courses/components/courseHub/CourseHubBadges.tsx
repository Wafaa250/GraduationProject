import { Bot, CheckCircle2, Clock, GraduationCap, Users, XCircle } from "lucide-react";

import { Badge } from "../../../../components/ui/badge";
import { cn } from "../../../../components/ui/utils";

/** Same purple pill on every course-hub status chip */
const hubChip = "course-hub-chip";
const hubChipMuted = "course-hub-chip-muted";

export function AiModeChip({ mode }: { mode: "doctor" | "student" }) {
  if (mode === "student") {
    return (
      <Badge variant="outline" className={cn(hubChip, "border-0")}>
        <Users className="h-3 w-3" />
        You pick the team
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn(hubChip, "border-0")}>
      <GraduationCap className="h-3 w-3" />
      Doctor assigns teams
    </Badge>
  );
}

export function HasTeamBadge({ has }: { has: boolean }) {
  return has ? (
    <Badge variant="outline" className={cn(hubChip, "border-0")}>
      <CheckCircle2 className="h-3 w-3" />
      In a team
    </Badge>
  ) : (
    <Badge variant="outline" className={cn(hubChipMuted, "border-0")}>
      <Clock className="h-3 w-3" />
      No team yet
    </Badge>
  );
}

export type AvailabilityStatus =
  | "available"
  | "pending"
  | "already_teammate"
  | "unavailable"
  | string;

const statusConfig: Record<
  string,
  { label: string; muted?: boolean; icon: typeof Clock }
> = {
  available: { label: "Available", icon: CheckCircle2 },
  pending: { label: "Invitation sent", icon: Clock },
  already_teammate: { label: "Already in a team", icon: Users },
  unavailable: { label: "Unavailable", muted: true, icon: XCircle },
};

export function AvailabilityBadge({
  status,
  reason,
}: {
  status: AvailabilityStatus;
  reason?: string | null;
}) {
  const c = statusConfig[status] ?? statusConfig.unavailable;
  const Icon = c.icon;
  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant="outline"
        className={cn("w-fit border-0", c.muted ? hubChipMuted : hubChip)}
      >
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
      {reason ? <span className="text-xs text-muted-foreground">{reason}</span> : null}
    </div>
  );
}

export function MatchScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-glow">
      <Bot className="h-3 w-3" />
      {Math.round(score)}% match
    </div>
  );
}
