import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";

export type DashboardWelcomeHeroProps = {
  firstName?: string;
  completeness: number;
  onBrowseProjects: () => void;
  onCreateProject: () => void;
};

export function DashboardWelcomeHero({
  firstName,
  completeness,
  onBrowseProjects,
  onCreateProject,
}: DashboardWelcomeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-hero p-6 text-primary-foreground shadow-glow md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] surface-grid"
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Hi, {firstName ?? "there"} 👋
          </h1>
          <p className="max-w-xl text-sm text-primary-foreground/85 md:text-base">
            {completeness >= 80
              ? "Your profile is looking strong — keep exploring matches and projects."
              : `Your profile is ${completeness}% complete. Finish it to unlock better AI matches.`}
          </p>
          <div className="max-w-md space-y-2">
            <Progress
              value={completeness}
              className="h-2.5 bg-primary-foreground/20 [&>[data-slot=progress-indicator]]:bg-primary-foreground"
            />
            <p className="text-xs font-semibold text-primary-foreground/80">
              {completeness}% complete
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
          <Button
            variant="outline"
            className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            asChild
          >
            <Link to="/edit-profile">Complete profile</Link>
          </Button>
          <Button
            className="bg-card text-foreground shadow-soft hover:bg-card/95"
            onClick={onCreateProject}
          >
            Create project
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="text-primary-foreground/90 hover:bg-primary-foreground/15 hover:text-primary-foreground lg:hidden"
            onClick={onBrowseProjects}
          >
            Browse projects
          </Button>
        </div>
      </div>
    </section>
  );
}
