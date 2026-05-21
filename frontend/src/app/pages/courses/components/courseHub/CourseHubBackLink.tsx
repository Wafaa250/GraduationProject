import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../../../../components/ui/utils";

export function CourseHubBackLink({
  to,
  children = "Back",
  className,
}: {
  to: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}
