import { Layers, Sparkles, Users2 } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import { DOCTOR_STATUS, doctorBrandAccent } from "@/constants/doctorHubTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { CourseProjectWorkspaceData } from "@/hooks/useCourseProjectWorkspace";
import { formatAiMode } from "@/lib/courseWorkspaceUtils";

type Props = {
  workspace: CourseProjectWorkspaceData;
};

type BadgeTone = "brand" | "success" | "warning";

function badgePalette(tone: BadgeTone, colors: HubColorScheme) {
  switch (tone) {
    case "success":
      return { bg: DOCTOR_STATUS.success.bg, text: DOCTOR_STATUS.success.fg };
    case "warning":
      return { bg: DOCTOR_STATUS.warning.bg, text: DOCTOR_STATUS.warning.fg };
    default: {
      const brand = doctorBrandAccent(colors);
      return { bg: brand.bg, text: brand.fg };
    }
  }
}

export function CourseProjectHero({ workspace }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const teamSize = workspace.loading ? "…" : String(workspace.teamSize);
  const teamCount = workspace.loading ? "…" : String(workspace.teamCount);
  const formation = workspace.loading ? "…" : formatAiMode(workspace.aiMode);
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
          tone={teamsReady ? "success" : "warning"}
          colors={colors}
          layout={layout}
        />
        <HeroBadge
          label={`${teamCount} team${workspace.teamCount === 1 ? "" : "s"}`}
          tone="brand"
          icon={Users2}
          colors={colors}
          layout={layout}
        />
        <HeroBadge label={`Size ${teamSize}`} tone="brand" icon={Layers} colors={colors} layout={layout} />
        <HeroBadge label={formation} tone="brand" icon={Sparkles} colors={colors} layout={layout} />
      </View>
    </View>
  );
}

function HeroBadge({
  label,
  tone,
  icon: Icon,
  colors,
  layout,
}: {
  label: string;
  tone: BadgeTone;
  icon?: typeof Users2;
  colors: HubColorScheme;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  const palette = badgePalette(tone, colors);
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
