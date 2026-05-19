import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

import { Button } from "../../../components/ui/button";

export type DashboardInvitationRow = {
  id: number;
  kind: "graduation_project" | "course_team";
  project: string;
  invitedBy: string;
};

export type DashboardInvitationsPanelProps = {
  invitations: DashboardInvitationRow[];
  inviteLoading: number | null;
  inviteMsg: { id: number; msg: string; ok: boolean } | null;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
};

export function DashboardInvitationsPanel({
  invitations,
  inviteLoading,
  inviteMsg,
  onAccept,
  onReject,
}: DashboardInvitationsPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
          <UserPlus className="h-4 w-4 text-ai" />
          Pending invitations
        </h3>
        {invitations.length > 0 ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {invitations.length}
          </span>
        ) : null}
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
          <p className="text-2xl">🎉</p>
          <p className="mt-2 text-sm text-muted-foreground">No pending invitations</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {invitations.map((inv) => (
            <li
              key={`${inv.kind}-${inv.id}`}
              className="rounded-xl border border-ai/15 bg-ai-soft/40 p-3"
            >
              <p className="text-xs font-medium text-muted-foreground">Invited to join</p>
              <p className="mt-0.5 font-semibold text-foreground">{inv.project}</p>
              <p className="text-xs text-muted-foreground">by {inv.invitedBy}</p>
              {inviteMsg?.id === inv.id ? (
                <p
                  className={`mt-2 text-xs font-semibold ${inviteMsg.ok ? "text-success" : "text-muted-foreground"}`}
                >
                  {inviteMsg.msg}
                </p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="gradient"
                    className="flex-1"
                    disabled={inviteLoading === inv.id}
                    onClick={() => onAccept(inv.id)}
                  >
                    {inviteLoading === inv.id ? "…" : "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={inviteLoading === inv.id}
                    onClick={() => onReject(inv.id)}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
        <Link to="/student/team-invitations">Open requests</Link>
      </Button>
    </div>
  );
}
