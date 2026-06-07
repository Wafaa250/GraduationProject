import { Layers, Sparkles, Users2 } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { CourseProjectWorkspaceData } from "@/hooks/useCourseProjectWorkspace";
import { formatAiMode } from "@/lib/courseWorkspaceUtils";

type Props = {
  workspace: CourseProjectWorkspaceData;
};

const TONE = {
  success: { bg: "rgba(16, 185, 129, 0.12)", text: "#059669" },
  warning: { bg: "rgba(245, 158, 11, 0.14)", text: "#D97706" },
  info: { bg: "rgba(37, 99, 235, 0.12)", text: "#2563EB" },
  purple: { bg: "rgba(124, 58, 237, 0.12)", text: "#7C3AED" },
  pink: { bg: "rgba(219, 39, 119, 0.12)", text: "#DB2777" },
  doctor: { bg: "rgba(99, 102, 241, 0.12)", text: "#6366F1" },
} as const;

export function CourseProjectHero({ workspace }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const teamSize = workspace.loading ? "…" : String(workspace.teamSize);
  const teamCount = workspace.loading ? "…" : String(workspace.teamCount);
  const formation = workspace.loading ? "…" : formatAiMode(workspace.aiMode);
  const studentLed = workspace.aiMode.trim().toLowerCase() === "student";
  const teamsReady = !workspace.loading && workspace.teamCount > 0;

  return (
    <View style={styles.card}>
      <View style={styles.strip} />
      <Text style={[styles.eyebrow, { fontSize: layout.scale(10) }]}>
        Course project · {workspace.sectionName}
      </Text>
      <Text style={[styles.title, { fontSize: layout.scale(22) }]} numberOfLines={3}>
        {workspace.projectTitle}
      </Text>
      <View style={styles.badges}>
        <HeroBadge
          label={teamsReady ? "Teams formed" : "Awaiting teams"}
          tone="success"
          activeTone={teamsReady ? "success" : "warning"}
          layout={layout}
        />
        <HeroBadge
          label={`${teamCount} team${workspace.teamCount === 1 ? "" : "s"}`}
          tone="info"
          icon={Users2}
          layout={layout}
        />
        <HeroBadge label={`Size ${teamSize}`} tone="purple" icon={Layers} layout={layout} />
        <HeroBadge
          label={formation}
          tone={studentLed ? "pink" : "doctor"}
          icon={Sparkles}
          layout={layout}
        />
      </View>
    </View>
  );
}

function HeroBadge({
  label,
  tone,
  activeTone,
  icon: Icon,
  layout,
}: {
  label: string;
  tone: keyof typeof TONE;
  activeTone?: keyof typeof TONE;
  icon?: typeof Users2;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  const palette = TONE[activeTone ?? tone];
  return (
    <View style={[stylesStatic.badge, { backgroundColor: palette.bg }]}>
      {Icon ? <Icon size={12} color={palette.text} strokeWidth={2} /> : null}
      <Text style={[stylesStatic.badgeText, { fontSize: layout.scale(11), color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
}

const stylesStatic = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: DOCTOR_RADIUS.pill,
  },
  badgeText: {
    fontWeight: "700",
  },
});

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      ...doctorCardStyle(colors),
      padding: DOCTOR_SPACE.lg,
      overflow: "hidden",
      marginBottom: DOCTOR_SPACE.md,
    },
    strip: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: colors.primary,
    },
    eyebrow: {
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.muted,
    },
    title: {
      marginTop: DOCTOR_SPACE.sm,
      fontWeight: "800",
      color: colors.foreground,
      lineHeight: 28,
    },
    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DOCTOR_SPACE.sm,
      marginTop: DOCTOR_SPACE.md,
    },
  });
}
