import { ArrowRight, Users2 } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CourseTeam } from "@/api/doctorCoursesApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorInsetCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getTeamColorTheme } from "@/lib/courseTeamColors";

type Props = {
  team: CourseTeam;
  onView: () => void;
};

export function ProjectTeamCard({ team, onView }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const theme = getTeamColorTheme(team.teamIndex);
  const teamName = `Team ${team.teamIndex + 1}`;

  return (
    <View style={[styles.card, { borderLeftColor: theme.accent }]}>
      <View style={[styles.header, { backgroundColor: theme.soft }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.soft }]}>
          <Users2 size={20} color={theme.accent} strokeWidth={2} />
        </View>
        <View style={styles.headerBody}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { fontSize: layout.scale(14) }]}>{teamName}</Text>
            <View style={[styles.colorPill, { backgroundColor: theme.soft }]}>
              <Text style={[styles.colorPillText, { color: theme.accent, fontSize: layout.scale(10) }]}>
                {theme.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { fontSize: layout.scale(11) }]}>
            {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        {team.members.length > 0 ? (
          team.members.slice(0, 5).map((member) => (
            <View key={member.studentId} style={styles.memberRow}>
              <FeedAvatar name={member.name} size={24} roleType="student" />
              <Text style={[styles.memberName, { fontSize: layout.scale(12) }]} numberOfLines={1}>
                {member.name}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyMembers, { fontSize: layout.scale(12) }]}>No members assigned</Text>
        )}
        {team.members.length > 5 ? (
          <Text style={[styles.moreMembers, { fontSize: layout.scale(11) }]}>
            +{team.members.length - 5} more
          </Text>
        ) : null}

        <Pressable
          onPress={onView}
          style={({ pressed }) => [styles.viewBtn, { opacity: pressed ? 0.9 : 1, backgroundColor: colors.primary }]}
        >
          <Text style={[styles.viewBtnText, { fontSize: layout.scale(13) }]}>View team</Text>
          <ArrowRight size={16} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      ...doctorInsetCardStyle(colors),
      overflow: "hidden",
      marginBottom: DOCTOR_SPACE.sm,
      borderLeftWidth: 3,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: DOCTOR_SPACE.md,
      padding: DOCTOR_SPACE.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: DOCTOR_RADIUS.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    headerBody: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
    },
    colorPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: DOCTOR_RADIUS.pill,
    },
    colorPillText: {
      fontWeight: "800",
    },
    subtitle: {
      marginTop: 2,
      fontWeight: "500",
      color: colors.muted,
    },
    body: {
      padding: DOCTOR_SPACE.md,
      paddingTop: 0,
      gap: DOCTOR_SPACE.sm,
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
    },
    memberName: {
      flex: 1,
      fontWeight: "600",
      color: colors.foreground,
    },
    emptyMembers: {
      fontWeight: "500",
      color: colors.muted,
    },
    moreMembers: {
      fontWeight: "500",
      color: colors.muted,
    },
    viewBtn: {
      marginTop: DOCTOR_SPACE.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: DOCTOR_RADIUS.sm,
    },
    viewBtnText: {
      fontWeight: "800",
      color: "#fff",
    },
  });
}
