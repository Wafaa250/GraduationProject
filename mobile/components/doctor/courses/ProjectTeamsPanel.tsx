import { Users2 } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CourseProjectTeamsResponse, CourseTeam } from "@/api/doctorCoursesApi";
import { CourseWorkspaceEmptyState } from "@/components/doctor/courses/CourseWorkspaceEmptyState";
import { ProjectTeamCard } from "@/components/doctor/courses/ProjectTeamCard";
import { DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import type { useCourseProjectWorkspace } from "@/hooks/useCourseProjectWorkspace";
import type { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  workspace: ReturnType<typeof useCourseProjectWorkspace>["workspace"];
  bundle: ReturnType<typeof useCourseProjectWorkspace>["bundle"];
  previewTeams: CourseProjectTeamsResponse | null;
  onViewTeam: (team: CourseTeam) => void;
  colors: HubColorScheme;
  layout: ReturnType<typeof useResponsiveLayout>;
};

export function ProjectTeamsPanel({
  workspace,
  bundle,
  previewTeams,
  onViewTeam,
  colors,
  layout,
}: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const savedTeams = bundle?.teams?.teams ?? [];
  const teams = (previewTeams?.teams.length ?? 0) > 0 ? previewTeams!.teams : savedTeams;

  if (teams.length === 0) {
    return (
      <CourseWorkspaceEmptyState
        icon={Users2}
        title="No teams yet"
        description={
          workspace.aiMode === "student"
            ? "Teams appear when students form groups on this project."
            : "Configure AI team formation, preview teams, then generate them for this project."
        }
      />
    );
  }

  return (
    <View>
      <Text style={[styles.panelMeta, { fontSize: layout.scale(12) }]}>
        <Text style={styles.panelMetaStrong}>{teams.length}</Text> team{teams.length === 1 ? "" : "s"} for this
        project
      </Text>
      {teams.map((team) => (
        <ProjectTeamCard key={team.teamId || team.teamIndex} team={team} onView={() => onViewTeam(team)} />
      ))}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    panelMeta: {
      marginBottom: DOCTOR_SPACE.md,
      fontWeight: "500",
      color: colors.muted,
    },
    panelMetaStrong: {
      fontWeight: "800",
      color: colors.foreground,
    },
  });
}
