import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  GraduationCap,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  deleteCourseProject,
  generateCourseProjectTeams,
  previewCourseProjectTeams,
  updateCourseProject,
  type CourseProjectTeamsResponse,
  type CourseTeam,
} from "@/api/doctorCoursesApi";
import { CourseProjectFormSheet } from "@/components/doctor/courses/CourseProjectFormSheet";
import { CourseProjectHero } from "@/components/doctor/courses/CourseProjectHero";
import { CourseWorkspaceEmptyState } from "@/components/doctor/courses/CourseWorkspaceEmptyState";
import { ProjectStudentRow } from "@/components/doctor/courses/ProjectStudentRow";
import { ProjectTeamsPanel } from "@/components/doctor/courses/ProjectTeamsPanel";
import { TeamDetailSheet } from "@/components/doctor/courses/TeamDetailSheet";
import { DOCTOR_RADIUS, DOCTOR_SPACE, doctorInsetCardStyle } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useCourseProjectWorkspace } from "@/hooks/useCourseProjectWorkspace";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  AI_BALANCE_OPTIONS,
  buildDescriptionWithFormation,
  parseAiFormationFromDescription,
  type AiFormationConfig,
} from "@/lib/courseProjectAiConfig";
import { getProjectStudentTeamStatus } from "@/lib/courseProjectStudentStatus";
import { formatAiMode, formatProjectSections } from "@/lib/courseWorkspaceUtils";
import { doctorSectionPath, DOCTOR_ROUTES } from "@/lib/doctorRoutes";

type ProjectTab = "overview" | "teams" | "students" | "ai";

const TABS: { id: ProjectTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "teams", label: "Teams" },
  { id: "students", label: "Students" },
  { id: "ai", label: "AI Formation" },
];

