import { Briefcase, CheckCircle2, Users } from "lucide-react";
import { DoctorProfileSection } from "./DoctorProfileSection";

type DoctorProfileSupervisionSummaryProps = {
  supervisedStudents: number;
  activeProjects: number;
  completedProjects: number;
};

export function DoctorProfileSupervisionSummary({
  supervisedStudents,
  activeProjects,
  completedProjects,
}: DoctorProfileSupervisionSummaryProps) {
  return (
    <DoctorProfileSection
      title="Supervision Summary"
      description="Current graduation project supervision activity"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat
          icon={Users}
          label="Supervised students"
          value={supervisedStudents}
          hint="Project leaders currently assigned to you"
        />
        <SummaryStat
          icon={Briefcase}
          label="Active projects"
          value={activeProjects}
          hint="Projects you supervise today"
        />
        <SummaryStat
          icon={CheckCircle2}
          label="Completed projects"
          value={completedProjects}
          hint="Ended supervisions (resignation or cancellation accepted)"
        />
      </div>
    </DoctorProfileSection>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 px-4 py-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}
