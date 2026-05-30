import { Layers, Sparkles, Users2 } from "lucide-react";
import type { CourseProjectWorkspaceData } from "@/components/doctor/course-project-workspace/types";
import { formatAiMode } from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import { cn } from "@/lib/utils";

type CourseProjectWorkspaceHeroProps = {
  workspace: CourseProjectWorkspaceData;
};

export function CourseProjectWorkspaceHero({ workspace }: CourseProjectWorkspaceHeroProps) {
  const teamSize = workspace.loading ? "…" : String(workspace.teamSize);
  const teamCount = workspace.loading ? "…" : String(workspace.teamCount);
  const formation = workspace.loading ? "…" : formatAiMode(workspace.aiMode);
  const studentLed = workspace.aiMode.trim().toLowerCase() === "student";
  const teamsReady = !workspace.loading && workspace.teamCount > 0;

  return (
    <header className="cpw-hero">
      <div className="cpw-hero__strip" aria-hidden />
      <div className="cpw-hero__body">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Course project · {workspace.sectionName}
        </p>
        <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {workspace.projectTitle}
        </h1>
        <div className="cpw-hero__badges">
          <span
            className={cn(
              "cpw-badge",
              teamsReady ? "cpw-badge--status-active" : "cpw-badge--status-pending",
            )}
          >
            {teamsReady ? "Teams formed" : "Awaiting teams"}
          </span>
          <span className="cpw-badge cpw-badge--teams">
            <Users2 className="h-3 w-3" />
            {teamCount} team{workspace.teamCount === 1 ? "" : "s"}
          </span>
          <span className="cpw-badge cpw-badge--size">
            <Layers className="h-3 w-3" />
            Size {teamSize}
          </span>
          <span
            className={cn(
              "cpw-badge",
              studentLed ? "cpw-badge--formation-student" : "cpw-badge--formation-doctor",
            )}
          >
            <Sparkles className="h-3 w-3" />
            {formation}
          </span>
        </div>
      </div>
    </header>
  );
}
