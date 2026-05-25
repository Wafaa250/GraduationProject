import { useEffect, useState } from "react";
import {
  Calendar,
  Check,
  FileText,
  GraduationCap,
  History,
  Loader2,
  MessageSquare,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  avatarGradientClass,
  formatProjectTypeLabel,
  formatSupervisionSubmittedDate,
  normalizeSupervisionStatus,
  studentInitials,
  supervisionStatusUi,
  teamSizeLabel,
} from "@/lib/supervisionRequestUi";
import { cn } from "@/lib/utils";

type SupervisionRequestDetailSheetProps = {
  request: DoctorSupervisorRequest | null;
  open: boolean;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (requestId: number, feedback: string) => void;
  onReject: (requestId: number, feedback: string) => void;
};

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

function TagList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <Badge key={s} variant="secondary" className="bg-secondary text-foreground border-0">
          {s}
        </Badge>
      ))}
    </div>
  );
}

export function SupervisionRequestDetailSheet({
  request,
  open,
  busy = false,
  onOpenChange,
  onAccept,
  onReject,
}: SupervisionRequestDetailSheetProps) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!open) return;
    setFeedback("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange, request?.requestId]);

  if (!open || !request) return null;

  const r = request;
  const status = supervisionStatusUi(r.status);
  const normalized = normalizeSupervisionStatus(r.status);
  const isPending = normalized === "pending";
  const score = r.aiCompatibility?.score ?? 0;
  const code = r.requestCode ?? `REQ-${String(r.requestId).padStart(5, "0")}`;
  const stage = r.project.stage?.trim() || formatProjectTypeLabel(r.project.projectType);

  const overviewEntries: { label: string; value: string }[] = [
    { label: "Type", value: formatProjectTypeLabel(r.project.projectType) },
    { label: "Stage", value: stage },
    { label: "Team Size", value: `${teamSizeLabel(r)} members` },
    { label: "Submitted", value: formatSupervisionSubmittedDate(r.createdAt) },
  ];
  if (r.project.faculty) overviewEntries.push({ label: "Faculty", value: r.project.faculty });
  if (r.project.department) overviewEntries.push({ label: "Department", value: r.project.department });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close details"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="supervision-detail-title"
        className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-border bg-white shadow-elevated animate-fade-in"
      >
        <header className="shrink-0 px-6 py-5 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-[11px]">
                {code}
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                {formatProjectTypeLabel(r.project.projectType)}
              </Badge>
              <Badge variant="outline" className={cn("gap-1", status.cls)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </Badge>
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground rounded-lg p-1"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 id="supervision-detail-title" className="font-display text-2xl leading-tight text-foreground">
            {r.project.name}
          </h2>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold",
                avatarGradientClass(r.sender.name || String(r.requestId)),
              )}
              aria-hidden
            >
              {studentInitials(r)}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{r.sender.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.sender.major}
                {r.sender.university ? ` · ${r.sender.university}` : ""}
                {r.sender.gpa != null ? ` · GPA ${r.sender.gpa}` : ""}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-7">
          <DetailSection icon={FileText} title="Project Overview">
            <div className="grid grid-cols-2 gap-3">
              {overviewEntries.map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection icon={FileText} title="Abstract">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {r.project.description?.trim() || "No abstract provided."}
            </p>
          </DetailSection>

          <DetailSection icon={Sparkles} title="AI Compatibility">
            <div className="rounded-xl border border-primary/15 bg-gradient-soft p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Matching score</p>
                <p className="text-2xl font-bold text-primary">
                  {score}
                  <span className="text-sm text-muted-foreground font-normal">/100</span>
                </p>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(r.aiCompatibility?.matches ?? []).length === 0 ? (
                  <span className="text-xs text-muted-foreground">No overlapping skills detected</span>
                ) : (
                  r.aiCompatibility!.matches.map((m) => (
                    <Badge
                      key={m}
                      variant="secondary"
                      className="bg-white border border-primary/15 text-primary font-medium"
                    >
                      {m}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </DetailSection>

          <DetailSection icon={GraduationCap} title="Skills">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills</p>
                <TagList items={r.project.requiredSkills ?? []} emptyLabel="None listed" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Technologies</p>
                <TagList items={r.project.technologies ?? []} emptyLabel="None listed" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Preferred Roles</p>
                <TagList items={r.project.preferredRoles ?? []} emptyLabel="None listed" />
              </div>
            </div>
          </DetailSection>

          <DetailSection icon={Users} title="Team Members">
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {(r.project.members ?? []).length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No team members listed.</p>
              ) : (
                r.project.members.map((m) => (
                  <div key={m.studentId} className="flex items-center gap-3 px-4 py-3 bg-white">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full text-primary-foreground flex items-center justify-center text-xs font-semibold",
                        avatarGradientClass(m.name || String(m.studentId)),
                      )}
                    >
                      {m.initials?.trim() || m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                    {(m.academicYear?.trim() || m.major?.trim()) && (
                      <Badge variant="outline" className="text-muted-foreground text-[11px]">
                        {m.academicYear?.trim() || m.major}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </DetailSection>

          <DetailSection icon={GraduationCap} title="Student Information">
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2 text-sm">
              <p className="text-foreground">
                <span className="font-medium text-foreground/80">Name: </span>
                {r.sender.name}
              </p>
              {r.sender.major ? (
                <p className="text-foreground">
                  <span className="font-medium text-foreground/80">Major: </span>
                  {r.sender.major}
                </p>
              ) : null}
              {r.sender.academicYear ? (
                <p className="text-foreground">
                  <span className="font-medium text-foreground/80">Academic year: </span>
                  {r.sender.academicYear}
                </p>
              ) : null}
              {r.sender.university ? (
                <p className="text-foreground">
                  <span className="font-medium text-foreground/80">University: </span>
                  {r.sender.university}
                </p>
              ) : null}
              {r.sender.faculty ? (
                <p className="text-foreground">
                  <span className="font-medium text-foreground/80">Faculty: </span>
                  {r.sender.faculty}
                </p>
              ) : null}
            </div>
          </DetailSection>

          {(r.history?.length ?? 0) > 0 && (
            <DetailSection icon={History} title="Submission History">
              <ol className="relative border-l border-border ml-2 space-y-4 pl-5">
                {r.history!.map((h, i) => (
                  <li key={`${h.event}-${i}`} className="relative">
                    <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
                    <p className="text-sm text-foreground font-medium">{h.event}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" aria-hidden />
                      {formatSupervisionSubmittedDate(h.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </DetailSection>
          )}

          {isPending ? (
            <DetailSection icon={MessageSquare} title="Feedback">
              <Textarea
                placeholder="Leave a short note — context, expectations, or reasons for decision…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px] resize-none"
                aria-label="Feedback to student"
              />
            </DetailSection>
          ) : r.doctorResponseNote ? (
            <DetailSection icon={MessageSquare} title="Feedback">
              <p className="text-sm text-foreground/90 leading-relaxed">{r.doctorResponseNote}</p>
            </DetailSection>
          ) : null}
        </div>

        {isPending && (
          <footer className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-end gap-2 bg-white">
            <Button
              variant="outline"
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => {
                onReject(r.requestId, feedback);
                onOpenChange(false);
              }}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />
              ) : (
                <X className="h-4 w-4 mr-1.5" aria-hidden />
              )}
              Reject Supervision
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground shadow-glow"
              disabled={busy}
              onClick={() => {
                onAccept(r.requestId, feedback);
                onOpenChange(false);
              }}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4 mr-1.5" aria-hidden />
              )}
              Accept Supervision
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}
