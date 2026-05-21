import { TeammateMatchCard } from "../../../components/design-system";
import { cn } from "../../../components/ui/utils";

import type { BrowseStudentDto } from "../../../../api/studentsBrowseApi";

export type BrowseStudentCardStudent = BrowseStudentDto;

export type BrowseStudentCardProps = {
  student: BrowseStudentCardStudent;
  profileHref: string;
  onInvite?: () => void;
  isTeamFull?: boolean;
  isSending?: boolean;
  highlight?: boolean;
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function buildSubtitle(student: BrowseStudentCardStudent): string {
  return [student.major, student.university, student.academicYear]
    .filter(Boolean)
    .join(" · ");
}

function buildMatchReason(
  student: BrowseStudentCardStudent,
  projectInviteMode: boolean,
): string | undefined {
  if (student.skills.length > 0) {
    const listed = student.skills.slice(0, 3).join(", ");
    return `Strong overlap in ${listed}, aligned with your project needs.`;
  }
  if (student.matchScore > 0) {
    if (student.skills.length === 0 && student.matchScore <= 25) {
      const major = student.major?.trim();
      return major
        ? `Same major (${major}) — add skills to their profile for a stronger match score.`
        : "Limited skill data on profile — open their profile to assess fit.";
    }
    return `Matched at ${student.matchScore}% based on your profile and project requirements.`;
  }
  if (projectInviteMode) {
    const major = student.major?.trim();
    return major
      ? `Same major (${major}) — review their profile for skill fit with your project.`
      : "Review their profile to see how they fit your graduation project.";
  }
  return undefined;
}

function resolveInviteAction(
  student: BrowseStudentCardStudent,
  onInvite: (() => void) | undefined,
  isTeamFull: boolean,
): {
  onInvite?: () => void;
  inviteLoading?: boolean;
  inviteDisabled?: boolean;
  inviteLabel?: string;
} {
  if (!onInvite) return {};

  if (student.isMember) {
    return { inviteDisabled: true, inviteLabel: "Member" };
  }
  if (student.hasPendingInvite) {
    return { inviteDisabled: true, inviteLabel: "Pending" };
  }
  if (isTeamFull) {
    return { inviteDisabled: true, inviteLabel: "Team full" };
  }
  if (!student.canInvite) {
    return {
      inviteDisabled: true,
      inviteLabel: student.ownsGraduationProject ? "Own project" : "Unavailable",
    };
  }
  return { onInvite, inviteLabel: "Invite" };
}

export function BrowseStudentCard({
  student,
  profileHref,
  onInvite,
  isTeamFull = false,
  isSending = false,
  highlight = false,
}: BrowseStudentCardProps) {
  const invite = resolveInviteAction(student, onInvite, isTeamFull);

  return (
    <TeammateMatchCard
      userId={student.userId}
      studentProfileId={student.profileId}
      name={student.name}
      subtitle={buildSubtitle(student)}
      initials={initials(student.name)}
      profilePicture={student.profilePicture}
      matchScore={student.matchScore}
      skills={student.skills}
      matchReason={buildMatchReason(student, Boolean(onInvite))}
      inviteLoading={isSending}
      profileHref={invite.onInvite ? undefined : profileHref}
      className={cn(
        highlight && "border-primary/25 ring-1 ring-primary/15",
      )}
      {...invite}
    />
  );
}
