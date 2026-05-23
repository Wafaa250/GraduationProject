import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../ui/button";

type Props = {
  backTo?: string;
  backLabel?: string;
  /** Wider content column (max-w-7xl); default max-w-4xl. */
  wide?: boolean;
  children: ReactNode;
};

/**
 * In-page chrome inside the doctor hub main area (back link + width).
 * Use under DoctorHubShellLayout / DoctorHubShellPage — not a standalone app shell.
 */
export function DoctorHubContent({
  backTo,
  backLabel = "Back",
  wide = false,
  children,
}: Props) {
  const contentMax = wide ? "max-w-7xl" : "max-w-4xl";

  return (
    <div className={`${contentMax} mx-auto w-full`}>
      {backTo ? (
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 mb-4">
          <Link to={backTo}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      ) : null}
      {children}
    </div>
  );
}
