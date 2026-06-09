import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/paths";
import { Rocket, Plus, Users, CircleDot } from "lucide-react";

export type GraduationProjectView = {
  title: string;
  description: string;
  status: string;
  skills: string[];
  teamSize: string;
  stageLabel?: string;
};

type GraduationProjectProps = {
  project: GraduationProjectView | null;
  empty?: boolean;
  sectionTitle?: string;
  courseLabels?: string[];
};

export const GraduationProject = ({
  project,
  empty = false,
  sectionTitle = "Graduation Project",
  courseLabels = [],
}: GraduationProjectProps) => (
  <section
    aria-labelledby="grad-heading"
    className="rounded-2xl bg-card border border-border shadow-soft p-6 md:p-7 animate-fade-in-up flex flex-col"
  >
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 id="grad-heading" className="text-xl font-display font-bold tracking-tight">
          {sectionTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {courseLabels.length > 0
            ? courseLabels.join(" · ")
            : "Your capstone project at a glance."}
        </p>
      </div>
      {!empty && project ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning-foreground border border-warning/30">
          <CircleDot className="w-3 h-3" />
          {project.stageLabel ?? project.status}
        </span>
      ) : null}
    </div>

    {empty || !project ? (
      <EmptyGraduation sectionTitle={sectionTitle} />
    ) : (
      <div className="flex flex-col">
        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-card border border-border">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-primary opacity-10 blur-2xl" aria-hidden />
          <div className="relative">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-glow">
                <Rocket className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold tracking-tight">{project.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Required Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {project.skills.length > 0 ? (
                  project.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/8 text-primary border border-primary/20 hover:bg-primary/12 transition-smooth"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No required skills listed.</span>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-border">
              <div className="inline-flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Team size</span>
                <span className="font-semibold">{project.teamSize}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hover:border-primary/50 hover:text-primary transition-smooth"
                asChild
              >
                <Link to={ROUTES.graduationProjectWorkspace}>Open Workspace</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </section>
);

const EmptyGraduation = ({ sectionTitle }: { sectionTitle: string }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
    <div className="relative mb-5">
      <div className="absolute inset-0 bg-gradient-accent opacity-20 blur-2xl rounded-full" aria-hidden />
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
        <Rocket className="w-7 h-7" />
      </div>
    </div>
    <h3 className="font-display font-semibold">Start your {sectionTitle.toLowerCase()}</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
      You haven&apos;t created a graduation project yet. Define your idea and let SkillSwap help you find the perfect team.
    </p>
    <Button
      className="mt-5 bg-gradient-primary hover:opacity-95 hover:shadow-glow transition-smooth gap-2"
      asChild
    >
      <Link to={ROUTES.createGraduationProject}>
        <Plus className="w-4 h-4" />
        Create {sectionTitle}
      </Link>
    </Button>
  </div>
);
