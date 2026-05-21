import { Link } from "react-router-dom";

import type { GradProject } from "../../../../api/gradProjectApi";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { cn } from "../../../components/ui/utils";

function parseProjectField(raw: string | null | undefined): string {
  const text = (raw ?? "").trim();
  if (!text) return "";
  let body = text;
  const supMatch = body.match(/\n\nSupervisor preferences:\s*([\s\S]+)$/i);
  if (supMatch) body = body.slice(0, supMatch.index).trim();
  const domainMatch = body.match(/^Domain:\s*(.+?)\n\n([\s\S]+)$/i);
  if (domainMatch) return domainMatch[1].trim();
  return "";
}

export function projectCategoryLine(project: GradProject): string {
  const domain = parseProjectField(project.abstract);
  const type = project.projectType?.trim();
  const skills = (project.requiredSkills ?? []).filter(Boolean);
  if (domain && skills.length > 0) {
    return `${domain} / ${skills.slice(0, 2).join(", ")}`;
  }
  if (domain) return domain;
  if (type && skills.length > 0) {
    return `${type} · ${skills.slice(0, 2).join(" / ")}`;
  }
  if (skills.length > 0) return skills.slice(0, 3).join(" / ");
  if (type) return type;
  return project.ownerName ? `by ${project.ownerName}` : "";
}

export function projectStatusBadge(isFull: boolean): {
  label: string;
  className: string;
} {
  if (isFull) {
    return {
      label: "Team full",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  return {
    label: "Forming team",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  };
}

export function supervisorSummaryLabel(
  project: GradProject,
  pendingDoctorName?: string,
): string {
  if (project.supervisor?.name?.trim()) {
    return project.supervisor.name.trim();
  }
  const pending =
    pendingDoctorName?.trim() ||
    project.pendingSupervisor?.name?.trim();
  if (pending) return `Pending – ${pending}`;
  return "Not assigned yet";
}

export type GraduationProjectSummaryCardProps = {
  project: GradProject;
  currentMembers: number;
  isFull: boolean;
  workspaceTo: string;
  teammatesTo: string;
  className?: string;
};

export function GraduationProjectSummaryCard({
  project,
  currentMembers,
  isFull,
  workspaceTo,
  teammatesTo,
  className,
}: GraduationProjectSummaryCardProps) {
  const capacity = Math.max(project.partnersCount, 1);
  const teamPercent = Math.min(
    100,
    Math.round((currentMembers / capacity) * 100),
  );
  const category = projectCategoryLine(project);
  const status = projectStatusBadge(isFull);
  const supervisorText = supervisorSummaryLabel(project);
  const skills = (project.requiredSkills ?? []).filter(Boolean).slice(0, 4);

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            Your graduation project
          </p>
          <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground">
            {project.name}
          </h3>
          {category ? (
            <p className="mt-1 text-sm text-muted-foreground">{category}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
          <p className="text-xs font-medium text-muted-foreground">Team</p>
          <p className="mt-1 font-display text-lg font-bold text-foreground">
            {currentMembers} / {project.partnersCount}
          </p>
          <Progress
            value={teamPercent}
            className="mt-2 h-1.5 bg-muted [&>[data-slot=progress-indicator]]:bg-primary"
          />
        </div>

        <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
          <p className="text-xs font-medium text-muted-foreground">Supervisor</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {supervisorText}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Skills needed
          </p>
          {skills.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button variant="gradient" className="flex-1" asChild>
          <Link to={workspaceTo}>Open workspace</Link>
        </Button>
        <Button variant="secondary" className="sm:w-auto" asChild>
          <Link to={teammatesTo}>Find teammates</Link>
        </Button>
      </div>
    </article>
  );
}