export default function DoctorCourseProjectDetailScreen() {
  const router = useRouter();
  const { courseId: courseIdParam, sectionId: sectionIdParam, projectId: projectIdParam } =
    useLocalSearchParams<{ courseId: string; sectionId: string; projectId: string }>();
  const courseId = Number(courseIdParam);
  const sectionId = Number(sectionIdParam);
  const projectId = Number(projectIdParam);

  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { workspace, bundle, pageLoading, bundleLoading, error, projectMissing, reload } =
    useCourseProjectWorkspace(courseId, sectionId, projectId);

  const [tab, setTab] = useState<ProjectTab>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewTeam, setViewTeam] = useState<CourseTeam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewTeams, setPreviewTeams] = useState<CourseProjectTeamsResponse | null>(null);

  const handlePreviewReady = useCallback((result: CourseProjectTeamsResponse) => {
    setPreviewTeams(result);
    setTab("teams");
  }, []);

  const handleClearPreview = useCallback(() => {
    setPreviewTeams(null);
  }, []);

  const handleNavigateToTeams = useCallback(() => {
    setTab("teams");
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Number.isFinite(courseId) && Number.isFinite(projectId)) {
        void reload();
      }
    }, [courseId, projectId, reload]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handleDelete = () => {
    if (!bundle) return;
    Alert.alert("Delete project?", `Delete "${bundle.project.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setDeleting(true);
            try {
              await deleteCourseProject(bundle.project.id);
              router.replace(doctorSectionPath(courseId, sectionId) as never);
            } catch (err) {
              Alert.alert("Could not delete project", parseApiErrorMessage(err));
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  if (!Number.isFinite(courseId) || !Number.isFinite(sectionId) || !Number.isFinite(projectId)) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Invalid project" fallbackHref={DOCTOR_ROUTES.courses} />
        <View style={styles.center}>
          <Text style={styles.mutedText}>This project link is not valid.</Text>
        </View>
      </DoctorScreen>
    );
  }

  if (pageLoading && !bundle) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Project" fallbackHref={doctorSectionPath(courseId, sectionId)} variant="compact" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </DoctorScreen>
    );
  }

  if (projectMissing) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Not found" fallbackHref={doctorSectionPath(courseId, sectionId)} variant="compact" />
        <View style={styles.center}>
          <Text style={styles.mutedText}>Project not found in this section.</Text>
        </View>
      </DoctorScreen>
    );
  }

  if (error && !bundle) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="Project" fallbackHref={doctorSectionPath(courseId, sectionId)} variant="compact" />
        <View style={styles.center}>
          <Text style={styles.mutedText}>{error}</Text>
        </View>
      </DoctorScreen>
    );
  }

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader
        title={workspace.projectTitle || "Project"}
        subtitle={workspace.courseName}
        fallbackHref={doctorSectionPath(courseId, sectionId)}
        variant="compact"
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: DOCTOR_SPACE.xxxl,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={colors.primary} />
        }
      >
        <CourseProjectHero workspace={workspace} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
          style={styles.tabScroll}
        >
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            return (
              <Pressable key={id} onPress={() => setTab(id)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive, { fontSize: layout.scale(12) }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {bundleLoading && !bundle ? (
          <View style={styles.centerInline}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : tab === "overview" && bundle ? (
          <OverviewPanel
            bundle={bundle}
            workspace={workspace}
            onEdit={() => setEditOpen(true)}
            onDelete={handleDelete}
            deleting={deleting}
            styles={styles}
            layout={layout}
            colors={colors}
          />
        ) : tab === "teams" ? (
          <ProjectTeamsPanel
            workspace={workspace}
            bundle={bundle}
            previewTeams={previewTeams}
            onViewTeam={setViewTeam}
            colors={colors}
            layout={layout}
          />
        ) : tab === "students" ? (
          <StudentsPanel workspace={workspace} bundle={bundle} styles={styles} layout={layout} />
        ) : (
          <AiFormationPanel
            workspace={workspace}
            bundle={bundle}
            onReload={reload}
            onPreviewReady={handlePreviewReady}
            onClearPreview={handleClearPreview}
            onNavigateToTeams={handleNavigateToTeams}
            styles={styles}
            layout={layout}
            colors={colors}
          />
        )}
      </ScrollView>

      {bundle ? (
        <CourseProjectFormSheet
          visible={editOpen}
          courseId={courseId}
          sections={bundle.allSections}
          project={{ ...bundle.project, teamCount: bundle.teams?.teamCount ?? workspace.teamCount }}
          defaultSectionId={sectionId}
          onClose={() => setEditOpen(false)}
          onSaved={(msg) => {
            Alert.alert("Saved", msg ?? "Project updated");
            void reload();
          }}
        />
      ) : null}

      <TeamDetailSheet
        visible={viewTeam != null}
        team={viewTeam}
        projectTitle={workspace.projectTitle}
        onClose={() => setViewTeam(null)}
      />
    </DoctorScreen>
  );
}

function OverviewPanel({
  bundle,
  workspace,
  onEdit,
  onDelete,
  deleting,
  styles,
  layout,
  colors,
}: {
  bundle: NonNullable<ReturnType<typeof useCourseProjectWorkspace>["bundle"]>;
  workspace: ReturnType<typeof useCourseProjectWorkspace>["workspace"];
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  styles: ReturnType<typeof createStyles>;
  layout: ReturnType<typeof useResponsiveLayout>;
  colors: HubColorScheme;
}) {
  const { publicDescription } = parseAiFormationFromDescription(bundle.project.description);
  const projectWithTeams = {
    ...bundle.project,
    teamCount: bundle.teams?.teamCount ?? workspace.teamCount,
  };

  return (
    <View>
      <View style={styles.metaCard}>
        <MetaCell label="Sections" value={formatProjectSections(projectWithTeams)} styles={styles} layout={layout} />
        <MetaCell label="Formation" value={formatAiMode(bundle.project.aiMode)} styles={styles} layout={layout} />
        <MetaCell label="Team size" value={String(bundle.project.teamSize)} styles={styles} layout={layout} />
        <MetaCell label="Teams" value={String(bundle.teams?.teamCount ?? 0)} styles={styles} layout={layout} />
        <MetaCell
          label="Cross-section"
          value={bundle.project.allowCrossSectionTeams ? "Allowed" : "Same section only"}
          styles={styles}
          layout={layout}
        />
        <MetaCell label="Eligible students" value={String(bundle.eligibleStudents.length)} styles={styles} layout={layout} />
      </View>

      {publicDescription ? (
        <View style={styles.descriptionCard}>
          <Text style={[styles.sectionLabel, { fontSize: layout.scale(10) }]}>Description</Text>
          <Text style={[styles.descriptionText, { fontSize: layout.scale(13) }]}>{publicDescription}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable onPress={onEdit} style={({ pressed }) => [styles.outlineAction, { opacity: pressed ? 0.85 : 1 }]}>
          <Pencil size={16} color={colors.foreground} strokeWidth={2} />
          <Text style={[styles.outlineActionText, { fontSize: layout.scale(13) }]}>Edit project</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          style={({ pressed }) => [styles.deleteAction, { opacity: pressed || deleting ? 0.85 : 1 }]}
        >
          <Trash2 size={16} color="#fff" strokeWidth={2} />
          <Text style={[styles.deleteActionText, { fontSize: layout.scale(13) }]}>Delete project</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StudentsPanel({
  workspace,
  bundle,
  styles,
  layout,
}: {
  workspace: ReturnType<typeof useCourseProjectWorkspace>["workspace"];
  bundle: ReturnType<typeof useCourseProjectWorkspace>["bundle"];
  styles: ReturnType<typeof createStyles>;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  const students = bundle?.eligibleStudents ?? [];
  const teams = bundle?.teams?.teams ?? [];

  const assignmentByStudent = new Map<number, { teamLabel: string }>();
  for (const team of teams) {
    for (const member of team.members) {
      assignmentByStudent.set(member.studentId, { teamLabel: `Team ${team.teamIndex + 1}` });
    }
  }

  const teamSize = bundle?.teams?.teamSize ?? workspace.teamSize;
  const hasOpenTeamSlot = teams.some((t) => t.memberCount < teamSize);

  if (students.length === 0) {
    return (
      <CourseWorkspaceEmptyState
        icon={GraduationCap}
        title="No eligible students"
        description="Enroll students in this project's sections to include them in team formation."
      />
    );
  }

  return (
    <View>
      <Text style={[styles.panelMeta, { fontSize: layout.scale(12) }]}>
        Students in sections assigned to{" "}
        <Text style={styles.panelMetaStrong}>{workspace.projectTitle}</Text>
      </Text>
      <View style={styles.studentList}>
        {students.map((student) => {
          const assignment = assignmentByStudent.get(student.studentId);
          const status = getProjectStudentTeamStatus({
            isOnProjectTeam: Boolean(assignment),
            aiMode: workspace.aiMode,
            teamCount: workspace.teamCount,
            hasOpenTeamSlot,
          });
          return (
            <ProjectStudentRow
              key={student.studentId}
              student={student}
              status={status}
              teamLabel={assignment?.teamLabel}
            />
          );
        })}
      </View>
    </View>
  );
}

function AiFormationPanel({
  workspace,
  bundle,
  onReload,
  onPreviewReady,
  onClearPreview,
  onNavigateToTeams,
  styles,
  layout,
  colors,
}: {
  workspace: ReturnType<typeof useCourseProjectWorkspace>["workspace"];
  bundle: ReturnType<typeof useCourseProjectWorkspace>["bundle"];
  onReload: () => Promise<void>;
  onPreviewReady: (result: CourseProjectTeamsResponse) => void;
  onClearPreview: () => void;
  onNavigateToTeams: () => void;
  styles: ReturnType<typeof createStyles>;
  layout: ReturnType<typeof useResponsiveLayout>;
  colors: HubColorScheme;
}) {
  const [config, setConfig] = useState<AiFormationConfig>({
    teamSize: 4,
    allowCrossSectionTeams: false,
    requiredSkills: "",
    balancePreference: AI_BALANCE_OPTIONS[0].value,
    aiMatchingNotes: "",
  });
  const [configSaved, setConfigSaved] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!bundle?.project) return;
    const { config: parsed } = parseAiFormationFromDescription(bundle.project.description);
    setConfig({
      teamSize: bundle.project.teamSize,
      allowCrossSectionTeams: bundle.project.allowCrossSectionTeams,
      requiredSkills: parsed.requiredSkills ?? "",
      balancePreference: parsed.balancePreference ?? AI_BALANCE_OPTIONS[0].value,
      aiMatchingNotes: parsed.aiMatchingNotes ?? "",
    });
    setConfigSaved(true);
    onClearPreview();
  }, [bundle?.project, onClearPreview]);

  if (!bundle) {
    return (
      <View style={styles.centerInline}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (bundle.project.aiMode !== "doctor") {
    return (
      <CourseWorkspaceEmptyState
        icon={Sparkles}
        title="Student-led team formation"
        description="This project uses student-led teams. Doctors configure teams in the AI tab only for doctor-generated projects."
      />
    );
  }

  const hasSavedTeams = (bundle.teams?.teamCount ?? 0) > 0;
  const markDirty = () => setConfigSaved(false);

  const saveConfiguration = async () => {
    setSavingConfig(true);
    try {
      const { publicDescription } = parseAiFormationFromDescription(bundle.project.description);
      const description = buildDescriptionWithFormation(publicDescription, config);

      await updateCourseProject(bundle.project.id, {
        title: bundle.project.title,
        description,
        teamSize: config.teamSize,
        applyToAllSections: bundle.project.applyToAllSections,
        allowCrossSectionTeams: config.allowCrossSectionTeams,
        aiMode: "doctor",
        sectionIds: bundle.project.sections.map((s) => s.sectionId),
      });

      setConfigSaved(true);
      Alert.alert("Saved", "Formation settings saved");
      await onReload();
    } catch (err) {
      Alert.alert("Could not save settings", parseApiErrorMessage(err));
    } finally {
      setSavingConfig(false);
    }
  };

  const handlePreview = async () => {
    if (!configSaved) {
      Alert.alert("Save configuration first", "Update formation settings before previewing teams.");
      return;
    }
    setPreviewing(true);
    try {
      const result = await previewCourseProjectTeams(workspace.courseId, workspace.projectId);
      onPreviewReady(result);
      Alert.alert("Preview ready", `${result.teamCount} proposed teams.`);
    } catch (err) {
      Alert.alert("Could not preview teams", parseApiErrorMessage(err));
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async (regenerate: boolean) => {
    if (!configSaved) {
      Alert.alert("Save configuration first", "Update formation settings before generating teams.");
      return;
    }
    if (regenerate && hasSavedTeams) {
      Alert.alert("Regenerate teams?", "Replace existing teams for this project?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: () => void runGenerate(true),
        },
      ]);
      return;
    }
    await runGenerate(regenerate);
  };

  const runGenerate = async (regenerate: boolean) => {
    setGenerating(true);
    try {
      const result = await generateCourseProjectTeams(workspace.courseId, workspace.projectId);
      onClearPreview();
      Alert.alert(regenerate ? "Teams regenerated" : "Teams generated", `${result.teamCount} teams saved.`);
      await onReload();
      onNavigateToTeams();
    } catch (err) {
      Alert.alert(regenerate ? "Could not regenerate teams" : "Could not generate teams", parseApiErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.aiPanel}>
      <View style={styles.configCard}>
        <Text style={[styles.configTitle, { fontSize: layout.scale(14) }]}>Formation configuration</Text>
        <Text style={[styles.configHint, { fontSize: layout.scale(11) }]}>
          Save settings before previewing or generating teams. AI uses the project description and formation notes.
        </Text>

        <Text style={[styles.fieldLabel, { fontSize: layout.scale(12) }]}>Team size</Text>
        <TextInput
          value={String(config.teamSize)}
          onChangeText={(v) => {
            markDirty();
            setConfig((c) => ({ ...c, teamSize: Math.min(50, Math.max(1, Number(v) || 1)) }));
          }}
          keyboardType="number-pad"
          style={[styles.aiInput, { fontSize: layout.scale(14) }]}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { fontSize: layout.scale(13) }]}>Allow cross-section teams</Text>
          <Switch
            value={config.allowCrossSectionTeams}
            onValueChange={(v) => {
              markDirty();
              setConfig((c) => ({ ...c, allowCrossSectionTeams: v }));
            }}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={config.allowCrossSectionTeams ? colors.primary : "#f4f4f5"}
          />
        </View>

        <Text style={[styles.fieldLabel, { fontSize: layout.scale(12) }]}>Required skills</Text>
        <TextInput
          value={config.requiredSkills}
          onChangeText={(v) => {
            markDirty();
            setConfig((c) => ({ ...c, requiredSkills: v }));
          }}
          placeholder="e.g. Python, SQL, React (comma-separated)"
          placeholderTextColor={colors.muted}
          style={[styles.aiInput, { fontSize: layout.scale(14) }]}
        />

        <Text style={[styles.fieldLabel, { fontSize: layout.scale(12) }]}>Team balance preference</Text>
        <View style={styles.balanceRow}>
          {AI_BALANCE_OPTIONS.map((opt) => {
            const active = config.balancePreference === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  markDirty();
                  setConfig((c) => ({ ...c, balancePreference: opt.value }));
                }}
                style={[styles.balanceChip, active && styles.balanceChipActive]}
              >
                <Text
                  style={[
                    styles.balanceChipText,
                    { fontSize: layout.scale(11) },
                    active && styles.balanceChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { fontSize: layout.scale(12) }]}>AI matching notes</Text>
        <TextInput
          value={config.aiMatchingNotes}
          onChangeText={(v) => {
            markDirty();
            setConfig((c) => ({ ...c, aiMatchingNotes: v }));
          }}
          placeholder="Optional guidance for how teams should be formed"
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
          style={[styles.aiTextArea, { fontSize: layout.scale(14) }]}
        />

        <Pressable
          onPress={() => void saveConfiguration()}
          disabled={savingConfig}
          style={({ pressed }) => [styles.primaryAction, { opacity: pressed || savingConfig ? 0.9 : 1 }]}
        >
          {savingConfig ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.primaryActionText, { fontSize: layout.scale(13) }]}>Save configuration</Text>
          )}
        </Pressable>

        {!configSaved ? (
          <Text style={[styles.unsavedHint, { fontSize: layout.scale(11) }]}>
            Unsaved changes — save before preview or generate.
          </Text>
        ) : null}
      </View>

      <View style={styles.aiActions}>
        <Pressable
          onPress={() => void handlePreview()}
          disabled={previewing || generating}
          style={({ pressed }) => [styles.outlineAction, { flex: 1, opacity: pressed ? 0.85 : 1 }]}
        >
          {previewing ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={[styles.outlineActionText, { fontSize: layout.scale(13) }]}>Preview teams</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => void handleGenerate(hasSavedTeams)}
          disabled={generating || previewing}
          style={({ pressed }) => [
            styles.primaryAction,
            { flex: 1, opacity: pressed || generating ? 0.9 : 1 },
          ]}
        >
          {generating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.primaryActionText, { fontSize: layout.scale(13) }]}>
              {hasSavedTeams ? "Regenerate teams" : "Generate teams"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function MetaCell({
  label,
  value,
  styles,
  layout,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  return (
    <View style={styles.metaCell}>
      <Text style={[styles.metaLabel, { fontSize: layout.scale(10) }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.metaValue, { fontSize: layout.scale(13) }]} numberOfLines={2}>
        {value}
      </Text>
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
    centerInline: {
      paddingVertical: DOCTOR_SPACE.xxxl,
      alignItems: "center",
    },
    mutedText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.muted,
      textAlign: "center",
    },
    tabScroll: {
      marginBottom: DOCTOR_SPACE.md,
    },
    tabBar: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      paddingBottom: DOCTOR_SPACE.xs,
    },
    tab: {
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.pill,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    tabActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    tabText: {
      fontWeight: "700",
      color: colors.muted,
    },
    tabTextActive: {
      color: colors.primary,
    },
    metaCard: {
      ...doctorInsetCardStyle(colors),
      flexDirection: "row",
      flexWrap: "wrap",
      padding: DOCTOR_SPACE.md,
      gap: DOCTOR_SPACE.md,
      marginBottom: DOCTOR_SPACE.md,
    },
    metaCell: {
      width: "47%",
    },
    metaLabel: {
      fontWeight: "700",
      letterSpacing: 0.4,
      color: colors.muted,
    },
    metaValue: {
      marginTop: 4,
      fontWeight: "700",
      color: colors.foreground,
    },
    descriptionCard: {
      ...doctorInsetCardStyle(colors),
      padding: DOCTOR_SPACE.md,
      marginBottom: DOCTOR_SPACE.md,
    },
    sectionLabel: {
      fontWeight: "700",
      letterSpacing: 0.4,
      color: colors.muted,
    },
    descriptionText: {
      marginTop: DOCTOR_SPACE.sm,
      fontWeight: "500",
      color: colors.foreground,
      lineHeight: 20,
    },
    actionRow: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
    },
    outlineAction: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    outlineActionText: {
      fontWeight: "700",
      color: colors.foreground,
    },
    deleteAction: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: "#DC2626",
    },
    deleteActionText: {
      fontWeight: "800",
      color: "#fff",
    },
    panelMeta: {
      marginBottom: DOCTOR_SPACE.md,
      fontWeight: "500",
      color: colors.muted,
    },
    panelMetaStrong: {
      fontWeight: "800",
      color: colors.foreground,
    },
    studentList: {
      ...doctorInsetCardStyle(colors),
      overflow: "hidden",
      borderRadius: DOCTOR_RADIUS.md,
    },
    aiPanel: {
      gap: DOCTOR_SPACE.md,
    },
    configCard: {
      ...doctorInsetCardStyle(colors),
      padding: DOCTOR_SPACE.md,
      gap: DOCTOR_SPACE.sm,
    },
    configTitle: {
      fontWeight: "800",
      color: colors.foreground,
    },
    configHint: {
      fontWeight: "500",
      color: colors.muted,
      lineHeight: 17,
      marginBottom: DOCTOR_SPACE.sm,
    },
    fieldLabel: {
      marginTop: DOCTOR_SPACE.sm,
      fontWeight: "700",
      color: colors.foreground,
    },
    aiInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.sm,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: 10,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    aiTextArea: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.sm,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.md,
      minHeight: 88,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: DOCTOR_SPACE.sm,
    },
    switchLabel: {
      flex: 1,
      fontWeight: "600",
      color: colors.foreground,
    },
    balanceRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DOCTOR_SPACE.sm,
    },
    balanceChip: {
      paddingHorizontal: DOCTOR_SPACE.sm,
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    balanceChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    balanceChipText: {
      fontWeight: "600",
      color: colors.muted,
    },
    balanceChipTextActive: {
      color: colors.primary,
    },
    primaryAction: {
      marginTop: DOCTOR_SPACE.md,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.primary,
    },
    primaryActionText: {
      fontWeight: "800",
      color: "#fff",
    },
    unsavedHint: {
      fontWeight: "600",
      color: "#D97706",
    },
    aiActions: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
    },
  });
}
