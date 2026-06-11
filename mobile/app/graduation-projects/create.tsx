import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import {
  fetchProjectMatchingPreview,
  hasSufficientProjectPreviewInput,
  type ProjectPreviewResponse,
} from "@/api/aiApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createGraduationProject,
  getGraduationProjectsMyEnvelope,
  partnersCountToTeamSize,
  teamSizeToPartnersCount,
  updateGraduationProject,
} from "@/api/gradProjectApi";
import { getMe } from "@/api/meApi";
import {
  buildAbstractFieldForSave,
  isAbstractFileAllowed,
  type AbstractFilePick,
} from "@/lib/graduationProjectAbstractDocument";
import {
  PRIORITY_SUGGESTIONS,
  PROJECT_INTERESTS,
} from "@/lib/graduationProjectCreateConstants";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  getGraduationProjectTypeOptions,
  projectTypeToStage,
  stageToProjectType,
  type GraduationProjectTypeOption,
} from "@/lib/graduationProjectTypes";
import { MobileNavHeader } from "@/components/navigation/MobileNavHeader";
import { STUDENT_ROUTES } from "@/lib/studentRoutes";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function parseCommaList(value: string): string[] {
  return uniqueStrings(value.split(/[,;|]/));
}

export default function CreateGraduationProjectScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const [teamSize, setTeamSize] = useState("4");
  const [lookingForTeammates, setLookingForTeammates] = useState(true);
  const [skillPriorities, setSkillPriorities] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [abstractFile, setAbstractFile] = useState<AbstractFilePick | null>(null);
  const [abstractFileName, setAbstractFileName] = useState("");
  const [preview, setPreview] = useState<ProjectPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const submitInFlightRef = useRef(false);

  const skills = useMemo(() => parseCommaList(skillsText), [skillsText]);
  const technologies = useMemo(() => parseCommaList(technologiesText), [technologiesText]);
  const interestLabels = useMemo(
    () =>
      interests
        .map((id) => PROJECT_INTERESTS.find((x) => x.id === id)?.label ?? "")
        .filter((label) => label.length > 0),
    [interests],
  );

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
        setSkillPriorities(project.skillPriorities ?? []);
        setTeamSize(String(partnersCountToTeamSize(project.partnersCount)));
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

  useFocusEffect(
    useCallback(() => {
      void loadForm();
    }, [loadForm]),
  );

  const openProjectWorkspace = useCallback(async (alertTitle: string, alertMessage: string) => {
    const envelope = await getGraduationProjectsMyEnvelope();
    if (!envelope.project) return false;

    setHasExistingProject(true);
    router.replace(STUDENT_ROUTES.graduationProjectWorkspace as never);
    Alert.alert(alertTitle, alertMessage);
    return true;
  }, []);

  const isAlreadyOwnProjectError = (err: unknown) => {
    if (!axios.isAxiosError(err) || err.response?.status !== 409) return false;
    const message = parseApiErrorMessage(err).toLowerCase();
    return message.includes("already own");
  };

  const abstractComplete = summary.trim().length > 5 || abstractFileName.trim().length > 0;

  const canSubmit = useMemo(() => {
    if (!isEditMode && hasExistingProject) return false;
    return (
      stage.trim().length > 0 &&
      title.trim().length > 2 &&
      abstractComplete &&
      skills.length > 0 &&
      technologies.length > 0 &&
      parseCommaList(requiredRolesText).length > 0 &&
      (isEditMode || interests.length > 0)
    );
  }, [
    abstractComplete,
    hasExistingProject,
    interests.length,
    isEditMode,
    requiredRolesText,
    skills.length,
    stage,
    technologies.length,
    title,
  ]);

  const previewInputReady = useMemo(
    () => hasSufficientProjectPreviewInput({ title, skills, technologies }),
    [skills, technologies, title],
  );

  useEffect(() => {
    if (!previewInputReady) {
      setPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    void (async () => {
      try {
        const result = await fetchProjectMatchingPreview({
          projectType: stage ? stageToProjectType(stage) : "GP",
          title: title.trim(),
          abstract: summary.trim() || null,
          requiredSkills: skills,
          technologies,
          preferredRoles: parseCommaList(preferredRolesText),
          requiredRoles: parseCommaList(requiredRolesText),
          skillPriorities: uniqueStrings(skillPriorities),
          interests: interestLabels,
          teamSize: Number(teamSize) || 4,
        });
        if (!cancelled) setPreview(result);
      } catch (err) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(parseApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    interestLabels,
    preferredRolesText,
    previewInputReady,
    requiredRolesText,
    skillPriorities,
    skills,
    stage,
    summary,
    teamSize,
    technologies,
    title,
  ]);

  const toggleChip = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const pickAbstractFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const name = asset.name ?? "abstract";
    if (!isAbstractFileAllowed(name)) {
      Alert.alert("Unsupported file type", "Please upload a PDF or DOCX file only.");
      return;
    }
    setAbstractFile({
      uri: asset.uri,
      name,
      mimeType: asset.mimeType,
      size: asset.size,
    });
    setAbstractFileName(name);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting || submitInFlightRef.current) return;

    submitInFlightRef.current = true;
    setSubmitting(true);
    try {
      const abstract = await buildAbstractFieldForSave(summary, abstractFile, (uri) =>
        FileSystem.readAsStringAsync(uri, { encoding: "base64" }),
      );
      const payload = {
        name: title.trim(),
        abstract,
        projectType: stageToProjectType(stage),
        requiredSkills: uniqueStrings([...skills, ...technologies]),
        preferredRoles: parseCommaList(preferredRolesText),
        requiredRoles: parseCommaList(requiredRolesText),
        skillPriorities: uniqueStrings(skillPriorities),
        lookingForTeammates,
        partnersCount: teamSizeToPartnersCount(Number(teamSize) || 1),
      };

      if (isEditMode && editingProjectId != null) {
        await updateGraduationProject(editingProjectId, payload);
        await openProjectWorkspace("Project updated", "Your graduation project changes were saved.");
        return;
      }

      await createGraduationProject(payload);
      Alert.alert("Graduation project created!", "Your project is live on SkillSwap.");
      router.replace(STUDENT_ROUTES.dashboard as never);
    } catch (err) {
      if (!isEditMode && isAlreadyOwnProjectError(err)) {
        const opened = await openProjectWorkspace(
          "Project already exists",
          "You already have a graduation project. Opening your workspace.",
        );
        if (opened) return;
      }

      Alert.alert(
        isEditMode ? "Could not update project" : "Could not create project",
        parseApiErrorMessage(err),
      );
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <MobileNavHeader
        title={isEditMode ? "Edit project" : "Create project"}
        fallbackHref={
          isEditMode ? STUDENT_ROUTES.graduationProjectWorkspace : STUDENT_ROUTES.dashboard
        }
        backColor={colors.foreground}
        titleColor={colors.foreground}
        backgroundColor={colors.background}
        borderColor={colors.border}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: layout.space("md"),
          paddingBottom: layout.space("xl"),
          gap: layout.space("md"),
        }}
        keyboardShouldPersistTaps="handled"
      >
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
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Summary / abstract</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={summary}
            onChangeText={setSummary}
            placeholder="Describe your project idea"
            placeholderTextColor={colors.muted}
            multiline
          />
          <Text style={styles.hint}>
            {summary.length > 0
              ? `${summary.length} characters`
              : "Write your abstract here, or upload a file below (at least one is required)."}
          </Text>
          <View style={styles.uploadBox}>
            <Text style={styles.hint}>Optional: upload a PDF or DOCX abstract document.</Text>
            <Pressable style={styles.uploadBtn} onPress={() => void pickAbstractFile()}>
              <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
              <Text style={styles.uploadBtnText}>Choose file</Text>
            </Pressable>
            {abstractFileName ? (
              <View style={styles.fileRow}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {abstractFileName}
                </Text>
                <Pressable
                  onPress={() => {
                    setAbstractFile(null);
                    setAbstractFileName("");
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Required skills (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={skillsText}
            onChangeText={setSkillsText}
            placeholder="e.g. React, Python, UI Design"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Technologies (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={technologiesText}
            onChangeText={setTechnologiesText}
            placeholder="e.g. Firebase, PostgreSQL"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Required roles (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={requiredRolesText}
            onChangeText={setRequiredRolesText}
            placeholder="e.g. Backend Developer, Designer"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Preferred roles (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={preferredRolesText}
            onChangeText={setPreferredRolesText}
            placeholder="Optional preferred roles"
            placeholderTextColor={colors.muted}
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
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Looking for teammates</Text>
          <Switch
            value={lookingForTeammates}
            onValueChange={setLookingForTeammates}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Skill priorities</Text>
          <View style={styles.chipWrap}>
            {PRIORITY_SUGGESTIONS.map((item) => {
              const selected = skillPriorities.includes(item);
              return (
                <Pressable
                  key={item}
                  style={[styles.chip, selected && styles.chipActive]}
                  onPress={() => toggleChip(skillPriorities, item, setSkillPriorities)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!isEditMode ? (
          <View style={styles.field}>
            <Text style={styles.label}>Project interests & domains</Text>
            <View style={styles.chipWrap}>
              {PROJECT_INTERESTS.map((item) => {
                const selected = interests.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => toggleChip(interests, item.id, setInterests)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.previewCard}>
          <Text style={styles.label}>AI matching preview</Text>
          {previewLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : previewError ? (
            <Text style={styles.hint}>{previewError}</Text>
          ) : preview?.isAvailable ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.previewMetric}>
                Match confidence: {preview.compatibilityScore}%
              </Text>
              <Text style={styles.previewMetric}>
                Potential matches: {preview.estimatedCompatibleStudentsCount}
              </Text>
              <Text style={styles.previewMetric}>
                Domain overlap: {preview.domainOverlapLabel ?? "—"}
              </Text>
              <Text style={styles.previewMetric}>
                Role coverage: {preview.roleCoverageLabel ?? "—"}
              </Text>
              {preview.topRecommendedStudents.slice(0, 3).map((student) => (
                <Text key={student.studentId} style={styles.hint}>
                  {student.name} · {student.matchScore}% · {student.major}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.hint}>
              {previewInputReady
                ? preview?.message?.trim() || "No preview available yet."
                : "Add a title and skills or technologies to see AI matching preview."}
            </Text>
          )}
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

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  heading: {
    fontWeight: "800",
    color: colors.foreground,
  },
  warning: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 12,
  },
  field: {
    gap: 8,
  },
  label: {
    fontWeight: "700",
    color: colors.foreground,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.foreground,
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
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stageChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  stageChipText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 13,
  },
  stageChipTextActive: {
    color: colors.primary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  submitBtn: {
    backgroundColor: colors.primary,
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
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: colors.cardBg,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  uploadBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  fileName: {
    flex: 1,
    fontWeight: "600",
    color: colors.foreground,
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.cardBg,
  },
  chipActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.primary,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    backgroundColor: colors.cardBg,
  },
  previewMetric: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
  },
});
