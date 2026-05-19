import { cn } from "../ui/utils";
import { SidebarTrigger } from "../ui/sidebar";

export type AppTopBarProps = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showSidebarTrigger?: boolean;
  className?: string;
};

/** Sticky top bar for dashboard shells (Lovable style). */
export function AppTopBar({
  title,
  subtitle,
  actions,
  showSidebarTrigger = true,
  className,
}: AppTopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6",
        className,
      )}
    >
      {showSidebarTrigger ? <SidebarTrigger className="-ml-1" /> : null}
      {(title || subtitle) && (
        <div className="min-w-0 flex-1">
          {subtitle ? (
            <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
          ) : null}
          {title ? (
            <h1 className="truncate font-display text-lg font-semibold tracking-tight">{title}</h1>
          ) : null}
        </div>
      )}
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
