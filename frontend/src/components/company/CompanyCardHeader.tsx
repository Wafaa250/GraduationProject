import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

/** Card section header — same anatomy as Dashboard panels. */
export function CompanyCardHeader({
  icon: Icon,
  title,
  description,
  eyebrow,
  action,
  className,
}: Props) {
  return (
    <CardHeader className={cn("cw-card-header-row !p-0 space-y-0", className)}>
      <div className="cw-card-head min-w-0">
        <span className="cw-card-icon" aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          {eyebrow ? <p className="cw-section-label mb-1">{eyebrow}</p> : null}
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description ? <p className="cw-card-desc">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </CardHeader>
  );
}
