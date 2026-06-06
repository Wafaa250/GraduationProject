import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createGraduationProject,
  getGraduationProjectsMyEnvelope,
  updateGraduationProject,
} from "@/api/gradProjectApi";
import { getMe } from "@/api/meApi";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  getGraduationProjectTypeOptions,
  projectTypeToStage,
  stageToProjectType,
  type GraduationProjectTypeOption,
} from "@/lib/graduationProjectTypes";
import { STUDENT_ROUTES } from "@/lib/studentRoutes";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function parseCommaList(value: string): string[] {
  return uniqueStrings(value.split(/[,;|]/));
}

export default function CreateGraduationProjectScreen() {
  const layout = useResponsiveLayout();
  const { editProjectId } = useLocalSearchParams<{ editProjectId?: string }>();
  const editingProjectId = editProjectId ? Number(editProjectId) : null;
  const isEditMode = editingProjectId != null && Number.isFinite(editingProjectId) && editingProjectId > 0;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingProject, setHasExistingProject] = useState(false);
  const [stageOptions, setStageOptions] = useState<GraduationProjectTypeOption[]>([]);
  const [stage, setStage] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [technologiesText, setTechnologiesText] = useState("");
  const [requiredRolesText, setRequiredRolesText] = useState("");
  const [preferredRolesText, setPreferredRolesText] = useState("");
  const [teamSize, setTeamSize] = useState("3");
  const [lookingForTeammates, setLookingForTeammates] = useState(true);

  const loadForm = useCallback(async () => {
    setLoading(true);
    try {
      const [me, envelope] = await Promise.all([getMe(), getGraduationProjectsMyEnvelope()]);
      const options = getGraduationProjectTypeOptions(me.faculty, me.major);
      setStageOptions(options);
      setHasExistingProject(Boolean(envelope.project));

      if (isEditMode && envelope.project?.id === editingProjectId) {
        const project = envelope.project;
        setStage(projectTypeToStage(project.projectType));
        setTitle(project.name);
        setSummary((project.abstract ?? project.description ?? "").trim());
        setSkillsText((project.requiredSkills ?? []).join(", "));
        setTechnologiesText((project.technologies ?? []).join(", "));
        setRequiredRolesText((project.requiredRoles ?? []).join(", "));
        setPreferredRolesText((project.preferredRoles ?? []).join(", "));
        setTeamSize(String(Math.min(5, Math.max(1, project.partnersCount + 1))));
        setLookingForTeammates(project.lookingForTeammates !== false);
      } else if (!stage && options[0]) {
        setStage(options[0].stageId);
      }
    } catch (err) {
      Alert.alert("Could not load form", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [editingProjectId, isEditMode, stage]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const canSubmit = useMemo(() => {
    if (!isEditMode && hasExistingProject) return false;
    return (
      stage.trim().length > 0 &&
      title.trim().length > 0 &&
      (summary.trim().length > 5 || skillsText.trim().length > 0)
    );
  }, [hasExistingProject, isEditMode, skillsText, stage, summary, title]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        name: title.trim(),
        abstract: summary.trim() || null,
        projectType: stageToProjectType(stage),
        requiredSkills: uniqueStrings([
          ...parseCommaList(skillsText),
          ...parseCommaList(technologiesText),
        ]),
        preferredRoles: parseCommaList(preferredRolesText),
        requiredRoles: parseCommaList(requiredRolesText),
        skillPriorities: [],
        lookingForTeammates,
        partnersCount: Math.min(10, Math.max(0, Number(teamSize) - 1)),
      };

      if (isEditMode && editingProjectId != null) {
        await updateGraduationProject(editingProjectId, payload);
        Alert.alert("Project updated", "Your graduation project changes were saved.");
        router.replace(STUDENT_ROUTES.graduationProjectWorkspace as never);
      } else {
        await createGraduationProject(payload);
        Alert.alert("Graduation project created!", "Your project is live on SkillSwap.");
        router.replace(STUDENT_ROUTES.dashboard as never);
      }
    } catch (err) {
      Alert.alert(
        isEditMode ? "Could not update project" : "Could not create project",
        parseApiErrorMessage(err),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={HUB_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: layout.space("md"),
          paddingBottom: layout.space("xl"),
          gap: layout.space("md"),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={styles.backBtn}
          onPress={() =>
            router.replace(
              (isEditMode ? STUDENT_ROUTES.graduationProjectWorkspace : STUDENT_ROUTES.dashboard) as never,
            )
          }
        >
          <Ionicons name="arrow-back" size={16} color={HUB_COLORS.muted} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={[styles.heading, { fontSize: layout.fontSize.title }]}>
          {isEditMode ? "Edit Graduation Project" : "Create Graduation Project"}
        </Text>

        {hasExistingProject && !isEditMode ? (
          <Text style={styles.warning}>
            You already have a graduation project affiliation. Creating another project is not available until you
            leave your current project.
          </Text>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Project stage</Text>
          <View style={styles.stageWrap}>
            {stageOptions.map((option) => (
              <Pressable
                key={option.stageId}
                style={[styles.stageChip, stage === option.stageId && styles.stageChipActive]}
                onPress={() => setStage(option.stageId)}
              >
                <Text style={[styles.stageChipText, stage === option.stageId && styles.stageChipTextActive]}>
                  {option.shortLabel}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Project title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter project title"
            placeholderTextColor={HUB_COLORS.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Summary / abstract</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={summary}
            onChangeText={setSummary}
            placeholder="Describe your project idea"
            placeholderTextColor={HUB_COLORS.muted}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Required skills (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={skillsText}
            onChangeText={setSkillsText}
            placeholder="e.g. React, Python, UI Design"
            placeholderTextColor={HUB_COLORS.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Technologies (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={technologiesText}
            onChangeText={setTechnologiesText}
            placeholder="e.g. Firebase, PostgreSQL"
            placeholderTextColor={HUB_COLORS.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Required roles (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={requiredRolesText}
            onChangeText={setRequiredRolesText}
            placeholder="e.g. Backend Developer, Designer"
            placeholderTextColor={HUB_COLORS.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Preferred roles (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={preferredRolesText}
            onChangeText={setPreferredRolesText}
            placeholder="Optional preferred roles"
            placeholderTextColor={HUB_COLORS.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Team size (including you)</Text>
          <TextInput
            style={styles.input}
            value={teamSize}
            onChangeText={setTeamSize}
            keyboardType="number-pad"
            placeholder="3"
            placeholderTextColor={HUB_COLORS.muted}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Looking for teammates</Text>
          <Switch
            value={lookingForTeammates}
            onValueChange={setLookingForTeammates}
            trackColor={{ true: HUB_COLORS.primary, false: HUB_COLORS.border }}
          />
        </View>

        <Pressable
          style={[styles.submitBtn, { borderRadius: layout.radius.button }, !canSubmit && styles.submitBtnDisabled]}
          disabled={!canSubmit || submitting}
          onPress={() => void handleSubmit()}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>{isEditMode ? "Save changes" : "Create project"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: HUB_COLORS.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  heading: {
    fontWeight: "800",
    color: HUB_COLORS.foreground,
  },
  warning: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    padding: 12,
    borderRadius: 12,
  },
  field: {
    gap: 8,
  },
  label: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: HUB_COLORS.foreground,
    fontSize: 15,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  stageWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stageChip: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stageChipActive: {
    backgroundColor: HUB_COLORS.primarySoft,
    borderColor: HUB_COLORS.primaryBorder,
  },
  stageChipText: {
    color: HUB_COLORS.muted,
    fontWeight: "600",
    fontSize: 13,
  },
  stageChipTextActive: {
    color: HUB_COLORS.primary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  submitBtn: {
    backgroundColor: HUB_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 48,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
