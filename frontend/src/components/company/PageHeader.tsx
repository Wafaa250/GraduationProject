import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function CompanyPageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="cw-page-header flex flex-col md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="cw-page-header-accent" aria-hidden />
        <h1 className="text-2xl md:text-[1.75rem] font-semibold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm cw-text-secondary mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="cw-page-header-actions">{actions}</div>}
    </header>
  );
}
