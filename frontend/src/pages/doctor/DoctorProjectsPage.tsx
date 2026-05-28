import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, FolderKanban, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/doctor/hub/MetricCard";
import { EmptyProjectsState } from "@/components/doctor/projects/EmptyProjectsState";
import { ProjectCard, type ActiveProjectCardModel } from "@/components/doctor/projects/ProjectCard";
import {
  getDoctorSupervisedProjects,
  parseApiErrorMessage,
  type DoctorSupervisedProject,
} from "@/api/doctorDashboardApi";
import { getGraduationProjectById, getGraduationProjectMembers } from "@/api/gradProjectApi";
import { getProjectMilestones } from "@/api/projectMilestonesApi";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { toast } from "@/hooks/use-toast";

type LoadedProject = {
  supervised: DoctorSupervisedProject;
  projectType: string | null;
  members: Array<{ id: number; name: string; initials: string }>;
  milestones: Array<{ id: number; title: string; status: "Pending" | "In Progress" | "Completed" }>;
  latestMilestone?: { title: string; status: "Pending" | "In Progress" | "Completed" };
};

export default function DoctorProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ActiveProjectCardModel[]>([]);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const supervised = await getDoctorSupervisedProjects();

      const loaded = await Promise.all(
        supervised.map(async (project): Promise<LoadedProject> => {
          const [detailsSettled, membersSettled, milestonesSettled] = await Promise.allSettled([
            getGraduationProjectById(project.projectId),
            getGraduationProjectMembers(project.projectId),
            getProjectMilestones(project.projectId),
          ]);

          const projectType =
            detailsSettled.status === "fulfilled" ? detailsSettled.value.projectType ?? null : null;

          const members =
            membersSettled.status === "fulfilled"
              ? membersSettled.value.members.map((member) => ({
                  id: member.studentId,
                  name: member.name,
                  initials: initialsFromName(member.name || "?"),
                }))
              : [
                  {
                    id: project.owner.studentId,
                    name: project.owner.name,
                    initials: initialsFromName(project.owner.name || "?"),
                  },
                ];

          const milestones =
            milestonesSettled.status === "fulfilled" ? milestonesSettled.value : [];
          const latestMilestone = milestones
            .slice()
            .sort(
              (a, b) =>
                new Date(b.dueDate ?? b.createdAt).getTime() -
                new Date(a.dueDate ?? a.createdAt).getTime(),
            )[0];

          return {
            supervised: project,
            projectType,
            members,
            milestones,
            latestMilestone,
          };
        }),
      );

      const mapped: ActiveProjectCardModel[] = loaded.map(
        ({ supervised, projectType, members, milestones, latestMilestone }) => ({
          id: supervised.projectId,
          category: projectType ?? "Graduation Project",
          status: supervised.isFull ? "completed" : "active",
          title: supervised.name,
          description: supervised.description ?? "No project description provided.",
          milestone: latestMilestone?.title ?? null,
          milestoneCount: milestones.length,
          latestMilestoneStatus: latestMilestone?.status ?? null,
          skills: supervised.requiredSkills ?? [],
          team: members,
          canOpenMilestones: true,
        }),
      );

      setProjects(mapped);
    } catch (error) {
      setProjects([]);
      toast({
        variant: "destructive",
        title: "Could not load active projects",
        description: parseApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const metrics = useMemo(
    () => ({
      activeProjects: projects.length,
      teamComplete: projects.filter((project) => project.status === "completed").length,
      openMilestones: projects.reduce((total, project) => {
        if (project.latestMilestoneStatus != null && project.latestMilestoneStatus !== "Completed") {
          return total + 1;
        }
        return total;
      }, 0),
      totalMilestones: projects.reduce((total, project) => total + (project.milestoneCount ?? 0), 0),
    }),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  const showEmptyState = !isLoading && filteredProjects.length === 0;

  return (
    <main className="flex-1 min-h-full bg-gradient-mesh">
      <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 lg:px-8 lg:py-8">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Active Projects
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground lg:text-[15px]">
            Supervised graduation projects, teams, and milestones.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Supervised projects"
            value={metrics.activeProjects}
            sub="Under your supervision"
            tone="primary"
            icon={FolderKanban}
            empty={isLoading}
          />
          <MetricCard
            label="Open milestones"
            value={metrics.openMilestones}
            sub="Latest milestone not completed"
            tone="warning"
            icon={ClipboardCheck}
            empty={isLoading}
          />
          <MetricCard
            label="Teams complete"
            value={metrics.teamComplete}
            sub="All member seats filled"
            tone="success"
            icon={Users}
            empty={isLoading}
          />
          <MetricCard
            label="Total milestones"
            value={metrics.totalMilestones}
            sub="Across supervised projects"
            tone="info"
            icon={CheckCircle2}
            empty={isLoading}
          />
        </section>

        {projects.length > 0 ? (
          <section className="rounded-2xl border border-border bg-white p-3 shadow-card">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[180px] border-border/70 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                <SelectItem value="active">Supervised</SelectItem>
                <SelectItem value="completed">Team complete</SelectItem>
              </SelectContent>
            </Select>
          </section>
        ) : null}

        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-white p-5 shadow-card"
                  aria-hidden
                >
                  <div className="h-5 w-20 animate-pulse rounded-full bg-secondary" />
                  <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-secondary" />
                  <div className="mt-2 h-4 w-full animate-pulse rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : showEmptyState ? (
            <EmptyProjectsState />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
