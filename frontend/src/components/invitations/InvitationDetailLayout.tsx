import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InvitationDetailLayoutProps = {
  title: string;
  subtitle?: string;
  backTo: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
};

export function InvitationDetailLayout({
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  children,
  className,
}: InvitationDetailLayoutProps) {
  return (
    <div className={cn("min-h-full bg-hero px-4 py-6 sm:px-6 lg:px-8", className)}>
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1.5" asChild>
          <Link to={backTo}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>

        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6 md:p-8">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

type InvitationMetaRowProps = {
  label: string;
  value: React.ReactNode;
};

export function InvitationMetaRow({ label, value }: InvitationMetaRowProps) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

type InvitationActionBarProps = {
  onAccept: () => void;
  onReject: () => void;
  acceptLabel?: string;
  rejectLabel?: string;
  busy?: boolean;
  disabled?: boolean;
};

export function InvitationActionBar({
  onAccept,
  onReject,
  acceptLabel = "Accept",
  rejectLabel = "Reject",
  busy = false,
  disabled = false,
}: InvitationActionBarProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className="border-destructive/30 text-destructive hover:bg-destructive/10"
        disabled={busy || disabled}
        onClick={onReject}
      >
        {rejectLabel}
      </Button>
      <Button
        type="button"
        className="bg-gradient-primary text-primary-foreground hover:opacity-95"
        disabled={busy || disabled}
        onClick={onAccept}
      >
        {acceptLabel}
      </Button>
    </div>
  );
}
