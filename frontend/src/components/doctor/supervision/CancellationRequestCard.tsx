import { Check, Loader2, UserMinus, X } from "lucide-react";
import type { DoctorSupervisorCancelRequest } from "@/api/doctorDashboardApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  avatarGradientClass,
  normalizeSupervisionStatus,
  supervisionStatusUi,
} from "@/lib/supervisionRequestUi";
import { supervisionRequestLabel } from "@/lib/doctorRequestInbox";
import { cn } from "@/lib/utils";

type CancellationRequestCardProps = {
  request: DoctorSupervisorCancelRequest;
  busyRequestId?: number | null;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
};

function studentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function CancellationRequestCard({
  request: r,
  busyRequestId,
  onAccept,
  onReject,
}: CancellationRequestCardProps) {
  const status = supervisionStatusUi(r.status);
  const normalized = normalizeSupervisionStatus(r.status);
  const isPending = normalized === "pending";
  const busy = busyRequestId === r.requestId;
  const studentName = r.studentName?.trim() || "Student";
  const projectName = r.projectName?.trim() || "Graduation project";
  const code = `CAN-${String(r.requestId).padStart(5, "0")}`;

  return (
    <article className="group rounded-2xl border border-warning/25 bg-card p-5 shadow-card hover:shadow-elevated hover:border-warning/40 transition-smooth animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center text-white text-sm font-semibold shrink-0",
              avatarGradientClass(studentName),
            )}
            aria-hidden
          >
            {studentInitials(studentName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-[15px] truncate">{studentName}</h3>
              <span className="text-xs text-muted-foreground font-mono">{code}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warning mt-1">
              {supervisionRequestLabel("cancellation")}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("gap-1.5 font-medium border shrink-0", status.cls)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </Badge>
      </div>

      <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 mb-4">
        <div className="flex items-start gap-2">
          <UserMinus className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Project
            </p>
            <h4 className="font-display font-semibold text-foreground text-base leading-snug">
              {projectName}
            </h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              The project leader requested to end your supervision for this project.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border flex-wrap">
        {isPending ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => onReject(r.requestId)}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />
              ) : (
                <X className="h-4 w-4 mr-1.5" aria-hidden />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              className="bg-gradient-primary text-primary-foreground shadow-glow"
              disabled={busy}
              onClick={() => onAccept(r.requestId)}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4 mr-1.5" aria-hidden />
              )}
              Accept cancellation
            </Button>
          </>
        ) : (
          <Badge variant="outline" className={cn("font-medium", status.cls)}>
            {normalized === "accepted" ? "Supervision ended" : "Cancellation declined"}
          </Badge>
        )}
      </div>
    </article>
  );
}
