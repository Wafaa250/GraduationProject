import { ChevronRight, MessageSquare, Users } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { ActiveProjectStatusBadge } from "@/components/doctor/projects/ActiveProjectStatusBadge";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { ActiveProjectCardModel } from "@/lib/doctorActiveProjectUi";
import { formatDoctorHubDate } from "@/lib/doctorHubMappers";

type Props = {
  project: ActiveProjectCardModel;
  onOpen: () => void;
  onChat: () => void;
};

export function ActiveProjectListCard({ project, onOpen, onChat }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const visibleSkills = project.skills.slice(0, 2);
  const extraSkills = project.skills.length - visibleSkills.length;
  const visibleTeam = project.team.slice(0, 3);
  const createdLabel = project.createdAt ? formatDoctorHubDate(project.createdAt) : "";

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={[styles.category, { fontSize: layout.scale(10) }]} numberOfLines={1}>
            {project.category.toUpperCase()}
          </Text>
          <Text style={[styles.title, { fontSize: layout.scale(16) }]} numberOfLines={2}>
            {project.title}
          </Text>
        </View>
        <ActiveProjectStatusBadge status={project.status} compact />
      </View>

      <Text style={[styles.description, { fontSize: layout.scale(13) }]} numberOfLines={2}>
        {project.description}
      </Text>

      <View style={styles.metaLines}>
        {project.supervisorName ? (
          <Text style={[styles.metaLine, { fontSize: layout.scale(11) }]} numberOfLines={1}>
            Supervisor: <Text style={styles.metaStrong}>{project.supervisorName}</Text>
          </Text>
        ) : null}
        {project.ownerName ? (
          <Text style={[styles.metaLine, { fontSize: layout.scale(11) }]} numberOfLines={1}>
            Team lead: <Text style={styles.metaStrong}>{project.ownerName}</Text>
          </Text>
        ) : null}
      </View>

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

      <View style={styles.teamRow}>
        <View style={styles.avatarStack}>
          {visibleTeam.map((member, index) => (
            <View key={member.id} style={[styles.avatarWrap, index > 0 && { marginLeft: -8 }]}>
              <FeedAvatar name={member.name} size={26} roleType="student" />
            </View>
          ))}
        </View>
        <View style={styles.teamMeta}>
          <Users size={12} color={colors.muted} strokeWidth={2} />
          <Text style={[styles.teamText, { fontSize: layout.scale(11) }]}>
            {project.teamSize}/{project.teamCapacity}
          </Text>
          {createdLabel ? (
            <>
              <Text style={styles.metaSep}>·</Text>
              <Text style={[styles.teamText, { fontSize: layout.scale(11) }]}>{createdLabel}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onOpen();
          }}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.primaryBtnText}>Open</Text>
          <ChevronRight size={15} color="#FFF" strokeWidth={2.5} />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onChat();
          }}
          style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <MessageSquare size={15} color={colors.foreground} strokeWidth={2.2} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground, fontSize: layout.scale(13) }]}>
            Chat
          </Text>
        </Pressable>
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
      padding: DOCTOR_SPACE.md,
      gap: 8,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: DOCTOR_SPACE.sm,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    category: {
      color: colors.primary,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
      lineHeight: 21,
      letterSpacing: -0.2,
    },
    description: {
      color: colors.muted,
      lineHeight: 18,
      fontWeight: "500",
    },
    metaLines: {
      gap: 2,
    },
    metaLine: {
      color: colors.muted,
      fontWeight: "500",
    },
    metaStrong: {
      color: colors.foreground,
      fontWeight: "700",
    },
    metaSep: {
      color: colors.muted,
      opacity: 0.45,
    },
    skillsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 5,
    },
    skillChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.inputBg,
      maxWidth: "48%",
    },
    skillText: {
      color: colors.foreground,
      fontWeight: "600",
    },
    moreSkills: {
      color: colors.muted,
      fontWeight: "700",
    },
    teamRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 2,
    },
    avatarStack: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarWrap: {
      borderWidth: 2,
      borderColor: colors.cardBg,
      borderRadius: 999,
    },
    teamMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    teamText: {
      color: colors.muted,
      fontWeight: "600",
    },
    actions: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      marginTop: 4,
    },
    primaryBtn: {
      flex: 1,
      minHeight: 42,
      borderRadius: DOCTOR_RADIUS.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 14,
    },
    secondaryBtn: {
      flex: 1,
      minHeight: 42,
      borderRadius: DOCTOR_RADIUS.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    secondaryBtnText: {
      fontWeight: "700",
    },
  });
}
