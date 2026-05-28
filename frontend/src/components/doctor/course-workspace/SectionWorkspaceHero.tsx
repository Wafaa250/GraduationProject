import type { SectionWorkspaceData } from "@/components/doctor/course-workspace/types";
import { formatSectionSchedule } from "@/components/doctor/course-workspace/courseWorkspaceUtils";

type SectionWorkspaceHeroProps = {
  section: SectionWorkspaceData;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function SectionWorkspaceHero({ section }: SectionWorkspaceHeroProps) {
  const schedule = formatSectionSchedule(
    section.schedule.days,
    section.schedule.timeFrom,
    section.schedule.timeTo,
  );
  const studentsValue = section.loading ? "…" : String(section.students);
  const projectsValue = section.loading ? "…" : String(section.projects);
  const capacityValue = section.loading ? "…" : String(section.capacity);

  return (
    <header className="rounded-xl border border-border/70 bg-card px-5 py-4 shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Section</p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {section.sectionName}
          </h1>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{schedule}</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <Stat label="Capacity" value={capacityValue} />
          <div className="hidden h-8 w-px bg-border/70 sm:block" />
          <Stat label="Students" value={studentsValue} />
          <div className="hidden h-8 w-px bg-border/70 sm:block" />
          <Stat label="Projects" value={projectsValue} />
        </div>
      </div>
    </header>
  );
}
