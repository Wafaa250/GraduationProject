import type { GradProject } from "@/api/gradProjectApi";

/** Invite-status flags returned by recommended/available student APIs. */
export type GradProjectInviteFlags = {
  studentId: number;
  isMember?: boolean;
  hasPendingInvite?: boolean;
  isOwner?: boolean;
  ownsGraduationProject?: boolean;
  canInvite?: boolean;
};

export type GradProjectInviteContext = {
  ownerStudentId: number;
  memberStudentIds: ReadonlySet<number>;
  pendingInviteStudentIds: ReadonlySet<number>;
};

export function buildGradProjectInviteContext(
  project: Pick<GradProject, "ownerId" | "members">,
  pendingInviteStudentIds?: Iterable<number>,
): GradProjectInviteContext {
  return {
    ownerStudentId: project.ownerId,
    memberStudentIds: new Set((project.members ?? []).map((m) => m.studentId)),
    pendingInviteStudentIds: new Set(pendingInviteStudentIds ?? []),
  };
}

/**
 * Mirrors backend canInvite rules for graduation-project teammate invites.
 * Used to keep AI recommendations and browse lists aligned with web invite eligibility.
 */
export function isGradProjectInviteCandidate(
  student: GradProjectInviteFlags,
  context: GradProjectInviteContext,
): boolean {
  if (student.studentId <= 0) return false;
  if (student.studentId === context.ownerStudentId) return false;
  if (context.memberStudentIds.has(student.studentId)) return false;
  if (context.pendingInviteStudentIds.has(student.studentId)) return false;
  if (student.isOwner === true) return false;
  if (student.isMember === true) return false;
  if (student.hasPendingInvite === true) return false;
  if (student.ownsGraduationProject === true) return false;
  if (student.canInvite === false) return false;
  return true;
}

export function filterGradProjectInviteCandidates<T extends GradProjectInviteFlags>(
  students: T[],
  context: GradProjectInviteContext,
): T[] {
  return students.filter((student) => isGradProjectInviteCandidate(student, context));
}
