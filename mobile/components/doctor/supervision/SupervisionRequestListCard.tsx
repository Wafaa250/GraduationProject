import { Calendar, ChevronRight, Users } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { SupervisionStatusBadge } from "@/components/doctor/supervision/SupervisionStatusBadge";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  aiMatchScore,
  formatProjectTypeLabel,
  formatSupervisionSubmittedDate,
  normalizeSupervisionStatus,
  teamSizeLabel,
} from "@/lib/supervisionRequestUi";

type Props = {
  request: DoctorSupervisorRequest;
  onPress: () => void;
};

export function SupervisionRequestListCard({ request, onPress }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const pending = normalizeSupervisionStatus(request.status) === "pending";
  const score = aiMatchScore(request);
  const skills = request.project.requiredSkills ?? [];
  const visibleSkills = skills.slice(0, 2);
  const extraSkills = skills.length - visibleSkills.length;
  const projectType = formatProjectTypeLabel(
    request.project.projectType,
    request.sender.faculty,
    request.sender.major,
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
      accessibilityRole="button"
      accessibilityHint="Opens request details"
    >
      <View style={styles.row}>
        <FeedAvatar name={request.sender.name} size={layout.scale(40)} roleType="student" />

        <View style={styles.body}>
          <View style={styles.titleLine}>
            <Text style={[styles.studentName, { fontSize: layout.scale(15) }]} numberOfLines={1}>
              {request.sender.name}
            </Text>
            <SupervisionStatusBadge status={request.status} compact />
          </View>

          <Text style={[styles.major, { fontSize: layout.scale(12) }]} numberOfLines={1}>
            {request.sender.major}
          </Text>

          <Text style={[styles.projectTitle, { fontSize: layout.scale(14) }]} numberOfLines={2}>
            {request.project.name}
          </Text>

          <Text style={[styles.projectMeta, { fontSize: layout.scale(11) }]} numberOfLines={1}>
            {projectType}
          </Text>

          {visibleSkills.length > 0 ? (
            <View style={styles.skillsRow}>
              {visibleSkills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={[styles.skillText, { fontSize: layout.scale(10) }]} numberOfLines={1}>
                    {skill}
                  </Text>
                </View>
              ))}
              {extraSkills > 0 ? (
                <Text style={[styles.moreSkills, { fontSize: layout.scale(10) }]}>+{extraSkills}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Users size={12} color={colors.muted} strokeWidth={2} />
              <Text style={[styles.metaText, { fontSize: layout.scale(11) }]}>
                {teamSizeLabel(request)}
              </Text>
            </View>
            <Text style={styles.metaSep}>·</Text>
            <View style={styles.metaItem}>
              <Calendar size={12} color={colors.muted} strokeWidth={2} />
              <Text style={[styles.metaText, { fontSize: layout.scale(11) }]}>
                {formatSupervisionSubmittedDate(request.createdAt)}
              </Text>
            </View>
            {pending && score > 0 ? (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Text style={[styles.matchText, { fontSize: layout.scale(11), color: colors.primary }]}>
                  {score}% match
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <ChevronRight size={16} color={colors.muted} strokeWidth={2.5} style={styles.chevron} />
      </View>
    </Pressable>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: DOCTOR_SPACE.md,
      paddingHorizontal: DOCTOR_SPACE.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: DOCTOR_SPACE.sm,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    titleLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: DOCTOR_SPACE.sm,
    },
    studentName: {
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
    },
    major: {
      color: colors.muted,
      fontWeight: "500",
    },
    projectTitle: {
      fontWeight: "700",
      color: colors.foreground,
      lineHeight: 19,
      marginTop: 6,
    },
    projectMeta: {
      color: colors.muted,
      fontWeight: "500",
    },
    skillsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 5,
      marginTop: 6,
    },
    skillChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.primarySoft,
      maxWidth: "46%",
    },
    skillText: {
      color: colors.foreground,
      fontWeight: "600",
    },
    moreSkills: {
      color: colors.muted,
      fontWeight: "700",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 6,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    metaText: {
      color: colors.muted,
      fontWeight: "500",
    },
    metaSep: {
      color: colors.muted,
      opacity: 0.45,
      fontSize: 11,
    },
    matchText: {
      fontWeight: "700",
    },
    chevron: {
      marginTop: 2,
    },
  });
}
