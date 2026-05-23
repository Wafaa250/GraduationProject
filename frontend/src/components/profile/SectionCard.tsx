import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export const SectionCard = ({ title, description, icon, children }: SectionCardProps) => (
  <section className="rounded-2xl border border-border bg-card shadow-card transition-smooth hover:shadow-elegant/40">
    <header className="flex items-start gap-4 border-b border-border/70 px-6 py-5 sm:px-8">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </header>
    <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>
  </section>
);
