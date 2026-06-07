import { FolderOpen, Settings2 } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { CourseProjectWithTeams } from "@/api/doctorCoursesApi";
import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorInsetCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { parseAiFormationFromDescription } from "@/lib/courseProjectAiConfig";
import { formatAiMode, formatProjectSections } from "@/lib/courseWorkspaceUtils";
import { doctorCourseProjectPath } from "@/lib/doctorRoutes";

type Props = {
  courseId: number;
  sectionId: number;
  project: CourseProjectWithTeams;
  onManage: () => void;
};

export function SectionProjectCard({ courseId, sectionId, project, onManage }: Props) {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { publicDescription } = parseAiFormationFromDescription(project.description);
  const workspacePath = doctorCourseProjectPath(courseId, sectionId, project.id);

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { fontSize: layout.scale(15) }]} numberOfLines={2}>
        {project.title}
      </Text>
      {publicDescription ? (
        <Text style={[styles.description, { fontSize: layout.scale(12) }]} numberOfLines={2}>
          {publicDescription}
        </Text>
      ) : null}

      <View style={styles.metaGrid}>
        <Meta label="Sections" value={formatProjectSections(project)} styles={styles} layout={layout} />
        <Meta label="Teams" value={String(project.teamCount)} styles={styles} layout={layout} />
        <Meta label="Team size" value={String(project.teamSize)} styles={styles} layout={layout} />
        <Meta label="Formation" value={formatAiMode(project.aiMode)} styles={styles} layout={layout} />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onManage}
          style={({ pressed }) => [styles.outlineBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Settings2 size={14} color={colors.foreground} strokeWidth={2} />
          <Text style={[styles.outlineBtnText, { fontSize: layout.scale(12) }]}>Manage project</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(workspacePath as never)}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <FolderOpen size={14} color="#fff" strokeWidth={2} />
          <Text style={[styles.primaryBtnText, { fontSize: layout.scale(12) }]}>Open workspace</Text>
        </Pressable>
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
      padding: DOCTOR_SPACE.md,
      marginBottom: DOCTOR_SPACE.sm,
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
      marginTop: DOCTOR_SPACE.md,
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
    actions: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      marginTop: DOCTOR_SPACE.md,
    },
    outlineBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    outlineBtnText: {
      fontWeight: "700",
      color: colors.foreground,
    },
    primaryBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primary,
    },
    primaryBtnText: {
      fontWeight: "800",
      color: "#fff",
    },
  });
}
