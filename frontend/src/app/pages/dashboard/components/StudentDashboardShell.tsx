import { useEffect, useState, type RefObject } from "react";
import { Link, useLocation } from "react-router-dom";
import { getGraduationProjectsMyEnvelope } from "../../../../api/dashboardApi";
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
  Sparkles,
  User,
  Users,
} from "lucide-react";

import { AppSidebarBrand } from "../../../components/design-system";
import { CommunitiesNavLink } from "../../../components/navigation/CommunitiesNavLink";
import { NotificationDropdown } from "../../../components/notifications/NotificationDropdown";
import { cn } from "../../../components/ui/utils";
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
  const toPath = to.split("?")[0];
  const active =
    pathname === toPath ||
    (matchPrefix && toPath !== "/" && pathname.startsWith(toPath));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label} className="h-auto p-0">
        <Link
          to={to}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
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
}: StudentDashboardShellProps) {
  const { pathname } = useLocation();
  const [resolvedGradProjectId, setResolvedGradProjectId] = useState<
    number | null
  >(gradProjectId ?? null);

  useEffect(() => {
    if (gradProjectId !== undefined) {
      setResolvedGradProjectId(gradProjectId);
      return;
    }
    let cancelled = false;
    getGraduationProjectsMyEnvelope()
      .then(({ project }) => {
        if (!cancelled) setResolvedGradProjectId(project?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setResolvedGradProjectId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [gradProjectId]);

  const initials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  const teamWorkspaceTo = resolvedGradProjectId
    ? `/student/team/${resolvedGradProjectId}`
    : "/dashboard";

  const graduationProjectPath = resolvedGradProjectId
    ? `/student/ai-analysis?projectId=${resolvedGradProjectId}`
    : "/create-project";
  const graduationProjectLabel = resolvedGradProjectId
    ? "Graduation project"
    : "Create Project";

  return (
    <SidebarProvider defaultOpen className="min-h-svh">
      <Sidebar collapsible="icon" className="w-64 border-sidebar-border bg-sidebar">
        <SidebarHeader>
          <AppSidebarBrand
            title="SkillSwap"
            subtitle="AI · University"
            icon={<Sparkles className="h-4 w-4" />}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavLinkItem to="/dashboard" label="Dashboard" icon={Home} />
                <NavLinkItem to="/profile" label="My Profile" icon={User} />
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === "/create-project" ||
                      pathname === "/create-project/edit" ||
                      pathname === "/student/ai-analysis"
                    }
                    tooltip={graduationProjectLabel}
                    className="h-auto p-0"
                  >
                    <Link
                      to={graduationProjectPath}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/create-project" ||
                          pathname === "/create-project/edit" ||
                          pathname === "/student/ai-analysis"
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                    >
                      <FolderPlus className="h-4 w-4 shrink-0" />
                      <span>{graduationProjectLabel}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <NavLinkItem
                  to={
                    resolvedGradProjectId
                      ? `/students?projectId=${resolvedGradProjectId}`
                      : "/students"
                  }
                  label="Find Teammates"
                  icon={Users}
                  matchPrefix
                />
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Find Supervisor" className="h-auto p-0">
                    <a
                      href="#supervisor-recommendations"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                    >
                      <GraduationCap className="h-4 w-4 shrink-0" />
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
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Communication
            </SidebarGroupLabel>
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
        <SidebarFooter className="gap-3 p-4">
          <div className="rounded-2xl border border-ai/20 bg-ai-soft p-3 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ai">AI Tip</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80">
              Complete your skills section to unlock 5x better matches.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex min-h-svh flex-col bg-gradient-surface">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-xl md:px-6">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <div
            ref={searchWrapRef}
            className="relative mx-auto hidden w-full max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 md:flex"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Search projects, skills, people…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
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

          <div className="ml-auto flex items-center gap-2">
            <CommunitiesNavLink />
            <NotificationDropdown />
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

        <main className="flex flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 lg:pb-10">{children}</main>
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
