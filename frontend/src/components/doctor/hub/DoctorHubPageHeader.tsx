import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/routes/paths";

type DoctorHubPageHeaderProps = {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  showBack?: boolean;
  /** Non-interactive label shown beside the title (e.g. section context). */
  badge?: string;
  className?: string;
};

export function DoctorHubPageHeader({
  title,
  description,
  backTo = ROUTES.doctorDashboard,
  backLabel = "Dashboard",
  showBack = true,
  badge,
  className,
}: DoctorHubPageHeaderProps) {
  return (
    <div className={className ?? "mb-6"}>
      {showBack ? (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-smooth mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {badge ? (
          <span className="doctor-messages-context-badge shrink-0">{badge}</span>
        ) : null}
      </div>
    </div>
  );
}
