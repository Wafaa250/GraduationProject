import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  stepper?: ReactNode;
  headerMeta?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CompanyRequestWizardLayout({
  title,
  subtitle,
  actions,
  stepper,
  headerMeta,
  footer,
  children,
  className,
}: Props) {
  return (
    <div className={cn("cw-request-wizard", className)}>
      <div className="cw-request-wizard-top">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>

        {(stepper || headerMeta) && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {stepper}
            {headerMeta ? (
              <div className="text-xs text-muted-foreground shrink-0">{headerMeta}</div>
            ) : null}
          </div>
        )}
      </div>

      <div className="cw-request-wizard-panel">
        {children}
        {footer ? <div className="cw-request-wizard-actions">{footer}</div> : null}
      </div>
    </div>
  );
}
