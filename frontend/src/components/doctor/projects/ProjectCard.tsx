import { Link } from "react-router-dom";
import { MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doctorProjectChatPath, doctorProjectPath } from "@/routes/paths";
import { ProjectStatusBadge, type ProjectHealthStatus } from "@/components/doctor/projects/ProjectStatusBadge";

export interface ActiveProjectCardModel {
  id: number;
  category: string;
  status: ProjectHealthStatus;
  title: string;
  description: string;
  teamSize: number;
  teamCapacity: number;
  supervisorName?: string | null;
  skills: string[];
  team: Array<{ id: number; initials: string; name: string }>;
}

type ProjectCardProps = {
  project: ActiveProjectCardModel;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
            {project.category}
          </span>
          <h3 className="mt-2 line-clamp-2 font-display text-base font-semibold leading-snug text-foreground">
            {project.title}
          </h3>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{project.description}</p>

      {project.supervisorName ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Supervisor: <span className="font-medium text-foreground">{project.supervisorName}</span>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-border/70 bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-secondary-foreground"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {project.team.slice(0, 4).map((member) => (
              <span
                key={member.id}
                title={member.name}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-primary/15 text-[10px] font-semibold text-primary"
              >
                {member.initials}
              </span>
            ))}
            {project.team.length > 4 ? (
              <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-muted text-[10px] font-semibold text-muted-foreground">
                +{project.team.length - 4}
              </span>
            ) : null}
          </div>
          <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {project.teamSize} / {project.teamCapacity} members
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Button size="sm" className="h-8 text-xs" asChild>
          <Link to={doctorProjectPath(project.id)}>Open Project</Link>
        </Button>
        <Button size="sm" variant="secondary" className="h-8 text-xs" asChild>
          <Link to={doctorProjectChatPath(project.id)}>
            <MessageSquare className="mr-1 h-3.5 w-3.5" />
            Team Chat
          </Link>
        </Button>
      </div>
    </article>
  );
}
