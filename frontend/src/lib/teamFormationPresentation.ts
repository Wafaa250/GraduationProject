export type StudentInviteStatus = "available" | "pending" | "in-team" | "unavailable";

export function resolveStudentInviteStatus(input: {
  hasPendingRequest: boolean;
  isAlreadyInTeam: boolean;
  availabilityStatus?: string;
}): StudentInviteStatus {
  if (input.isAlreadyInTeam) return "in-team";
  if (input.hasPendingRequest || input.availabilityStatus === "pending") return "pending";
  if (input.availabilityStatus === "unavailable") return "unavailable";
  return "available";
}

const SECTION_STYLES: Record<string, string> = {
  A: "border-purple-200/80 bg-purple-50 text-purple-700",
  B: "border-blue-200/80 bg-blue-50 text-blue-700",
  C: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  D: "border-orange-200/80 bg-orange-50 text-orange-700",
};

export function sectionBadgeClass(sectionName: string): string {
  const match = sectionName.match(/section\s*([a-z])/i);
  const letter = match?.[1]?.toUpperCase() ?? "";
  return (
    SECTION_STYLES[letter] ??
    "border-border bg-secondary/80 text-muted-foreground"
  );
}

export function matchScoreBadgeClass(score: number): string {
  if (score >= 90) return "border-emerald-700/30 bg-emerald-700/10 text-emerald-800";
  if (score >= 75) return "border-emerald-500/30 bg-emerald-50 text-emerald-700";
  if (score >= 60) return "border-blue-300/80 bg-blue-50 text-blue-700";
  if (score >= 40) return "border-orange-300/80 bg-orange-50 text-orange-700";
  return "border-border bg-secondary text-muted-foreground";
}

export const INVITE_STATUS_CARD: Record<
  StudentInviteStatus,
  { border: string; dot: string; label: string; muted?: boolean }
> = {
  available: {
    border: "border-emerald-300/70 hover:border-emerald-400/80 hover:shadow-soft",
    dot: "bg-emerald-500",
    label: "Available",
  },
  pending: {
    border: "border-orange-300/70",
    dot: "bg-orange-500",
    label: "Invitation Sent",
  },
  "in-team": {
    border: "border-border/80",
    dot: "bg-muted-foreground/50",
    label: "Already In Team",
    muted: true,
  },
  unavailable: {
    border: "border-border/80",
    dot: "bg-muted-foreground/40",
    label: "Unavailable",
    muted: true,
  },
};

export function parseMatchReasonBullets(reason: string, skillCount?: number): string[] {
  const trimmed = reason.trim();
  if (trimmed) {
    return trimmed
      .replace(/\.\s*$/, "")
      .split(/;\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (skillCount && skillCount > 0) {
    return [`${skillCount} shared skill${skillCount === 1 ? "" : "s"}`];
  }
  return [];
}
