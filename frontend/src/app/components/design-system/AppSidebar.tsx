import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "../ui/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../ui/sidebar";

export type AppSidebarNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  /** When true, any pathname starting with `to` counts as active (except exact-only roots). */
  matchPrefix?: boolean;
};

export type AppSidebarProps = {
  items: AppSidebarNavItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

function isNavActive(pathname: string, item: AppSidebarNavItem): boolean {
  if (pathname === item.to) return true;
  if (!item.matchPrefix) return false;
  if (item.to === "/") return false;
  return pathname.startsWith(item.to);
}

/** Lovable-styled sidebar shell wired to real React Router links. */
export function AppSidebar({ items, header, footer, className }: AppSidebarProps) {
  const { pathname } = useLocation();

  return (
    <Sidebar className={className} collapsible="icon">
      {header ? <SidebarHeader>{header}</SidebarHeader> : null}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge != null && item.badge !== "" ? (
                      <SidebarMenuBadge>{String(item.badge)}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  );
}

export type AppSidebarBrandProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function AppSidebarBrand({ title, subtitle, icon, className }: AppSidebarBrandProps) {
  return (
    <div className={cn("flex items-center gap-3 px-2 py-1", className)}>
      {icon ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        {subtitle ? (
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{subtitle}</p>
        ) : null}
        <p className="truncate font-display text-sm font-semibold text-sidebar-foreground">{title}</p>
      </div>
    </div>
  );
}
