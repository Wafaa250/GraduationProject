import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderKanban, MessageSquare, Users } from "lucide-react";
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
import { getDoctorSupervisedProjects, parseApiErrorMessage } from "@/api/doctorDashboardApi";
import { getGraduationProjectById, getGraduationProjectMembers, resolveProjectTypeLabel } from "@/api/gradProjectApi";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { toast } from "@/hooks/use-toast";

export default function DoctorProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ActiveProjectCardModel[]>([]);
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const supervised = await getDoctorSupervisedProjects();

      const mapped = await Promise.all(
        supervised.map(async (project): Promise<ActiveProjectCardModel> => {
          const [detailsSettled, membersSettled] = await Promise.allSettled([
            getGraduationProjectById(project.projectId),
            getGraduationProjectMembers(project.projectId),
          ]);

          const details = detailsSettled.status === "fulfilled" ? detailsSettled.value : null;
          const membersResponse =
            membersSettled.status === "fulfilled" ? membersSettled.value : null;

          const members =
            membersResponse && membersResponse.members.length > 0
              ? membersResponse.members.map((member) => ({
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

          const teamSize = membersResponse?.currentMembers ?? project.memberCount;
          const teamCapacity = membersResponse?.totalCapacity ?? project.partnersCount;
          const skills = [
            ...(project.requiredSkills ?? []),
            ...(details?.technologies ?? []),
          ].filter((skill, index, arr) => arr.indexOf(skill) === index);

          return {
            id: project.projectId,
            category:
              project.projectTypeLabel ??
              details?.projectTypeLabel ??
              resolveProjectTypeLabel({
                projectType: project.projectType ?? details?.projectType ?? "GP",
                ownerFaculty: project.owner.faculty ?? details?.ownerFaculty,
                ownerMajor: project.owner.major ?? details?.ownerMajor,
              }),
            status: teamSize >= teamCapacity && teamCapacity > 0 ? "completed" : "active",
            title: project.name,
            description: project.description?.trim() || "No project description provided.",
            teamSize,
            teamCapacity,
            supervisorName: details?.supervisor?.name ?? null,
            skills: skills.slice(0, 6),
            team: members,
          };
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

  const metrics = useMemo(() => {
    let teamsComplete = 0;
    for (const project of projects) {
      if (project.status === "completed") teamsComplete += 1;
    }
    return {
      activeProjects: projects.length,
      teamsComplete,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  const showEmptyState = !isLoading && projects.length === 0;
  const showFilteredEmpty = !isLoading && projects.length > 0 && filteredProjects.length === 0;

  return (
    <main className="flex-1 min-h-full bg-gradient-mesh">
      <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 lg:px-8 lg:py-8">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Active Projects
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground lg:text-[15px]">
            Supervised graduation projects — overview, team communication, and shared files.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Supervised projects"
            value={metrics.activeProjects}
            sub="Under your supervision"
            tone="primary"
            icon={FolderKanban}
            empty={isLoading}
          />
          <MetricCard
            label="Teams complete"
            value={metrics.teamsComplete}
            sub="All member seats filled"
            tone="success"
            icon={Users}
            empty={isLoading}
          />
          <MetricCard
            label="Team chats"
            value={metrics.activeProjects}
            sub="One conversation per project"
            tone="info"
            icon={MessageSquare}
            empty={isLoading}
          />
        </section>

        {projects.length > 0 ? (
          <section className="rounded-2xl border border-border bg-card p-3 shadow-card">
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
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
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
          ) : showFilteredEmpty ? (
            <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center shadow-card">
              <p className="font-display font-semibold text-foreground">No projects in this filter</p>
              <p className="mt-1 text-sm text-muted-foreground">Try another status filter.</p>
            </div>
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
