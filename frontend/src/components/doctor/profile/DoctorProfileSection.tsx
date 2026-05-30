import type { ReactNode } from "react";

type DoctorProfileSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function DoctorProfileSection({ title, description, children }: DoctorProfileSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="mb-4 border-b border-border/60 pb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string | null | undefined;
  emptyLabel?: string;
};

export function DoctorProfileField({ label, value, emptyLabel = "Not provided" }: ProfileFieldProps) {
  const text = value?.trim();
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cnValue(text)}>{text || emptyLabel}</dd>
    </div>
  );
}

function cnValue(text: string | undefined) {
  return text
    ? "text-sm text-foreground"
    : "text-sm italic text-muted-foreground";
}
