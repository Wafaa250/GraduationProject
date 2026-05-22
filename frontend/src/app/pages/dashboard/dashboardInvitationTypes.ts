export type DashboardInvitationKind = "graduation_project" | "course_team";

export interface DashboardInvitation {
  id: number;
  kind: DashboardInvitationKind;
  project: string;
  invitedBy: string;
}
