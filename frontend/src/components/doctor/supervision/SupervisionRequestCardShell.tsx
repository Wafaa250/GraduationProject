import {
  Calendar,
  Check,
  Eye,
  GraduationCap,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const PLACEHOLDER = "—";

function EmptyTagRow({ label }: { label: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5 min-h-[26px] items-center">
        <span className="text-xs text-muted-foreground italic">{PLACEHOLDER}</span>
      </div>
    </div>
  );
}

function ScoreRingPlaceholder() {
  return (
    <div className="relative h-12 w-12 shrink-0" aria-hidden>
      <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90 text-muted-foreground/30">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-muted-foreground">
        {PLACEHOLDER}
      </div>
    </div>
  );
}

/**
 * Request card layout matching the Lovable design — structural shell only (no request data).
 */
export function SupervisionRequestCardShell() {
  return (
    <article
      className="rounded-2xl border border-border bg-white p-5 shadow-card"
      aria-label="Supervision request card layout"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm font-semibold shrink-0"
            aria-hidden
          >
            {PLACEHOLDER}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-muted-foreground text-[15px]">{PLACEHOLDER}</h3>
              <span className="text-xs text-muted-foreground font-mono">{PLACEHOLDER}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{PLACEHOLDER}</span>
              <span>·</span>
              <span>{PLACEHOLDER}</span>
              <span>·</span>
              <span>{PLACEHOLDER}</span>
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 font-medium border-warning/20 bg-warning/10 text-warning"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Pending review
        </Badge>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 p-4 mb-4">
        <h4 className="font-display font-semibold text-muted-foreground text-base mb-1 leading-snug">
          {PLACEHOLDER}
        </h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
            {PLACEHOLDER}
          </span>
          <span>·</span>
          <span>{PLACEHOLDER} stage</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden />
            {PLACEHOLDER} members
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden />
            {PLACEHOLDER}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-4">
        <div className="space-y-2.5">
          <EmptyTagRow label="Required Skills" />
          <EmptyTagRow label="Preferred Roles" />
        </div>

        <div className="rounded-xl border border-primary/15 bg-gradient-soft p-3.5 min-w-[200px] flex items-center gap-3 self-start">
          <ScoreRingPlaceholder />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden /> AI Compatibility
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{PLACEHOLDER}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border flex-wrap">
        <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
          <Eye className="h-4 w-4 mr-1.5" aria-hidden />
          View Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/20 text-destructive"
          disabled
        >
          <X className="h-4 w-4 mr-1.5" aria-hidden />
          Reject Request
        </Button>
        <Button
          size="sm"
          className="bg-gradient-primary text-primary-foreground shadow-glow"
          disabled
        >
          <Check className="h-4 w-4 mr-1.5" aria-hidden />
          Accept Request
        </Button>
      </div>
    </article>
  );
}
