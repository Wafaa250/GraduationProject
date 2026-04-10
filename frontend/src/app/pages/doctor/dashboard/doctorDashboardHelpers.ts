import type { DoctorSupervisedProject } from "../doctorDashboardTypes";

export type ProjectHighlight = {
  name: string;
  role: string;
  memberCount: number;
  maxTeamSize: number;
  isFull: boolean;
};

export type SupervisedStudentRow = {
  userId: number;
  name: string;
  major: string;
  university: string;
};

export function buildOverviewHighlightFromSupervised(
  projects: DoctorSupervisedProject[],
): ProjectHighlight | null {
  const p = projects[0];
  if (!p) return null;
  return {
    name: p.name,
    role: "Supervisor",
    memberCount: p.memberCount,
    maxTeamSize: Math.max(p.partnersCount, 1),
    isFull: p.isFull,
  };
}

export function buildSupervisedStudentRows(projects: DoctorSupervisedProject[]): SupervisedStudentRow[] {
  const m = new Map<number, SupervisedStudentRow>();
  for (const proj of projects) {
    const o = proj.owner;
    if (m.has(o.userId)) continue;
    m.set(o.userId, {
      userId: o.userId,
      name: o.name,
      major: o.major,
      university: o.university,
    });
  }
  return [...m.values()].slice(0, 12);
}
