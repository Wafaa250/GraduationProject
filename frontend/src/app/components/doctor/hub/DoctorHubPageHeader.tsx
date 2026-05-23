import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
};

/** Lovable PageHeader — presentation only. */
export function DoctorHubPageHeader({ title, description, actions, eyebrow }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        {eyebrow ? (
          <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground m-0">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-1 max-w-2xl mb-0 text-sm md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
    </div>
  );
}
