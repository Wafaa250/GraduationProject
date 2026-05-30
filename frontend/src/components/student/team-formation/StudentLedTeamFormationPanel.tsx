import {
  Check,
  Clock,
  Loader2,
  Mail,
  Sparkles,
  UserPlus,
  Users,
  X,
  Inbox,
  Send,
  UserSearch,
} from "lucide-react";
import type {
  AiTeamRecommendation,
  CourseEnrollmentStudent,
  ManualTeamStudent,
  TeamInvitationItem,
} from "@/api/studentCoursesApi";
import { Button } from "@/components/ui/button";
import { initialsFromName } from "@/lib/studentManageCourses";
import {
  INVITE_STATUS_CARD,
  matchScoreBadgeClass,
  parseMatchReasonBullets,
  resolveStudentInviteStatus,
  sectionBadgeClass,
  type StudentInviteStatus,
} from "@/lib/teamFormationPresentation";
import { cn } from "@/lib/utils";

type StudentLedTeamFormationPanelProps = {
  roster: ManualTeamStudent[];
  aiSuggestions: AiTeamRecommendation[];
  aiLoaded: boolean;
  aiLoading: boolean;
  receivedInvites: TeamInvitationItem[];
  sentPending: ManualTeamStudent[];
  enrollmentByStudentId: Record<number, CourseEnrollmentStudent>;
  inviteBusyId: number | null;
  invitationBusyId: number | null;
  onGenerateAi: () => void;
  onInvite: (receiverId: number) => void;
  onAcceptInvite: (invitationId: number) => void;
  onRejectInvite: (invitationId: number) => void;
};

export function StudentLedTeamFormationPanel({
  roster,
  aiSuggestions,
  aiLoaded,
  aiLoading,
  receivedInvites,
  sentPending,
  enrollmentByStudentId,
  inviteBusyId,
  invitationBusyId,
  onGenerateAi,
  onInvite,
  onAcceptInvite,
  onRejectInvite,
}: StudentLedTeamFormationPanelProps) {
  return (
    <div className="space-y-8">
      <section className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Find teammates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse classmates and send invitations to build your team.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg border-primary/30 bg-primary-soft/50 hover:bg-primary-soft"
            disabled={aiLoading}
            onClick={onGenerateAi}
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
            Generate AI suggestions
          </Button>
        </div>

        {roster.length === 0 ? (
          <TeamFormationEmptyState
            icon={Users}
            title="No eligible classmates"
            description="There are no classmates available for this project right now. Check back later or ask your instructor."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {roster.map((student) => (
              <StudentRosterCard
                key={student.id}
                name={student.name}
                major={enrollmentByStudentId[student.id]?.major?.trim() || "—"}
                sectionName={student.sectionName}
                skills={student.skills}
                status={resolveStudentInviteStatus(student)}
                busy={inviteBusyId === student.id}
                onInvite={() => onInvite(student.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {aiLoaded ? (
        <section className="rounded-2xl border border-primary/20 bg-gradient-soft p-6 shadow-card space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI Recommended
            </span>
            <h2 className="font-display text-lg font-bold">Recommended teammates</h2>
          </div>

          {aiSuggestions.length === 0 ? (
            <TeamFormationEmptyState
              icon={UserSearch}
              title="No recommended teammates"
              description="AI could not find strong matches right now. Try browsing available students or generate suggestions again later."
              compact
            />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {aiSuggestions.map((rec) => (
                <AiRecommendationCard
                  key={rec.studentId}
                  recommendation={rec}
                  major={rec.major?.trim() || enrollmentByStudentId[rec.studentId]?.major?.trim() || "—"}
                  status={resolveStudentInviteStatus(rec)}
                  busy={inviteBusyId === rec.studentId}
                  onInvite={() => onInvite(rec.studentId)}
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <ReceivedInvitationsSection
        invites={receivedInvites}
        enrollmentByStudentId={enrollmentByStudentId}
        busyId={invitationBusyId}
        onAccept={onAcceptInvite}
        onReject={onRejectInvite}
      />

      <SentPendingSection pending={sentPending} />
    </div>
  );
}

function StudentAvatar({ name, avatar }: { name: string; avatar?: string | null }) {
  if (avatar?.trim()) {
    return (
      <img
        src={avatar}
        alt=""
        className="h-11 w-11 rounded-full object-cover ring-2 ring-background shrink-0"
      />
    );
  }
  return (
    <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-sm font-bold shrink-0 ring-2 ring-background">
      {initialsFromName(name)}
    </div>
  );
}

function SectionBadge({ sectionName }: { sectionName: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        sectionBadgeClass(sectionName),
      )}
    >
      {sectionName}
    </span>
  );
}

function StatusChip({ status }: { status: StudentInviteStatus }) {
  const config = INVITE_STATUS_CARD[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} aria-hidden />
      {config.label}
    </span>
  );
}

function MatchScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tabular-nums",
        matchScoreBadgeClass(score),
      )}
    >
      {score}% match
    </span>
  );
}

function StudentRosterCard({
  name,
  major,
  sectionName,
  skills,
  status,
  busy,
  onInvite,
}: {
  name: string;
  major: string;
  sectionName: string;
  skills: string[];
  status: StudentInviteStatus;
  busy: boolean;
  onInvite: () => void;
}) {
  const card = INVITE_STATUS_CARD[status];
  const disabled = status === "in-team" || status === "unavailable";

  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-4 shadow-soft transition-smooth",
        card.border,
        card.muted && "opacity-75",
        !disabled && "hover:-translate-y-0.5 hover:shadow-elevated",
      )}
    >
      <div className="flex items-start gap-3">
        <StudentAvatar name={name} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-foreground leading-snug">{name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{major}</div>
            </div>
            <StatusChip status={status} />
          </div>
          <SectionBadge sectionName={sectionName} />
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 4).map((s) => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                  {s}
                </span>
              ))}
              {skills.length > 4 ? (
                <span className="text-[10px] text-muted-foreground">+{skills.length - 4}</span>
              ) : null}
            </div>
          ) : null}
          <InviteAction
            status={status}
            busy={busy}
            onInvite={onInvite}
            compact
          />
        </div>
      </div>
    </li>
  );
}

