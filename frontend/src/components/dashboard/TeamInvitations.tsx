import { Button } from "@/components/ui/button";
import { Check, X, Inbox, Users } from "lucide-react";

export type TeamInvitationView = {
  id: string;
  inviter: string;
  inviterInitials: string;
  team: string;
  project: string;
};

type TeamInvitationsProps = {
  invitations: TeamInvitationView[];
  empty?: boolean;
  busyId?: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

export const TeamInvitations = ({
  invitations,
  empty = false,
  busyId = null,
  onAccept,
  onDecline,
}: TeamInvitationsProps) => (
  <section
    aria-labelledby="invites-heading"
    className="rounded-2xl bg-card border border-border shadow-soft p-6 md:p-7 animate-fade-in-up h-full flex flex-col"
  >
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 id="invites-heading" className="text-xl font-display font-bold tracking-tight">
          Team Invitations
        </h2>
        <p className="text-sm text-muted-foreground">Pending invitations from project teams.</p>
      </div>
      {!empty && (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          {invitations.length} pending
        </span>
      )}
    </div>

    {empty ? (
      <EmptyInvitations />
    ) : (
      <ul className="space-y-3 flex-1">
        {invitations.map((inv) => (
          <li
            key={inv.id}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-gradient-card hover:border-primary/30 hover:shadow-soft transition-smooth"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-accent text-primary-foreground font-display font-bold flex items-center justify-center">
                {inv.inviterInitials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {inv.inviter} <span className="text-muted-foreground font-normal">invited you</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  <Users className="inline w-3 h-3 mr-1 -mt-0.5" />
                  {inv.team} · <span className="text-foreground/70">{inv.project}</span>
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
          </li>
        ))}
      </ul>
    )}
  </section>
);

const EmptyInvitations = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4">
    <div className="relative mb-5">
      <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-2xl rounded-full" aria-hidden />
      <div className="relative w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center">
        <Inbox className="w-7 h-7 text-muted-foreground" />
      </div>
    </div>
    <h3 className="font-display font-semibold">No pending invitations</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
      When teams invite you to collaborate, their pending invitations will appear right here.
    </p>
  </div>
);
