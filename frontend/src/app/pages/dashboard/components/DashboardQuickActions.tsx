import { FolderPlus, GraduationCap, User, Users } from "lucide-react";

import { DashboardCard } from "../../../components/design-system";

export type DashboardQuickActionsProps = {
  onCreateProject: () => void;
};

export function DashboardQuickActions({ onCreateProject }: DashboardQuickActionsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardCard
        icon={User}
        title="Smart Profile"
        description="Showcase your skills & goals"
        to="/profile"
        accent="primary"
      />
      <DashboardCard
        icon={FolderPlus}
        title="Create Project"
        description="Start your graduation idea"
        onClick={onCreateProject}
        accent="ai"
        badge="AI"
      />
      <DashboardCard
        icon={Users}
        title="Find Teammates"
        description="AI-matched students by skill"
        to="/students"
        accent="primary"
      />
      <DashboardCard
        icon={GraduationCap}
        title="Find Supervisor"
        description="Doctor matches by research"
        to="#supervisor-recommendations"
        accent="accent"
      />
    </section>
  );
}
