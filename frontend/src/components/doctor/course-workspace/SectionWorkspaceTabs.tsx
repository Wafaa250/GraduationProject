import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SectionWorkspacePanelProps } from "@/components/doctor/course-workspace/types";
import { SectionStudentsPanel } from "@/components/doctor/course-workspace/panels/SectionStudentsPanel";
import { SectionProjectsPanel } from "@/components/doctor/course-workspace/panels/SectionProjectsPanel";
const tabs = [
  { id: "students", label: "Students" },
  { id: "projects", label: "Projects" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function SectionWorkspaceTabs(props: SectionWorkspacePanelProps) {
  const [active, setActive] = useState<TabId>("students");

  return (
    <section className="space-y-5">
      <div className="border-b border-border/70">
        <div className="flex gap-1" role="tablist" aria-label="Section workspace">
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
                  "relative -mb-px px-4 py-2.5 text-sm transition-colors",
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
        {active === "students" ? <SectionStudentsPanel {...props} /> : null}
        {active === "projects" ? <SectionProjectsPanel {...props} /> : null}
      </div>
    </section>
  );
}
