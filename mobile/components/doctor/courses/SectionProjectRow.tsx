import { FolderKanban } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CourseProjectWithTeams } from "@/api/doctorCoursesApi";
import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorInsetCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatAiMode, formatProjectSections } from "@/lib/courseWorkspaceUtils";

type Props = {
  project: CourseProjectWithTeams;
};

export function SectionProjectRow({ project }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const description = project.description?.trim() ?? "";

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <FolderKanban size={18} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { fontSize: layout.scale(15) }]} numberOfLines={2}>
          {project.title}
        </Text>
        {description ? (
          <Text style={[styles.description, { fontSize: layout.scale(12) }]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <View style={styles.metaGrid}>
          <Meta label="Sections" value={formatProjectSections(project)} styles={styles} layout={layout} />
          <Meta label="Team size" value={String(project.teamSize)} styles={styles} layout={layout} />
          <Meta label="Teams" value={String(project.teamCount)} styles={styles} layout={layout} />
          <Meta label="Formation" value={formatAiMode(project.aiMode)} styles={styles} layout={layout} />
        </View>
      </View>
    </View>
  );
}

function Meta({
  label,
  value,
  styles,
  layout,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  return (
    <View style={styles.metaCell}>
      <Text style={[styles.metaLabel, { fontSize: layout.scale(10) }]}>{label}</Text>
      <Text style={[styles.metaValue, { fontSize: layout.scale(12) }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      ...doctorInsetCardStyle(colors),
      flexDirection: "row",
      padding: DOCTOR_SPACE.md,
      marginBottom: DOCTOR_SPACE.sm,
      gap: DOCTOR_SPACE.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
    },
    description: {
      marginTop: 4,
      fontWeight: "500",
      color: colors.muted,
      lineHeight: 18,
    },
    metaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: DOCTOR_SPACE.sm,
      gap: DOCTOR_SPACE.sm,
    },
    metaCell: {
      width: "47%",
    },
    metaLabel: {
      fontWeight: "600",
      color: colors.muted,
    },
    metaValue: {
      marginTop: 2,
      fontWeight: "700",
      color: colors.foreground,
    },
  });
}
