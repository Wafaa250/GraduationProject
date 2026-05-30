import { Users2, Calendar, Check, X, Loader2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ActionButton } from "./ActionButton";
export type DoctorRequestCardModel = {
  id: string;
  requestId: number;
  student: string;
  avatarInitials: string;
  major: string;
  title: string;
  skills: string[];
  team: number;
  date: string;
  status: string;
};

type RequestCardProps = {
  r: DoctorRequestCardModel;
  onAccept?: (requestId: number) => void;
  onReject?: (requestId: number) => void;
  busyRequestId?: number | null;
};

export function RequestCard({ r, onAccept, onReject, busyRequestId }: RequestCardProps) {
  const isPending = r.status === "pending";
  const busy = busyRequestId === r.requestId;

  return (
    <div className="group rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card hover:shadow-elevated hover:border-primary/30 transition-smooth">
      <div className="flex items-start gap-3">
        <div
          className="h-11 w-11 rounded-full ring-2 ring-primary/10 bg-gradient-primary grid place-items-center text-xs font-bold text-primary-foreground shrink-0"
          aria-hidden
        >
          {r.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-[14px]">{r.student}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[12px] text-muted-foreground">{r.major}</span>
              </div>
              <h3 className="mt-1 font-display text-[15px] font-semibold text-foreground leading-snug">
                {r.title}
              </h3>
            </div>
            <StatusBadge status={r.status} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.skills.map((s) => (
              <span
                key={s}
                className="rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium px-2 py-0.5 border border-border"
              >
                {s}
              </span>
            ))}
          </div>

          <div className="mt-3.5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5" /> Team of {r.team}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {r.date}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ActionButton
                variant="danger"
                disabled={!isPending || busy}
                onClick={() => onReject?.(r.requestId)}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Reject
              </ActionButton>
              <ActionButton
                variant="primary"
                disabled={!isPending || busy}
                onClick={() => onAccept?.(r.requestId)}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Accept
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
