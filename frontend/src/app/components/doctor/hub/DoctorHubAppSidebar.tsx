import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../../ui/sidebar";
import { BrandLogo } from "../../brand/BrandLogo";
import type { DoctorDashboardSection } from "../../../pages/doctor/doctorDashboardTypes";
import {
  DOCTOR_HUB_ACCOUNT_NAV,
  DOCTOR_HUB_SUPERVISION_NAV,
  DOCTOR_HUB_WORKSPACE_NAV,
  type DoctorHubNavItem,
} from "./doctorHubNav";

type NavCounts = {
  pendingRequests?: number;
};

type Props = {
  activeSection: DoctorDashboardSection;
  onSectionChange: (section: DoctorDashboardSection) => void;
  navCounts?: NavCounts;
  doctorName?: string;
  doctorSubtitle?: string;
};

function NavItems({
  items,
  activeSection,
  onSectionChange,
  navCounts,
  pathname,
}: {
  items: DoctorHubNavItem[];
  activeSection: DoctorDashboardSection;
  onSectionChange: (s: DoctorDashboardSection) => void;
  navCounts?: NavCounts;
  pathname: string;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return items.map((item) => {
    if (item.kind === "route") {
      const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
      return (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton asChild isActive={active}>
            <Link to={item.to} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    const active = activeSection === item.section;
    const badge =
      item.countKey && navCounts?.[item.countKey] != null && navCounts[item.countKey]! > 0
        ? navCounts[item.countKey]
        : undefined;

    return (
      <SidebarMenuItem key={`${item.section}-${item.title}`}>
        <SidebarMenuButton
          isActive={active}
          onClick={() => onSectionChange(item.section)}
          className="flex items-center gap-2 w-full"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">{item.title}</span>}
          {!collapsed && badge != null ? (
            <span className="ml-auto text-xs font-semibold rounded-full bg-primary text-primary-foreground min-w-[1.25rem] h-5 px-1.5 grid place-items-center">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  });
}

export function DoctorHubAppSidebar({
  activeSection,
  onSectionChange,
  navCounts,
  doctorName,
  doctorSubtitle,
}: Props) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/doctor-dashboard" className="flex items-center gap-2 no-underline text-inherit">
          <BrandLogo size="sm" variant={collapsed ? "mark" : "full"} />
          {!collapsed ? (
            <div className="leading-tight min-w-0">
              <div className="text-xs text-muted-foreground truncate">Doctor workspace</div>
            </div>
          ) : null}
        </Link>
        {!collapsed && doctorName ? (
          <div className="mt-3 px-1 text-xs text-muted-foreground truncate" title={doctorName}>
            <span className="font-medium text-foreground">{doctorName}</span>
            {doctorSubtitle ? <span className="block truncate">{doctorSubtitle}</span> : null}
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItems
                items={DOCTOR_HUB_WORKSPACE_NAV}
                activeSection={activeSection}
                onSectionChange={onSectionChange}
                navCounts={navCounts}
                pathname={pathname}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Supervision</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItems
                items={DOCTOR_HUB_SUPERVISION_NAV}
                activeSection={activeSection}
                onSectionChange={onSectionChange}
                navCounts={navCounts}
                pathname={pathname}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItems
                items={DOCTOR_HUB_ACCOUNT_NAV}
                activeSection={activeSection}
                onSectionChange={onSectionChange}
                navCounts={navCounts}
                pathname={pathname}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
