import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "./EmptyState";
import { studentCourseProjectPath } from "@/routes/paths";
import {
  ArrowLeft,
  Calendar,
  Users,
  FolderKanban,
  Megaphone,
  GraduationCap,
  ArrowRight,
  UserSearch,
  Inbox,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { ManageCourseDetailModel, ManageClassmateModel, ManageProjectModel, CourseOverviewSummary } from "@/lib/studentManageCourses";
import { initialsFromName } from "@/lib/studentManageCourses";

export type CourseAnnouncementView = {
  id: number;
  title: string;
  message: string;
  doctor: string;
  date: string;
};

type CourseDetailProps = {
  course: ManageCourseDetailModel;
  projects: ManageProjectModel[];
  classmates: ManageClassmateModel[];
  announcements: CourseAnnouncementView[];
  overview: CourseOverviewSummary | null;
  onBack: () => void;
};

const headerAccent: Record<ManageCourseDetailModel["color"], string> = {
  primary: "from-primary via-primary-glow to-primary/70",
  info: "from-info via-info/80 to-info/60",
  success: "from-success via-success/80 to-success/60",
  warning: "from-warning via-warning/80 to-warning/60",
};

export function CourseDetail({
  course,
  projects,
  classmates,
  announcements,
  overview,
  onBack,
}: CourseDetailProps) {
  const doctorInitials = initialsFromName(course.doctor);

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Courses
      </button>

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl text-primary-foreground shadow-elevated",
          "bg-gradient-to-br",
          headerAccent[course.color],
        )}
      >
        <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
            <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur">{course.code}</span>
            <span className="opacity-80">· Section {course.section}</span>
          </div>
          <h1 className="mt-3 font-display text-2xl md:text-3xl font-bold">{course.name}</h1>
          <p className="mt-2 max-w-2xl text-sm md:text-base text-primary-foreground/85">
            {course.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> {course.doctor}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {course.schedule}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" /> {course.students} students
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/70 p-1 h-auto rounded-xl">
          {[
            { v: "overview", label: "Overview" },
            { v: "projects", label: "Projects" },
            { v: "classmates", label: "Classmates" },
            { v: "announcements", label: "Announcements" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {overview ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                label="Classmates in My Section"
                value={overview.classmatesInSection}
                icon={Users}
                tone="primary"
              />
              <SummaryCard
                label="Available Course Projects"
                value={overview.availableProjects}
                icon={FolderKanban}
                tone="info"
              />
              <SummaryCard
                label="My Team Status"
                value={overview.teamStatusSummary}
                icon={UserSearch}
                tone="success"
                compact
              />
              <SummaryCard
                label="Latest Announcement"
                value={overview.latestAnnouncementLabel}
                icon={Megaphone}
                tone="warning"
                compact
              />
            </div>
          ) : null}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <h3 className="font-display text-base font-bold">Recent projects</h3>
              {overview && overview.recentProjects.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {overview.recentProjects.map((p) => {
                    const courseId = Number(p.courseId);
                    const projectId = Number(p.id);
                    const path =
                      Number.isFinite(courseId) && Number.isFinite(projectId)
                        ? studentCourseProjectPath(courseId, projectId)
                        : null;
                    return (
                      <li
                        key={p.id}
                        className="rounded-xl border border-border p-4 hover:shadow-soft transition-smooth"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold leading-snug">{p.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">{p.teamStatus}</div>
                          </div>
                          {path ? (
                            <Button variant="outline" size="sm" className="rounded-lg shrink-0" asChild>
                              <Link to={path}>
                                View
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No course projects are available for your section yet.
                </p>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <h3 className="font-display text-base font-bold">Recent announcement</h3>
              {overview?.latestAnnouncement ? (
                <div className="mt-4 rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold">{overview.latestAnnouncement.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {overview.latestAnnouncement.date}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {overview.latestAnnouncement.message}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-6 w-6 rounded-full bg-primary-soft text-primary grid place-items-center text-[10px] font-bold">
                      {initialsFromName(overview.latestAnnouncement.doctor)}
                    </div>
                    {overview.latestAnnouncement.doctor}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No announcements from your instructor yet.
                </p>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-card">
              <h3 className="font-display text-base font-bold">About this course</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{course.description}</p>
              <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
                <Field label="Course Code" value={course.code} />
                <Field label="Section" value={course.section} />
                <Field label="Instructor" value={course.doctor} />
                <Field label="Schedule" value={course.schedule} />
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <h3 className="font-display text-base font-bold">Instructor</h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center font-bold">
                  {doctorInitials}
                </div>
                <div>
                  <div className="font-semibold">{course.doctor}</div>
                  <div className="text-xs text-muted-foreground">{course.doctorTitle}</div>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-gradient-soft p-4 text-sm">
                <div className="font-medium">Office Hours</div>
                <div className="text-muted-foreground text-xs mt-1">
                  {course.officeHours || "Not provided"}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-0">
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Your instructor hasn't published any course projects. They'll appear here as soon as they're available."
              tone="info"
            />
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="classmates" className="mt-0">
          {classmates.length === 0 ? (
            <EmptyState
              icon={UserSearch}
              title="No classmates listed"
              description="Once the section roster is finalized, you'll see everyone in your section here."
              tone="success"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {classmates.map((c) => (
                <ClassmateCard key={c.id} classmate={c} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-0">
          {announcements.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No announcements yet"
              description="When your instructor posts an update, you'll see it here in a timeline."
              tone="warning"
            />
          ) : (
            <AnnouncementTimeline items={announcements} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  compact = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: "primary" | "info" | "warning" | "success";
  compact?: boolean;
}) {
  const styles = {
    primary: "bg-primary-soft text-primary",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
  }[tone];
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", styles)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div
          className={cn(
            "font-display font-bold mt-0.5",
            compact ? "text-sm leading-snug line-clamp-3" : "text-2xl",
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ManageProjectModel }) {
  const courseId = Number(project.courseId);
  const projectId = Number(project.id);
  const detailPath =
    Number.isFinite(courseId) && Number.isFinite(projectId)
      ? studentCourseProjectPath(courseId, projectId)
      : null;

  return (
    <div className="group bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-smooth flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary" className="rounded-md font-medium">
          {project.type}
        </Badge>
        <span className="text-xs text-muted-foreground">Team of {project.teamSize}</span>
      </div>
      <h4 className="mt-3 font-display text-base font-bold leading-snug">{project.title}</h4>
      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">{project.description}</p>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div>
          <span className="font-semibold text-foreground/80">Sections: </span>
          {project.sectionsLabel}
        </div>
        <div>
          <span className="font-semibold text-foreground/80">Team status: </span>
          {project.teamStatus}
        </div>
      </div>
      {project.skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.skills.map((s) => (
            <span
              key={s}
              className="text-[11px] font-medium px-2 py-1 rounded-md bg-primary-soft text-primary"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-end">
        {detailPath ? (
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link to={detailPath}>
              View Project
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="rounded-lg" disabled>
            View Project
          </Button>
        )}
      </div>
    </div>
  );
}

function ClassmateCard({ classmate }: { classmate: ManageClassmateModel }) {
  return (
    <div className="group bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated transition-smooth text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-lg font-bold shadow-glow">
        {classmate.initials}
      </div>
      <div className="mt-3 font-semibold leading-tight">{classmate.name}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{classmate.major}</div>
      <div className="mt-2 text-[11px] font-medium text-primary">{classmate.teamStatus}</div>
      {classmate.skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {classmate.skills.map((s) => (
            <span
              key={s}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AnnouncementTimeline({ items }: { items: CourseAnnouncementView[] }) {
  return (
    <div className="relative pl-6 md:pl-8">
      <div
        className="absolute left-2 md:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent"
        aria-hidden
      />
      <ol className="space-y-5">
        {items.map((a, i) => (
          <li key={a.id} className="relative">
            <span
              className={cn(
                "absolute -left-[18px] md:-left-[22px] top-5 h-3.5 w-3.5 rounded-full ring-4 ring-background",
                i === 0 ? "bg-primary shadow-glow" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated transition-smooth">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-display text-base font-bold">{a.title}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{a.date}</span>
              </div>
              <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{a.message}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-6 w-6 rounded-full bg-primary-soft text-primary grid place-items-center text-[10px] font-bold">
                  {initialsFromName(a.doctor)}
                </div>
                {a.doctor}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
