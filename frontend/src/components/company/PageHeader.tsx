import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function CompanyPageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-1">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}
