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
  /** Create flow: stepper-first header without marketing copy */
  compactHeader?: boolean;
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
  compactHeader = false,
}: Props) {
  return (
    <div className={cn("cw-request-wizard-lux", compactHeader && "cw-request-wizard-lux--compact", className)}>
      <div className="cw-wizard-lux-header">
        <div className="cw-lux-hero-mesh absolute inset-0 opacity-80" aria-hidden />
        <div className="relative p-5 md:p-6">
          {compactHeader ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="cw-wizard-compact-title">{title}</h1>
                {subtitle ? <p className="cw-wizard-compact-desc">{subtitle}</p> : null}
              </div>
              {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="cw-lux-eyebrow">Request builder</p>
                <h1 className="cw-lux-hero-title mt-2">{title}</h1>
                {subtitle ? <p className="cw-lux-hero-desc mt-2">{subtitle}</p> : null}
              </div>
              {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </div>
          )}

          {(stepper || headerMeta) && (
            <div
              className={cn(
                "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
                compactHeader ? "mt-4" : "mt-5 pt-5 border-t border-border/40",
              )}
            >
              {stepper}
              {headerMeta ? (
                <p className="text-xs text-muted-foreground shrink-0 lg:text-right">{headerMeta}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="cw-wizard-lux-panel">
        <div className="cw-wizard-lux-panel-inner">{children}</div>
        {footer ? <div className="cw-wizard-lux-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
