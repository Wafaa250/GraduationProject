import type { RefObject } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  FolderPlus,
  GraduationCap,
  Home,
  Inbox,
  Layers,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import { AppSidebarBrand } from "../../../components/design-system";
import { CommunitiesNavLink } from "../../../components/navigation/CommunitiesNavLink";
import { GradProjectNotificationBell } from "../../../components/notifications/GradProjectNotificationBell";
import { MessagesNotificationBell } from "../../../components/notifications/MessagesNotificationBell";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "../../../components/ui/sidebar";

type GlobalSearchStudent = { id: number; name: string; email: string; major: string };
type GlobalSearchDoctor = { id: number; name: string; email: string; specialization: string };
export type GlobalSearchResponse = {
  students: GlobalSearchStudent[];
  doctors: GlobalSearchDoctor[];
};

const navIconBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  borderRadius: 8,
};

export type StudentDashboardShellProps = {
  children: React.ReactNode;
  userName?: string;
  profilePic?: string | null;
  gradProjectId?: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchWrapRef: RefObject<HTMLDivElement | null>;
  globalSearchResults: GlobalSearchResponse | null;
  globalSearchLoading: boolean;
  onSelectStudent: (id: number) => void;
  onSelectDoctor: (id: number) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onCreateProject: () => void;
};

function NavLinkItem({
  to,
  label,
  icon: Icon,
  matchPrefix,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefix?: boolean;
}) {
  const { pathname } = useLocation();
  const active =
    pathname === to || (matchPrefix && to !== "/" && pathname.startsWith(to));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label}>
        <Link to={to}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function StudentDashboardShell({
  children,
  userName,
  profilePic,
  gradProjectId,
  searchQuery,
  onSearchChange,
  searchWrapRef,
  globalSearchResults,
  globalSearchLoading,
  onSelectStudent,
  onSelectDoctor,
  onOpenSettings,
  onLogout,
  onCreateProject,
}: StudentDashboardShellProps) {
  const { pathname } = useLocation();
  const initials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  const teamWorkspaceTo = gradProjectId
    ? `/student/team/${gradProjectId}`
    : "/dashboard";

  return (
    <SidebarProvider defaultOpen className="min-h-svh">
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader>
          <AppSidebarBrand
            title="SkillSwap"
            subtitle="AI · University"
            icon={<Sparkles className="h-4 w-4" />}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavLinkItem to="/dashboard" label="Dashboard" icon={Home} />
                <NavLinkItem to="/profile" label="My Profile" icon={User} />
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/create-project"}
                    tooltip="Create Project"
                  >
                    <Link to="/create-project" onClick={onCreateProject}>
                      <FolderPlus className="h-4 w-4" />
                      <span>Create Project</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <NavLinkItem to="/students" label="Find Teammates" icon={Users} matchPrefix />
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Find Supervisor">
                    <a href="#supervisor-recommendations">
                      <GraduationCap className="h-4 w-4" />
                      <span>Find Supervisor</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <NavLinkItem to={teamWorkspaceTo} label="Team Workspace" icon={Layers} />
                <NavLinkItem
                  to="/student/courses"
                  label="My Courses"
                  icon={BookOpen}
                  matchPrefix
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Communication</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavLinkItem
                  to="/student/team-invitations"
                  label="Requests"
                  icon={Inbox}
                />
                <NavLinkItem to="/messages" label="Messages" icon={MessageCircle} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="rounded-2xl border border-ai/20 bg-ai-soft/80 p-3 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ai">AI tip</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80">
              Complete your skills section to unlock better AI teammate matches.
            </p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex min-h-svh flex-col bg-gradient-surface">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-xl md:px-6">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <div ref={searchWrapRef} className="relative mx-auto hidden w-full max-w-xl flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Search projects, skills, people…"
              className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
            {searchQuery.trim() !== "" && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-pop">
                {globalSearchLoading ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">Searching…</p>
                ) : (
                  <>
                    <SearchGroup title="Students">
                      {(globalSearchResults?.students ?? []).length === 0 ? (
                        <p className="px-2 py-1 text-xs text-muted-foreground">No students</p>
                      ) : (
                        (globalSearchResults?.students ?? []).map((student) => (
                          <button
                            key={`gs-st-${student.id}`}
                            type="button"
                            className="flex w-full flex-col gap-0.5 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                            onClick={() => onSelectStudent(student.id)}
                          >
                            <span className="font-semibold">{student.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {student.major || student.email}
                            </span>
                          </button>
                        ))
                      )}
                    </SearchGroup>
                    <SearchGroup title="Doctors">
                      {(globalSearchResults?.doctors ?? []).length === 0 ? (
                        <p className="px-2 py-1 text-xs text-muted-foreground">No doctors</p>
                      ) : (
                        (globalSearchResults?.doctors ?? []).map((doctor) => (
                          <button
                            key={`gs-dr-${doctor.id}`}
                            type="button"
                            className="flex w-full flex-col gap-0.5 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                            onClick={() => onSelectDoctor(doctor.id)}
                          >
                            <span className="font-semibold">{doctor.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {doctor.specialization || doctor.email}
                            </span>
                          </button>
                        ))
                      )}
                    </SearchGroup>
                    {!globalSearchLoading &&
                      (globalSearchResults?.students?.length ?? 0) === 0 &&
                      (globalSearchResults?.doctors?.length ?? 0) === 0 && (
                        <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                          No results found
                        </p>
                      )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <CommunitiesNavLink />
            <GradProjectNotificationBell bellButtonStyle={navIconBtn} theme="student" />
            <MessagesNotificationBell buttonStyle={navIconBtn} />
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Profile strength"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <Link
              to="/profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground shadow-glow"
            >
              {profilePic ? (
                <img src={profilePic} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </Link>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
