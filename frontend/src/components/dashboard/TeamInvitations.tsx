import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamInvitationKind, UnifiedTeamInvitation } from "@/lib/teamInvitationInbox";
import { Check, GraduationCap, Inbox, Users, X } from "lucide-react";

export type TeamInvitationView = UnifiedTeamInvitation;

type TeamInvitationsProps = {
  invitations: TeamInvitationView[];
  empty?: boolean;
  busyId?: string | null;
  highlightId?: string | null;
  onAccept: (invitation: TeamInvitationView) => void;
  onDecline: (invitation: TeamInvitationView) => void;
};

const TYPE_LABELS: Record<TeamInvitationKind, string> = {
  course: "Course team",
  graduation: "Graduation project",
  future: "Team invitation",
};

function TypeIcon({ kind }: { kind: TeamInvitationKind }) {
  if (kind === "graduation") {
    return <GraduationCap className="inline w-3 h-3 mr-1 -mt-0.5" />;
  }
  return <Users className="inline w-3 h-3 mr-1 -mt-0.5" />;
}

export const TeamInvitations = ({
  invitations,
  empty = false,
  busyId = null,
  highlightId = null,
  onAccept,
  onDecline,
}: TeamInvitationsProps) => {
  const actionableCount = invitations.filter((inv) => inv.actionable).length;

  return (
    <section
      aria-labelledby="invites-heading"
      className="rounded-2xl bg-card border border-border shadow-soft p-6 md:p-7 animate-fade-in-up flex flex-col"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 id="invites-heading" className="text-xl font-display font-bold tracking-tight">
            Team Invitations
          </h2>
          <p className="text-sm text-muted-foreground">
            Course, graduation, and other team invitations.
          </p>
        </div>
        {!empty && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {invitations.length} total
            {actionableCount !== invitations.length
              ? ` · ${actionableCount} pending`
              : ""}
          </span>
        )}
      </div>

      {empty ? (
        <EmptyInvitations />
      ) : (
        <ul className="space-y-3">
          {invitations.map((inv) => (
            <li
              key={inv.id}
              id={`${inv.kind}-invitation-${inv.rawId}`}
              className={cn(
                "group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-gradient-card hover:border-primary/30 hover:shadow-soft transition-smooth",
                highlightId === inv.rawId || highlightId === inv.id
                  ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-card"
                  : undefined,
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-accent text-primary-foreground font-display font-bold flex items-center justify-center">
                  {inv.inviterInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {TYPE_LABELS[inv.kind]}
                    </Badge>
                    {!inv.actionable && (
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {inv.status}
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-sm truncate">
                    {inv.inviter}{" "}
                    <span className="text-muted-foreground font-normal">invited you</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    <TypeIcon kind={inv.kind} />
                    {inv.team} · <span className="text-foreground/70">{inv.project}</span>
                  </p>
                </div>
              </div>
              {inv.actionable ? (
                <div className="flex gap-2 sm:shrink-0">
                  <Button
                    size="sm"
                    disabled={busyId === inv.id}
                    onClick={() => onAccept(inv)}
                    className="bg-gradient-primary hover:opacity-95 hover:shadow-glow transition-smooth gap-1.5 flex-1 sm:flex-initial"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === inv.id}
                    onClick={() => onDecline(inv)}
                    className="gap-1.5 hover:border-destructive/40 hover:text-destructive transition-smooth flex-1 sm:flex-initial"
                  >
                    <X className="w-4 h-4" /> Decline
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground sm:text-right sm:max-w-[10rem]">
                  This invitation is {inv.status}. No action required.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const EmptyInvitations = () => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
    <div className="relative mb-5">
      <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-2xl rounded-full" aria-hidden />
      <div className="relative w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center">
        <Inbox className="w-7 h-7 text-muted-foreground" />
      </div>
    </div>
    <h3 className="font-display font-semibold">No team invitations</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
      When teams invite you to collaborate, invitations will appear here.
    </p>
  </div>
);
