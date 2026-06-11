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

const SECTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "#F3E8FF", text: "#6B21A8", border: "#E9D5FF" },
  B: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  C: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  D: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
};

export function sectionBadgeColors(sectionName: string): { bg: string; text: string; border: string } {
  const match = sectionName.match(/section\s*([a-z])/i);
  const letter = match?.[1]?.toUpperCase() ?? "";
  return (
    SECTION_COLORS[letter] ?? {
      bg: "#F4F4F5",
      text: "#71717A",
      border: "#E4E4E7",
    }
  );
}

export function matchScoreBadgeColors(score: number): { bg: string; text: string; border: string } {
  if (score >= 90) return { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" };
  if (score >= 75) return { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" };
  if (score >= 60) return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" };
  if (score >= 40) return { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" };
  return { bg: "#F4F4F5", text: "#71717A", border: "#E4E4E7" };
}

export const INVITE_STATUS_LABEL: Record<StudentInviteStatus, string> = {
  available: "Available",
  pending: "Invitation Sent",
  "in-team": "Already In Team",
  unavailable: "Unavailable",
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
