import type { CourseProjectWorkspaceData } from "@/components/doctor/course-project-workspace/types";
import { formatAiMode } from "@/components/doctor/course-workspace/courseWorkspaceUtils";

type CourseProjectWorkspaceHeroProps = {
  workspace: CourseProjectWorkspaceData;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function CourseProjectWorkspaceHero({ workspace }: CourseProjectWorkspaceHeroProps) {
  const teamSize = workspace.loading ? "…" : String(workspace.teamSize);
  const teamCount = workspace.loading ? "…" : String(workspace.teamCount);
  const formation = workspace.loading ? "…" : formatAiMode(workspace.aiMode);

  return (
    <header className="rounded-xl border border-border/70 bg-card px-5 py-4 shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Course project · {workspace.sectionName}
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {workspace.projectTitle}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <Stat label="Team size" value={teamSize} />
          <div className="hidden h-8 w-px bg-border/70 sm:block" />
          <Stat label="Teams" value={teamCount} />
          <div className="hidden h-8 w-px bg-border/70 sm:block" />
          <Stat label="Formation" value={formation} />
        </div>
      </div>
    </header>
  );
}
