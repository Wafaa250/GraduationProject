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
      <div className="cpw-tabs">
        <div className="cpw-tabs__list" role="tablist" aria-label="Project workspace">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(tab.id)}
                className={cn("cpw-tab", isActive && "cpw-tab--active")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" className="animate-in fade-in duration-200">
        {active === "overview" ? <ProjectOverviewPanel {...props} /> : null}
        {active === "teams" ? <ProjectTeamsPanel {...props} /> : null}
        {active === "students" ? <ProjectStudentsPanel {...props} /> : null}
        {active === "ai" ? <ProjectAiFormationPanel {...props} /> : null}
      </div>
    </section>
  );
}
