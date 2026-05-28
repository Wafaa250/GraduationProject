import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CourseProjectWorkspacePanelProps } from "@/components/doctor/course-project-workspace/types";
import { ProjectOverviewPanel } from "@/components/doctor/course-project-workspace/panels/ProjectOverviewPanel";
import { ProjectTeamsPanel } from "@/components/doctor/course-project-workspace/panels/ProjectTeamsPanel";
import { ProjectStudentsPanel } from "@/components/doctor/course-project-workspace/panels/ProjectStudentsPanel";
import { ProjectAiFormationPanel } from "@/components/doctor/course-project-workspace/panels/ProjectAiFormationPanel";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "teams", label: "Teams" },
  { id: "students", label: "Students" },
  { id: "ai", label: "AI Team Formation" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function CourseProjectWorkspaceTabs(props: CourseProjectWorkspacePanelProps) {
  const [active, setActive] = useState<TabId>("overview");

  return (
    <section className="space-y-5">
      <div className="border-b border-border/70">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Project workspace">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(tab.id)}
                className={cn(
                  "relative shrink-0 -mb-px px-4 py-2.5 text-sm transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel">
        {active === "overview" ? <ProjectOverviewPanel {...props} /> : null}
        {active === "teams" ? <ProjectTeamsPanel {...props} /> : null}
        {active === "students" ? <ProjectStudentsPanel {...props} /> : null}
        {active === "ai" ? <ProjectAiFormationPanel {...props} /> : null}
      </div>
    </section>
  );
}
