import { Calendar, Check, GraduationCap, Loader2, Sparkles, Users, X } from "lucide-react";
import type { DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  aiMatchSummary,
  avatarGradientClass,
  formatProjectTypeLabel,
  formatSupervisionSubmittedDate,
  normalizeSupervisionStatus,
  studentInitials,
  supervisionStatusUi,
  teamSizeLabel,
} from "@/lib/supervisionRequestUi";
import { cn } from "@/lib/utils";

type SupervisionRequestCardProps = {
  request: DoctorSupervisorRequest;
  busyRequestId?: number | null;
  highlighted?: boolean;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
};

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 85 ? "text-success" : score >= 70 ? "text-primary" : "text-warning";
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${score} 100`}
          className={tone}
        />
      </svg>
      <div className={cn("absolute inset-0 flex items-center justify-center text-[12px] font-bold", tone)}>
        {score}
      </div>
    </div>
  );
}

export function SupervisionRequestCard({
  request: r,
  busyRequestId,
  highlighted = false,
  onAccept,
  onReject,
}: SupervisionRequestCardProps) {
  const status = supervisionStatusUi(r.status);
  const normalized = normalizeSupervisionStatus(r.status);
  const isPending = normalized === "pending";
  const busy = busyRequestId === r.requestId;
  const score = r.aiCompatibility?.score ?? 0;
  const skills = r.project.requiredSkills ?? [];
  const roles = r.project.preferredRoles ?? [];
  const stage =
    r.project.stage?.trim() ||
    formatProjectTypeLabel(r.project.projectType, r.sender.faculty, r.sender.major);
  const code = r.requestCode ?? `REQ-${String(r.requestId).padStart(5, "0")}`;

  return (
    <article
      id={`supervision-request-${r.requestId}`}
      className={cn(
        "group rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:border-primary/20 transition-smooth animate-fade-in",
        highlighted && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center text-white text-sm font-semibold shrink-0",
              avatarGradientClass(r.sender.name || String(r.requestId)),
            )}
            aria-hidden
          >
            {studentInitials(r)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-[15px] truncate">{r.sender.name}</h3>
              <span className="text-xs text-muted-foreground font-mono">{code}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {r.sender.major}
              {r.sender.academicYear ? (
                <>
                  <span>·</span>
                  <span>{r.sender.academicYear}</span>
                </>
              ) : null}
              {r.sender.university ? (
                <>
                  <span>·</span>
                  <span>{r.sender.university}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("gap-1.5 font-medium border shrink-0", status.cls)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </Badge>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 p-4 mb-4">
        <h4 className="font-display font-semibold text-foreground text-base mb-1 leading-snug">
          {r.project.name}
        </h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
            {formatProjectTypeLabel(r.project.projectType, r.sender.faculty, r.sender.major)}
          </span>
          <span>·</span>
          <span>{stage} stage</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden />
            {teamSizeLabel(r)} members
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden />
            {formatSupervisionSubmittedDate(r.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-4">
        <div className="space-y-2.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.length === 0 ? (
                <span className="text-xs text-muted-foreground">None listed</span>
              ) : (
                skills.slice(0, 5).map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="font-medium text-foreground bg-secondary border-0"
                  >
                    {s}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Preferred Roles
            </p>
            <div className="flex flex-wrap gap-1.5">
              {roles.length === 0 ? (
                <span className="text-xs text-muted-foreground">None listed</span>
              ) : (
                roles.map((s) => (
                  <Badge key={s} variant="outline" className="font-medium text-muted-foreground bg-card">
                    {s}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-gradient-soft p-3.5 min-w-[200px] flex items-center gap-3 self-start">
          <ScoreRing score={score} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden /> AI Compatibility
            </p>
            <p className="text-xs text-foreground/80 mt-0.5 leading-snug">{aiMatchSummary(r)}</p>
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
              Reject Request
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
              Accept Request
            </Button>
          </>
        ) : (
          <Badge variant="outline" className={cn("font-medium", status.cls)}>
            {normalized === "accepted" ? "Supervision active" : "Closed"}
          </Badge>
        )}
      </div>
    </article>
  );
}
