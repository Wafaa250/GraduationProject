import { ChevronRight, GraduationCap } from "lucide-react-native";
import { router, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import type { DoctorHubCourseCardModel } from "@/lib/doctorHubMappers";
import { doctorCoursePath } from "@/lib/doctorRoutes";

type Props = {
  course: DoctorHubCourseCardModel;
  showDivider?: boolean;
};

export function DoctorHomeCourseRow({ course, showDivider }: Props) {
  const { colors } = useHubTheme();
  const styles = createDoctorHomeStyles(colors);

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <Pressable
        onPress={() => router.push(doctorCoursePath(course.courseId) as Href)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: HOME_SPACE.md,
          paddingHorizontal: HOME_SPACE.md,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GraduationCap size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, marginLeft: HOME_SPACE.md, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
            {course.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3, fontWeight: "500" }} numberOfLines={1}>
            {course.code}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            <MetricPill label={`${course.sections} sections`} />
            <MetricPill label={`${course.students} students`} />
            <MetricPill label={`${course.projects} projects`} />
          </View>
        </View>
        <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

function MetricPill({ label }: { label: string }) {
  const { colors } = useHubTheme();
  const styles = createDoctorHomeStyles(colors);

  return (
    <View style={[styles.pill, { backgroundColor: colors.border }]}>
      <Text style={[styles.pillText, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}
