import { Button } from "@/components/ui/button";
import { Check, GraduationCap, Inbox, X } from "lucide-react";

export type GraduationInvitationView = {
  id: string;
  inviter: string;
  inviterInitials: string;
  project: string;
};

type GraduationTeamInvitationsProps = {
  invitations: GraduationInvitationView[];
  empty?: boolean;
  busyId?: string | null;
  highlightId?: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

export function GraduationTeamInvitations({
  invitations,
  empty = false,
  busyId = null,
  highlightId = null,
  onAccept,
  onDecline,
}: GraduationTeamInvitationsProps) {
  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl border border-dashed border-border bg-secondary/20">
        <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold text-sm">No graduation project invitations</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          When a team invites you to their graduation project, you can accept or decline here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {invitations.map((inv) => (
        <li
          key={inv.id}
          id={`graduation-invitation-${inv.id}`}
          className={
            highlightId === inv.id
              ? "rounded-xl ring-2 ring-primary/40 ring-offset-2 ring-offset-card"
              : undefined
          }
        >
          <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-gradient-card hover:border-primary/30 hover:shadow-soft transition-smooth">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-primary text-primary-foreground font-display font-bold flex items-center justify-center">
                {inv.inviterInitials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {inv.inviter}{" "}
                  <span className="text-muted-foreground font-normal">invited you</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  <GraduationCap className="inline w-3 h-3 mr-1 -mt-0.5" />
                  {inv.project}
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:shrink-0">
              <Button
                size="sm"
                disabled={busyId === inv.id}
                onClick={() => onAccept(inv.id)}
                className="bg-gradient-primary hover:opacity-95 hover:shadow-glow transition-smooth gap-1.5 flex-1 sm:flex-initial"
              >
                <Check className="w-4 h-4" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === inv.id}
                onClick={() => onDecline(inv.id)}
                className="gap-1.5 hover:border-destructive/40 hover:text-destructive transition-smooth flex-1 sm:flex-initial"
              >
                <X className="w-4 h-4" /> Decline
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
