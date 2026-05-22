import {
  Sparkles,
  CheckCircle2,
  Mail,
  Megaphone,
  LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { DashboardInvitationKind } from "../dashboardInvitationTypes";

export type ActivityItem = {
  id: string;
  icon: LucideIcon;
  color: string;
  title: string;
  desc: string;
  time?: string;
  invitationId?: number;
  invitationKind?: DashboardInvitationKind;
  inviteLoading?: boolean;
  inviteMsg?: { ok: boolean; msg: string } | null;
  onAccept?: () => void;
  onReject?: () => void;
};

type DashboardActivityFeedProps = {
  items: ActivityItem[];
};

export function DashboardActivityFeed({ items }: DashboardActivityFeedProps) {
  return (
    <section className="bg-card border border-border rounded-3xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-lg text-foreground">Recent activity</h2>
        <Link
          to="/student/team-invitations"
          className="text-xs font-semibold text-primary hover:text-primary-glow no-underline"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity yet.</p>
      ) : (
        <ol className="relative space-y-5 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          {items.map((a) => (
            <li key={a.id} className="relative flex gap-4">
              <div
                className={`relative z-10 size-10 rounded-xl grid place-items-center shrink-0 ring-4 ring-card ${a.color}`}
              >
                <a.icon className="size-[18px]" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-sm font-semibold leading-tight text-foreground">
                  {a.title}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
                {a.time ? (
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                    {a.time}
                  </div>
                ) : null}
                {a.onAccept && a.onReject ? (
                  <div className="mt-3 flex gap-2">
                    {a.inviteMsg ? (
                      <p
                        className={`text-xs font-semibold ${a.inviteMsg.ok ? "text-success" : "text-muted-foreground"}`}
                      >
                        {a.inviteMsg.msg}
                      </p>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={a.inviteLoading}
                          onClick={a.onAccept}
                          className="flex-1 text-xs font-semibold bg-gradient-primary text-primary-foreground rounded-lg py-2 disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={a.inviteLoading}
                          onClick={a.onReject}
                          className="flex-1 text-xs font-semibold border border-border rounded-lg py-2 text-foreground disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function buildDashboardActivityItems(params: {
  invitations: Array<{
    id: number;
    kind: DashboardInvitationKind;
    project: string;
    invitedBy: string;
  }>;
  teammateCount: number;
  hasSupervisor: boolean;
  supervisorName?: string;
  matchedProjectsCount: number;
  inviteLoading: number | null;
  inviteMsg: { id: number; msg: string; ok: boolean } | null;
  onInvite: (id: number, action: "accept" | "reject") => void;
}): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const inv of params.invitations.slice(0, 3)) {
    items.push({
      id: `inv-${inv.kind}-${inv.id}`,
      icon: Mail,
      color: "bg-warning/15 text-warning",
      title: "Team invitation received",
      desc: `"${inv.project}" — invited by ${inv.invitedBy}`,
      invitationId: inv.id,
      invitationKind: inv.kind,
      inviteLoading: params.inviteLoading === inv.id,
      inviteMsg:
        params.inviteMsg?.id === inv.id
          ? { ok: params.inviteMsg.ok, msg: params.inviteMsg.msg }
          : null,
      onAccept: () => params.onInvite(inv.id, "accept"),
      onReject: () => params.onInvite(inv.id, "reject"),
    });
  }

  if (params.hasSupervisor && params.supervisorName) {
    items.push({
      id: "supervisor-assigned",
      icon: CheckCircle2,
      color: "bg-success/15 text-success",
      title: "Supervisor assigned",
      desc: `${params.supervisorName} is supervising your graduation project.`,
    });
  }

  if (params.teammateCount > 0) {
    items.push({
      id: "teammate-recs",
      icon: Sparkles,
      color: "bg-primary/15 text-primary",
      title: "Teammate recommendations available",
      desc: `Your dashboard has ${params.teammateCount} suggested teammate${params.teammateCount === 1 ? "" : "s"} based on your profile.`,
    });
  }

  if (params.matchedProjectsCount > 0) {
    items.push({
      id: "matched-projects",
      icon: Megaphone,
      color: "bg-primary-glow/20 text-primary-glow",
      title: "Matched graduation projects",
      desc: `${params.matchedProjectsCount} channel project${params.matchedProjectsCount === 1 ? "" : "s"} match your skills — open Discover Projects to explore.`,
    });
  }

  return items.slice(0, 4);
}
