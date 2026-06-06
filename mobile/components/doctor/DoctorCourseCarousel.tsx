import { ArrowUpRight, FolderGit2, GraduationCap, Layers } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { DoctorHubCourseCardModel } from "@/lib/doctorHubMappers";
import { doctorCoursePath } from "@/lib/doctorRoutes";

type Props = {
  courses: DoctorHubCourseCardModel[];
};

const TONE_COLORS = {
  primary: { gradient: ["rgba(124, 58, 237, 0.18)", "rgba(124, 58, 237, 0.04)"], icon: "#7C3AED" },
  info: { gradient: ["rgba(14, 165, 233, 0.18)", "rgba(14, 165, 233, 0.04)"], icon: "#0EA5E9" },
  success: { gradient: ["rgba(16, 185, 129, 0.18)", "rgba(16, 185, 129, 0.04)"], icon: "#10B981" },
  warning: { gradient: ["rgba(245, 158, 11, 0.18)", "rgba(245, 158, 11, 0.04)"], icon: "#F59E0B" },
} as const;

export function DoctorCourseCarousel({ courses }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cardWidth = layout.deviceSize === "tablet" ? layout.scale(268) : layout.scale(232);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + layout.space("sm")}
      contentContainerStyle={{ gap: layout.space("sm"), paddingRight: layout.space("md") }}
    >
      {courses.map((course) => {
        const tone = TONE_COLORS[course.color];
        return (
          <Pressable
            key={course.courseId}
            onPress={() => router.push(doctorCoursePath(course.courseId) as Href)}
            style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <View style={[styles.card, { width: cardWidth, borderRadius: 16, overflow: "hidden" }]}>
              <LinearGradient colors={tone.gradient as [string, string]} style={styles.cardHeader}>
                <View style={styles.topRow}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.cardBg }]}>
                    <GraduationCap size={layout.scale(18)} color={tone.icon} strokeWidth={2} />
                  </View>
                  <Text style={[styles.code, { fontSize: layout.scale(10) }]} numberOfLines={1}>
                    {course.code}
                  </Text>
                </View>
                <Text style={[styles.name, { fontSize: layout.scale(15), marginTop: layout.space("sm") }]} numberOfLines={2}>
                  {course.name}
                </Text>
              </LinearGradient>

              <View style={{ padding: layout.space("md"), paddingTop: layout.space("sm") }}>
                <View style={[styles.statsRow, { gap: 6 }]}>
                  <StatBox icon={<Layers size={10} color={colors.muted} strokeWidth={2} />} value={course.sections} label="Sections" colors={colors} layout={layout} />
                  <StatBox icon={<GraduationCap size={10} color={colors.muted} strokeWidth={2} />} value={course.students} label="Students" colors={colors} layout={layout} />
                  <StatBox icon={<FolderGit2 size={10} color={colors.muted} strokeWidth={2} />} value={course.projects} label="Projects" colors={colors} layout={layout} />
                </View>
                <View style={[styles.openRow, { marginTop: layout.space("md") }]}>
                  <Text style={[styles.openText, { fontSize: layout.scale(12) }]}>Open course</Text>
                  <ArrowUpRight size={layout.scale(14)} color={colors.primary} strokeWidth={2.5} />
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function StatBox({
  icon,
  value,
  label,
  colors,
  layout,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  colors: HubColorScheme;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  return (
    <View style={[statStyles.box, { backgroundColor: colors.background, borderRadius: 8, flex: 1, borderWidth: 1, borderColor: colors.border }]}>
      <Text style={[statStyles.value, { fontSize: layout.scale(14), color: colors.foreground }]}>{value}</Text>
      <View style={statStyles.labelRow}>
        {icon}
        <Text style={[statStyles.label, { fontSize: layout.scale(9), color: colors.muted }]}>{label}</Text>
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { alignItems: "center", paddingVertical: 7, paddingHorizontal: 4 },
  value: { fontWeight: "800" },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  label: { fontWeight: "600" },
});

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 3,
    },
    cardHeader: { padding: 14, paddingBottom: 12 },
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    code: {
      fontWeight: "700",
      letterSpacing: 0.4,
      color: colors.foreground,
      backgroundColor: "rgba(255,255,255,0.65)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      maxWidth: "52%",
    },
    name: { fontWeight: "800", color: colors.foreground, lineHeight: 20, minHeight: 40 },
    statsRow: { flexDirection: "row" },
    openRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    openText: { color: colors.primary, fontWeight: "700" },
  });
