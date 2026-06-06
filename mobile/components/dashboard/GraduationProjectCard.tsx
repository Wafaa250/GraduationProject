import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { GraduationProjectView } from "@/lib/dashboardMappers";
import { STUDENT_ROUTES } from "@/lib/studentRoutes";

type Props = {
  project: GraduationProjectView | null;
  sectionTitle: string;
  courseLabels: string[];
};

export function GraduationProjectCard({ project, sectionTitle, courseLabels }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const empty = !project;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius.button,
          padding: layout.space("lg"),
          marginBottom: layout.space("md"),
        },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { fontSize: layout.scale(18) }]}>{sectionTitle}</Text>
          <Text style={[styles.subtitle, { fontSize: layout.fontSize.footer }]}>
            {courseLabels.length > 0 ? courseLabels.join(" · ") : "Your capstone project at a glance."}
          </Text>
        </View>
        {!empty && project ? (
          <View style={styles.stageBadge}>
            <Ionicons name="ellipse" size={8} color="#D97706" />
            <Text style={styles.stageText}>{project.stageLabel ?? project.status}</Text>
          </View>
        ) : null}
      </View>

      {empty ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { borderRadius: layout.radius.button }]}>
            <Ionicons name="rocket-outline" size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.emptyTitle, { fontSize: layout.fontSize.label }]}>
            Start your {sectionTitle.toLowerCase()}
          </Text>
          <Text style={[styles.emptyText, { fontSize: layout.fontSize.footer }]}>
            You haven&apos;t created a graduation project yet. Define your idea and let SkillSwap help you
            find the perfect team.
          </Text>
          <Pressable
            style={[styles.ctaBtn, { borderRadius: layout.radius.button, marginTop: layout.space("md") }]}
            onPress={() => router.push(STUDENT_ROUTES.createGraduationProject as never)}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>Create {sectionTitle}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.projectBody, { borderRadius: layout.radius.input, padding: layout.space("md") }]}>
          <View style={styles.projectTop}>
            <View
              style={[
                styles.projectIcon,
                { width: layout.scale(44), height: layout.scale(44), borderRadius: layout.radius.input },
              ]}
            >
              <Ionicons name="rocket" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.projectTitle, { fontSize: layout.fontSize.label }]}>{project!.title}</Text>
              <Text style={[styles.projectDesc, { fontSize: layout.fontSize.footer, marginTop: 4 }]}>
                {project!.description}
              </Text>
            </View>
          </View>

          <Text style={[styles.skillsLabel, { fontSize: layout.scale(11), marginTop: layout.space("md") }]}>
            REQUIRED SKILLS
          </Text>
          <View style={[styles.skillsWrap, { gap: layout.space("sm"), marginTop: layout.space("sm") }]}>
            {project!.skills.length > 0 ? (
              project!.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noSkills}>No required skills listed.</Text>
            )}
          </View>

          <View style={[styles.footer, { marginTop: layout.space("md"), paddingTop: layout.space("md") }]}>
            <View style={styles.teamRow}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={styles.teamLabel}>Team size</Text>
              <Text style={styles.teamValue}>{project!.teamSize}</Text>
            </View>
            <Pressable
              style={[styles.workspaceBtn, { borderRadius: layout.radius.input }]}
              onPress={() => router.push(STUDENT_ROUTES.graduationProjectWorkspace as never)}
            >
              <Text style={styles.workspaceText}>Open Workspace</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    color: colors.foreground,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 2,
  },
  stageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stageText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 44,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  projectBody: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  projectIcon: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  projectTitle: {
    fontWeight: "700",
    color: colors.foreground,
  },
  projectDesc: {
    color: colors.muted,
    lineHeight: 20,
  },
  skillsLabel: {
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.muted,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillChip: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  skillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  noSkills: {
    fontSize: 12,
    color: colors.muted,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  teamValue: {
    fontWeight: "700",
    color: colors.foreground,
    fontSize: 14,
  },
  workspaceBtn: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  workspaceText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
