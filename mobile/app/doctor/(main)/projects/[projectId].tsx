import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { Download, ExternalLink, FileText, MessageSquare } from "lucide-react-native";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { resignDoctorSupervision } from "@/api/doctorDashboardApi";
import {
  getGraduationProjectAbstractFile,
  getGraduationProjectById,
  getGraduationProjectMembers,
  resolveProjectTypeLabel,
  type GradProject,
  type GradProjectAbstractFile,
  type GraduationProjectMembersResponse,
} from "@/api/gradProjectApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDoctorHubDate } from "@/lib/doctorHubMappers";
import { doctorProjectChatPath, DOCTOR_ROUTES } from "@/lib/doctorRoutes";

type DetailTab = "overview" | "files" | "team";

export default function DoctorProjectDetailScreen() {
  const { projectId: idParam } = useLocalSearchParams<{ projectId: string }>();
  const projectId = Number(idParam);
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resigning, setResigning] = useState(false);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [project, setProject] = useState<GradProject | null>(null);
  const [members, setMembers] = useState<GraduationProjectMembersResponse | null>(null);
  const [abstractFile, setAbstractFile] = useState<GradProjectAbstractFile | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!Number.isFinite(projectId)) return;
    if (!silent) setLoading(true);
    try {
      const [projectData, team, file] = await Promise.all([
        getGraduationProjectById(projectId),
        getGraduationProjectMembers(projectId),
        getGraduationProjectAbstractFile(projectId),
      ]);
      setProject(projectData);
      setMembers(team);
      setAbstractFile(file);
    } catch (err) {
      Alert.alert("Could not load project", parseApiErrorMessage(err));
      setProject(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const handleResign = () => {
    Alert.alert(
      "Resign supervision?",
      "The team will need to request a new supervisor.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resign",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setResigning(true);
              try {
                await resignDoctorSupervision(projectId);
                Alert.alert("Supervision ended");
                router.replace(DOCTOR_ROUTES.projects as Href);
              } catch (err) {
                Alert.alert("Resign failed", parseApiErrorMessage(err));
              } finally {
                setResigning(false);
              }
            })();
          },
        },
      ],
    );
  };

  const openFile = async () => {
    if (!abstractFile?.downloadUrl) return;
    try {
      await Linking.openURL(abstractFile.downloadUrl);
    } catch {
      Alert.alert("Could not open file");
    }
  };

  if (!Number.isFinite(projectId)) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Invalid project" fallbackHref={DOCTOR_ROUTES.projects} />
        <View style={styles.center}>
          <Text style={styles.mutedText}>This project link is not valid.</Text>
        </View>
      </DoctorScreen>
    );
  }

  if (loading && !project) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Project" fallbackHref={DOCTOR_ROUTES.projects} variant="compact" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </DoctorScreen>
    );
  }

  if (!project) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Not found" fallbackHref={DOCTOR_ROUTES.projects} />
        <View style={styles.center}>
          <Text style={styles.mutedText}>Project not found.</Text>
        </View>
      </DoctorScreen>
    );
  }

  const description = project.abstract?.trim() || project.description?.trim() || null;
  const technologies = project.technologies ?? [];
  const skills = project.requiredSkills ?? [];
  const preferredRoles = project.preferredRoles ?? [];
  const subtitle =
    project.projectTypeLabel ??
    (project.projectType ? `${resolveProjectTypeLabel(project)} graduation project` : undefined);

  const teamMembers =
    members && members.members.length > 0
      ? members.members
      : project.members.map((member) => ({
          studentId: member.studentId,
          userId: member.userId,
          name: member.name,
          email: member.email ?? "",
          university: member.university ?? "",
          major: member.major ?? "",
          role: member.role,
        }));

  const teamSize = members?.currentMembers ?? project.currentMembers;
  const teamCapacity = members?.totalCapacity ?? project.partnersCount;

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader
        title={project.name}
        subtitle={subtitle}
        fallbackHref={DOCTOR_ROUTES.projects}
        variant="compact"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: layout.space("xxl") + layout.insets.bottom,
          gap: DOCTOR_SPACE.md,
        }}
      >
        <Pressable
          onPress={() => router.push(doctorProjectChatPath(projectId) as Href)}
          style={({ pressed }) => [styles.chatBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <MessageSquare size={16} color={colors.primary} strokeWidth={2.2} />
          <Text style={[styles.chatBtnText, { color: colors.primary }]}>Team Chat</Text>
        </Pressable>

        <View style={styles.tabBar}>
          {(
            [
              { id: "overview" as const, label: "Overview" },
              { id: "files" as const, label: "Files" },
              { id: "team" as const, label: "Team" },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={[styles.tabSegment, active && styles.tabSegmentActive]}
              >
                <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.muted }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "overview" ? (
          <View style={styles.panel}>
            <Section title="Description" styles={styles}>
              <Text style={styles.bodyText}>{description ?? "No description provided."}</Text>
            </Section>

            {technologies.length > 0 ? (
              <Section title="Technologies" styles={styles}>
                <ChipRow items={technologies} styles={styles} />
              </Section>
            ) : null}

            {skills.length > 0 ? (
              <Section title="Required skills" styles={styles}>
                <ChipRow items={skills} styles={styles} muted />
              </Section>
            ) : null}

            {preferredRoles.length > 0 ? (
              <Section title="Preferred roles" styles={styles}>
                <ChipRow items={preferredRoles} styles={styles} muted />
              </Section>
            ) : null}

            {project.ownerName ? (
              <Section title="Project owner" styles={styles}>
                <Text style={styles.boldText}>{project.ownerName}</Text>
                {project.ownerMajor ? (
                  <Text style={styles.mutedText}>{project.ownerMajor}</Text>
                ) : null}
              </Section>
            ) : null}

            {project.supervisor ? (
              <Section title="Supervisor" styles={styles}>
                <Text style={styles.boldText}>{project.supervisor.name}</Text>
                {project.supervisor.specialization ? (
                  <Text style={styles.mutedText}>{project.supervisor.specialization}</Text>
                ) : null}
                {project.supervisor.department ? (
                  <Text style={styles.mutedText}>{project.supervisor.department}</Text>
                ) : null}
              </Section>
            ) : null}

            <Section title="Project info" styles={styles}>
              <Text style={styles.mutedText}>
                Team: {teamSize}/{teamCapacity} members
              </Text>
              {project.createdAt ? (
                <Text style={styles.mutedText}>
                  Created {formatDoctorHubDate(project.createdAt)}
                </Text>
              ) : null}
              {project.updatedAt ? (
                <Text style={styles.mutedText}>
                  Updated {formatDoctorHubDate(project.updatedAt)}
                </Text>
              ) : null}
            </Section>
          </View>
        ) : null}

        {tab === "files" ? (
          <View style={styles.panel}>
            <Section title="Uploaded documents" styles={styles}>
              {abstractFile ? (
                <View style={styles.fileRow}>
                  <View style={[styles.fileIcon, { backgroundColor: colors.primarySoft }]}>
                    <FileText size={18} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.fileText}>
                    <Text style={styles.boldText} numberOfLines={1}>
                      {abstractFile.fileName}
                    </Text>
                    <Text style={styles.mutedText}>
                      Uploaded{" "}
                      {new Date(abstractFile.uploadedAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </Text>
                  </View>
                  <Pressable onPress={() => void openFile()} style={styles.downloadBtn}>
                    <Download size={14} color={colors.primary} strokeWidth={2.2} />
                    <Text style={[styles.downloadText, { color: colors.primary }]}>Open</Text>
                    <ExternalLink size={12} color={colors.primary} opacity={0.7} />
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.mutedText}>
                  No project documents uploaded yet. Students can attach an abstract file when creating
                  the project.
                </Text>
              )}
            </Section>
          </View>
        ) : null}

        {tab === "team" ? (
          <View style={styles.panel}>
            <Section
              title={`Team members (${teamSize}/${teamCapacity})`}
              styles={styles}
            >
              {teamMembers.length > 0 ? (
                <View style={styles.memberList}>
                  {teamMembers.map((member) => (
                    <View key={member.studentId} style={styles.memberRow}>
                      <FeedAvatar name={member.name} size={36} roleType="student" />
                      <View style={styles.memberText}>
                        <Text style={styles.boldText}>{member.name}</Text>
                        <Text style={styles.mutedText}>
                          {member.role} · {member.major}
                        </Text>
                        {member.email ? (
                          <Text style={styles.mutedText} numberOfLines={1}>
                            {member.email}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.mutedText}>No team members listed.</Text>
              )}
            </Section>
          </View>
        ) : null}

        <View style={styles.dangerPanel}>
          <Text style={styles.mutedText}>
            End your supervision role for this project. The team will need to request a new supervisor.
          </Text>
          <Pressable
            onPress={handleResign}
            disabled={resigning}
            style={({ pressed }) => [
              styles.resignBtn,
              { opacity: resigning || pressed ? 0.7 : 1 },
            ]}
          >
            {resigning ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text style={styles.resignText}>Resign supervision</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </DoctorScreen>
  );
}

function Section({
  title,
  children,
  styles,
}: {
  title: string;
  children: ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChipRow({
  items,
  styles,
  muted,
}: {
  items: string[];
  styles: ReturnType<typeof createStyles>;
  muted?: boolean;
}) {
  return (
    <View style={styles.chipRow}>
      {items.map((item) => (
        <View key={item} style={[styles.chip, muted && styles.chipMuted]}>
          <Text style={[styles.chipText, muted && styles.chipTextMuted]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: DOCTOR_SPACE.xl,
    },
    chatBtn: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primarySoft,
    },
    chatBtnText: {
      fontWeight: "700",
      fontSize: 14,
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: colors.inputBg,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 3,
      gap: 3,
    },
    tabSegment: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: DOCTOR_RADIUS.sm,
    },
    tabSegmentActive: {
      backgroundColor: colors.cardBg,
    },
    tabLabel: {
      fontWeight: "700",
      fontSize: 13,
    },
    panel: {
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: DOCTOR_SPACE.lg,
      gap: DOCTOR_SPACE.md,
    },
    section: {
      gap: DOCTOR_SPACE.sm,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.foreground,
      fontWeight: "500",
    },
    boldText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },
    mutedText: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: "500",
      lineHeight: 19,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
    },
    chipMuted: {
      backgroundColor: colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.foreground,
    },
    chipTextMuted: {
      color: colors.muted,
    },
    fileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
      padding: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    fileIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    fileText: {
      flex: 1,
      minWidth: 0,
    },
    downloadBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
    },
    downloadText: {
      fontSize: 12,
      fontWeight: "700",
    },
    memberList: {
      gap: DOCTOR_SPACE.sm,
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
      padding: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    memberText: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    dangerPanel: {
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(239, 68, 68, 0.25)",
      padding: DOCTOR_SPACE.lg,
      gap: DOCTOR_SPACE.md,
    },
    resignBtn: {
      minHeight: 44,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.35)",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(239, 68, 68, 0.06)",
    },
    resignText: {
      color: "#EF4444",
      fontWeight: "800",
      fontSize: 14,
    },
  });
}
