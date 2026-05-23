import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  accent?: boolean;
  /** Lovable-style deep link */
  to?: string;
  iconAccentClass?: string;
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  accent,
  to,
  iconAccentClass = "bg-accent text-primary",
}: Props) {
  return (
    <Card className={`overflow-hidden shadow-sm ${accent ? "border-primary/30" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-3xl font-semibold mt-1 text-foreground tabular-nums">{value}</div>
            {hint ? <p className="text-xs text-muted-foreground mt-1 mb-0">{hint}</p> : null}
            {trend ? <p className="text-xs font-medium text-emerald-600 mt-1 mb-0">{trend}</p> : null}
          </div>
          <div
            className={`h-11 w-11 rounded-lg grid place-items-center shrink-0 ${iconAccentClass}`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        {to ? (
          <Link
            to={to}
            className="text-sm text-primary font-medium inline-flex items-center gap-1 mt-3 no-underline hover:underline"
          >
            View <ArrowRight className="h-3 w-3" />
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
