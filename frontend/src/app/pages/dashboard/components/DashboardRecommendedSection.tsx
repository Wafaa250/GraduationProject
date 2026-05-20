import { ArrowRight, GraduationCap, Users } from "lucide-react";

import { SkillChip } from "../../../components/design-system";
import { Button } from "../../../components/ui/button";

export type DashboardRecommendedProject = {
  id: number;
  title: string;
  description: string | null;
  abstract?: string | null;
  lookingFor: string[];
  maxTeamSize: number | null;
  formationMode: "students" | "doctor";
};

export type DashboardRecommendedSectionProps = {
  projects: DashboardRecommendedProject[];
  onSeeAll: () => void;
};

export function DashboardRecommendedSection({
  projects,
  onSeeAll,
}: DashboardRecommendedSectionProps) {
  const preview = projects.slice(0, 2);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">Recommended for you</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects matching your skills and interests.
          </p>
        </div>
        {projects.length > 0 ? (
          <Button variant="ghost" size="sm" className="text-primary" onClick={onSeeAll}>
            See all
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      {preview.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
          <p className="font-display font-semibold">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Channel projects from your courses will appear here when published.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {preview.map((project) => {
            const body = (project.abstract ?? project.description ?? "").trim();
            const recruiting = project.formationMode === "students";
            return (
              <article
                key={project.id}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {project.lookingFor.length > 0
                        ? project.lookingFor.slice(0, 2).join(" · ")
                        : "Graduation project"}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                      {project.title}
                    </h3>
                  </div>
                  <span
                    className={
                      recruiting
                        ? "shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success"
                        : "shrink-0 rounded-full bg-warning/20 px-2.5 py-1 text-[11px] font-semibold text-warning"
                    }
                  >
                    {recruiting ? "Recruiting" : "In progress"}
                  </span>
                </div>
                {body ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{body}</p>
                ) : null}
                {project.lookingFor.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {project.lookingFor.slice(0, 4).map((skill) => (
                      <SkillChip key={skill} label={skill} />
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  {project.maxTeamSize != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Team up to {project.maxTeamSize}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {project.formationMode === "doctor" ? "Doctor-led" : "Student-led"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 px-2 text-primary"
                    onClick={onSeeAll}
                  >
                    View
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
