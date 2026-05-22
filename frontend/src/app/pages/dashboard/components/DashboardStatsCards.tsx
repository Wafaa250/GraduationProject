import { Users, GraduationCap, Mail, FolderKanban, ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "../../../components/ui/utils";

type StatItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  accent: string;
  iconBg: string;
};

type DashboardStatsCardsProps = {
  suggestedTeammates: string;
  suggestedSupervisors: string;
  pendingInvitations: string;
  activeProjects: string;
  teammatesHelper?: string;
  supervisorsHelper?: string;
  invitationsHelper?: string;
  projectsHelper?: string;
};

export function DashboardStatsCards({
  suggestedTeammates,
  suggestedSupervisors,
  pendingInvitations,
  activeProjects,
  teammatesHelper = "From your dashboard summary",
  supervisorsHelper = "Run AI recommendations on your project",
  invitationsHelper = "Pending team invitations",
  projectsHelper = "Graduation project affiliation",
}: DashboardStatsCardsProps) {
  const stats: StatItem[] = [
    {
      icon: Users,
      label: "Suggested Teammates",
      value: suggestedTeammates,
      helper: teammatesHelper,
      accent: "from-primary/15 to-primary/5",
      iconBg: "bg-primary/15 text-primary",
    },
    {
      icon: GraduationCap,
      label: "Suggested Supervisors",
      value: suggestedSupervisors,
      helper: supervisorsHelper,
      accent: "from-primary-glow/20 to-primary-glow/5",
      iconBg: "bg-primary-glow/20 text-primary-glow",
    },
    {
      icon: Mail,
      label: "Pending Invitations",
      value: pendingInvitations,
      helper: invitationsHelper,
      accent: "from-warning/15 to-warning/5",
      iconBg: "bg-warning/15 text-warning",
    },
    {
      icon: FolderKanban,
      label: "Active Projects",
      value: activeProjects,
      helper: projectsHelper,
      accent: "from-success/15 to-success/5",
      iconBg: "bg-success/15 text-success",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none",
              s.accent,
            )}
          />
          <div className="relative flex items-start justify-between">
            <div className={cn("size-11 rounded-xl grid place-items-center", s.iconBg)}>
              <s.icon className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="relative mt-5">
            <div className="text-4xl font-display font-bold tracking-tight text-foreground">
              {s.value}
            </div>
            <div className="text-sm font-semibold text-foreground mt-2">{s.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.helper}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
