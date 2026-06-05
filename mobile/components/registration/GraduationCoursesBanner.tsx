import { StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type GraduationCoursesBannerProps = {
  courses: string[];
};

export function GraduationCoursesBanner({ courses }: GraduationCoursesBannerProps) {
  const layout = useResponsiveLayout();

  if (courses.length === 0) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          borderRadius: layout.radius.input,
          padding: layout.space("md"),
          marginBottom: layout.space("md"),
        },
      ]}
    >
      <Text style={[styles.heading, { fontSize: layout.scale(11) }]}>GRADUATION PROJECT COURSES</Text>
      {courses.map((course) => (
        <Text key={course} style={[styles.course, { fontSize: layout.fontSize.footer, marginTop: layout.space("xs") }]}>
          {course}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    backgroundColor: AUTH_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
  },
  heading: {
    fontWeight: "700",
    letterSpacing: 0.6,
    color: AUTH_COLORS.muted,
  },
  course: {
    color: AUTH_COLORS.foreground,
    lineHeight: 20,
  },
});
