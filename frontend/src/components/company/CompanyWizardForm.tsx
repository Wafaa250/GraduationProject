import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WizardStepPanel({
  stepLabel,
  children,
  className,
}: {
  stepLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("cw-wizard-step-panel", className)}>
      <h2 className="cw-wizard-active-step">{stepLabel}</h2>
      <div className="cw-wizard-step-panel-body">{children}</div>
    </div>
  );
}

type SectionProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

/** Optional grouped fields — title only when it adds clarity. */
export function WizardFormSection({ title, children, className }: SectionProps) {
  return (
    <section className={cn("cw-wizard-form-section", className)}>
      {title ? (
        <div className="cw-wizard-form-section-head">
          <h3 className="cw-wizard-form-section-title">{title}</h3>
        </div>
      ) : null}
      <div className="cw-wizard-form-section-body">{children}</div>
    </section>
  );
}

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function WizardFormField({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("cw-wizard-field", className)}>
      <div className="cw-wizard-field-label-row">
        <label htmlFor={htmlFor} className="cw-wizard-field-label">
          {label}
          {required ? (
            <span className="cw-wizard-required-mark" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      </div>
      {hint ? <p className="cw-wizard-field-hint">{hint}</p> : null}
      <div className="cw-wizard-field-control">{children}</div>
    </div>
  );
}

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function WizardFormPanel({ children, className }: PanelProps) {
  return <div className={cn("cw-wizard-form-panel", className)}>{children}</div>;
}

type RoleCardProps = {
  index: number;
  title: string;
  onRemove?: () => void;
  removeLabel?: string;
  preview?: ReactNode;
  children: ReactNode;
};

export function WizardRoleCard({
  index,
  title,
  onRemove,
  removeLabel = "Remove role",
  preview,
  children,
}: RoleCardProps) {
  return (
    <article className="cw-wizard-role-card">
      <div className="cw-wizard-role-card-head">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="cw-wizard-role-index">{index}</span>
          <div className="min-w-0 flex-1">
            <h4 className="cw-wizard-role-card-title">{title}</h4>
            {preview ? <div className="mt-2">{preview}</div> : null}
          </div>
        </div>
        {onRemove ? (
          <button
            type="button"
            className="cw-wizard-role-remove"
            onClick={onRemove}
            aria-label={removeLabel}
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="cw-wizard-role-card-body">{children}</div>
    </article>
  );
}

export function WizardAddRoleButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="cw-wizard-add-role" onClick={onClick}>
      {children}
    </button>
  );
}
