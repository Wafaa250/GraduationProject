import { useEffect } from "react";
import { X } from "lucide-react";
import type { DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import { formatDoctorHubDate } from "@/lib/doctorHubMappers";

type RequestDetailDialogProps = {
  request: DoctorSupervisorRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RequestDetailDialog({ request, open, onOpenChange }: RequestDetailDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-elevated"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-display text-lg font-bold text-foreground pr-6">
            {request.project.name}
          </h2>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student
            </p>
            <p className="font-medium text-foreground">
              {request.sender.name} · {request.sender.major}
            </p>
            <p className="text-muted-foreground">{request.sender.university}</p>
          </div>
          {request.project.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Abstract
              </p>
              <p className="text-foreground/90">{request.project.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Skills
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(request.project.requiredSkills ?? []).map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium border border-border"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team members
            </p>
            <ul className="mt-1 space-y-1">
              {(request.project.members ?? []).map((m) => (
                <li key={m.studentId} className="text-foreground/90">
                  {m.name} — {m.role} ({m.major})
                </li>
              ))}
            </ul>
          </div>
          <p className="text-muted-foreground text-xs">
            Status: {request.status} · Submitted {formatDoctorHubDate(request.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
