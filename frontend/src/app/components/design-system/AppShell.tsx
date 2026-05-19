import { cn } from "../ui/utils";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { AppSidebar, type AppSidebarProps } from "./AppSidebar";
import { AppTopBar, type AppTopBarProps } from "./AppTopBar";

export type AppShellProps = {
  sidebar: AppSidebarProps;
  topBar?: AppTopBarProps;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  defaultSidebarOpen?: boolean;
};

/**
 * Dashboard layout shell: sidebar + optional top bar + main content.
 * Drop-in for gradual migration from inline-styled sidebars.
 */
export function AppShell({
  sidebar,
  topBar,
  children,
  className,
  contentClassName,
  defaultSidebarOpen = true,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen} className={className}>
      <AppSidebar {...sidebar} />
      <SidebarInset className="bg-gradient-surface">
        {topBar ? <AppTopBar {...topBar} /> : null}
        <div className={cn("flex flex-1 flex-col p-4 md:p-6", contentClassName)}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
