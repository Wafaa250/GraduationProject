import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/routes/paths";

type DoctorHubPageHeaderProps = {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
};

export function DoctorHubPageHeader({
  title,
  description,
  backTo = ROUTES.doctorDashboard,
  backLabel = "Dashboard",
}: DoctorHubPageHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-smooth mb-3"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