function AiRecommendationCard({
  recommendation,
  major,
  status,
  busy,
  onInvite,
}: {
  recommendation: AiTeamRecommendation;
  major: string;
  status: StudentInviteStatus;
  busy: boolean;
  onInvite: () => void;
}) {
  const bullets = parseMatchReasonBullets(recommendation.matchReason, recommendation.skills.length);
  const card = INVITE_STATUS_CARD[status];
  const disabled = status === "in-team" || status === "unavailable";

  return (
    <li
      className={cn(
        "rounded-xl border border-primary/25 bg-card p-4 shadow-soft transition-smooth",
        card.border,
        !disabled && "hover:-translate-y-0.5 hover:shadow-elevated",
        card.muted && "opacity-75",
      )}
    >
      <div className="flex items-start gap-3">
        <StudentAvatar name={recommendation.name} avatar={recommendation.avatar} />
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-foreground">{recommendation.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{major}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <MatchScoreBadge score={recommendation.matchScore} />
              <StatusChip status={status} />
            </div>
          </div>

          <SectionBadge sectionName={recommendation.sectionName} />

          {bullets.length > 0 ? (
            <div className="rounded-lg border border-primary/15 bg-primary-soft/60 px-3 py-2.5 space-y-1">
              {bullets.map((line) => (
                <p key={line} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0 text-success mt-0.5" aria-hidden />
                  <span>{line}</span>
                </p>
              ))}
            </div>
          ) : null}

          {recommendation.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {recommendation.skills.slice(0, 5).map((s) => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary">
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          <InviteAction status={status} busy={busy} onInvite={onInvite} compact />
        </div>
      </div>
    </li>
  );
}

function InviteAction({
  status,
  busy,
  onInvite,
  compact,
}: {
  status: StudentInviteStatus;
  busy: boolean;
  onInvite: () => void;
  compact?: boolean;
}) {
  if (status === "in-team") {
    return <span className="text-xs font-medium text-muted-foreground">On your team</span>;
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
        <Clock className="h-3.5 w-3.5" />
        Invitation pending
      </span>
    );
  }
  if (status === "unavailable") {
    return <span className="text-xs font-medium text-muted-foreground">Unavailable</span>;
  }
  return (
    <Button
      type="button"
      size={compact ? "sm" : "default"}
      className="rounded-lg"
      disabled={busy}
      onClick={onInvite}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      Invite
    </Button>
  );
}

function ReceivedInvitationsSection({
  invites,
  enrollmentByStudentId,
  busyId,
  onAccept,
  onReject,
}: {
  invites: TeamInvitationItem[];
  enrollmentByStudentId: Record<number, CourseEnrollmentStudent>;
  busyId: number | null;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}) {
  return (
    <section className="rounded-2xl border border-blue-200/70 bg-card p-6 shadow-card space-y-5 ring-1 ring-blue-100/80">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Received invitations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Teammates who invited you to join their project team.
          </p>
        </div>
      </div>

      {invites.length === 0 ? (
        <TeamFormationEmptyState
          icon={Inbox}
          title="No invitations received"
          description="When a classmate invites you to their team, it will appear here with accept and decline options."
          compact
        />
      ) : (
        <ul className="space-y-3">
          {invites.map((inv) => {
            const major =
              enrollmentByStudentId[inv.senderId]?.major?.trim() || "—";
            return (
              <li
                key={inv.invitationId}
                className="rounded-xl border border-blue-200/60 bg-blue-50/30 p-4 shadow-soft transition-smooth hover:border-blue-300/70 hover:shadow-elevated"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <StudentAvatar name={inv.senderName} />
                    <div className="space-y-2 min-w-0">
                      <div>
                        <div className="font-semibold text-foreground">{inv.senderName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{major}</div>
                      </div>
                      <SectionBadge sectionName={inv.senderSection} />
                      <dl className="grid gap-1 text-[11px] sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground uppercase tracking-wide font-semibold">
                            Project
                          </dt>
                          <dd className="font-medium text-foreground">{inv.projectTitle}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground uppercase tracking-wide font-semibold">
                            Received
                          </dt>
                          <dd className="font-medium text-foreground">{formatInviteDate(inv.invitedAt)}</dd>
                        </div>
                      </dl>
                      {inv.message?.trim() ? (
                        <p className="text-xs text-muted-foreground italic">&ldquo;{inv.message.trim()}&rdquo;</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-lg bg-success text-white border-0 hover:opacity-90"
                      disabled={busyId === inv.invitationId}
                      onClick={() => onAccept(inv.invitationId)}
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-lg"
                      disabled={busyId === inv.invitationId}
                      onClick={() => onReject(inv.invitationId)}
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SentPendingSection({ pending }: { pending: ManualTeamStudent[] }) {
  return (
    <section className="rounded-2xl border border-orange-200/70 bg-card p-6 shadow-card space-y-5 ring-1 ring-orange-100/80">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-warning-soft text-warning shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Pending invitations you sent</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Waiting for classmates to respond to your team invitations.
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <TeamFormationEmptyState
          icon={Send}
          title="No pending invitations"
          description="Invitations you send will appear here while you wait for a response."
          compact
        />
      ) : (
        <ul className="space-y-3">
          {pending.map((student) => (
            <li
              key={student.id}
              className="rounded-xl border border-orange-200/50 bg-warning-soft/30 p-4 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <StudentAvatar name={student.name} avatar={student.avatar} />
                  <div className="space-y-2">
                    <div className="font-semibold text-foreground">{student.name}</div>
                    <SectionBadge sectionName={student.sectionName} />
                    <StatusChip status="pending" />
                  </div>
                </div>
                <WaitingTimeline />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WaitingTimeline() {
  return (
    <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground min-w-[140px]">
      <div className="flex flex-col items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-warning/25" aria-hidden />
        <span className="text-warning">Sent</span>
      </div>
      <div className="h-px flex-1 bg-orange-200/80 relative overflow-hidden">
        <span className="absolute inset-y-0 left-0 w-1/2 bg-warning/40 animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-orange-300 bg-background animate-pulse" aria-hidden />
        <span>Awaiting</span>
      </div>
      <div className="h-px flex-1 bg-border" />
      <div className="flex flex-col items-center gap-1 opacity-50">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-border bg-background" aria-hidden />
        <span>Response</span>
      </div>
    </div>
  );
}

function TeamFormationEmptyState({
  icon: Icon,
  title,
  description,
  compact,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-gradient-soft text-center",
        compact ? "px-5 py-8" : "px-6 py-12",
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-3 font-display text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function formatInviteDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
