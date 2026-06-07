import * as DocumentPicker from "expo-document-picker";
import { FileUp, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createCourseProject,
  getDoctorCourseById,
  updateCourseProject,
  type CourseProjectWithTeams,
  type CourseSectionWorkspace,
  type CreateCourseProjectPayload,
} from "@/api/doctorCoursesApi";
import { pickWebRosterFile } from "@/api/mobileUpload";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { parseAiFormationFromDescription } from "@/lib/courseProjectAiConfig";

type Props = {
  visible: boolean;
  courseId: number;
  sections: CourseSectionWorkspace[];
  project?: CourseProjectWithTeams | null;
  defaultSectionId?: number;
  onClose: () => void;
  onSaved: (message?: string) => void;
};

type PendingDoc = {
  name: string;
};

export function CourseProjectFormSheet({
  visible,
  courseId,
  sections,
  project,
  defaultSectionId,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEdit = project != null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teamSize, setTeamSize] = useState("4");
  const [applyToAllSections, setApplyToAllSections] = useState(true);
  const [allowCrossSectionTeams, setAllowCrossSectionTeams] = useState(false);
  const [aiMode, setAiMode] = useState<"doctor" | "student">("doctor");
  const [sectionIds, setSectionIds] = useState<number[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingDoc[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      return;
    }

    if (project) {
      const { publicDescription } = parseAiFormationFromDescription(project.description);
      setTitle(project.title);
      setDescription(publicDescription);
      setTeamSize(String(project.teamSize));
      setApplyToAllSections(project.applyToAllSections);
      setAllowCrossSectionTeams(project.allowCrossSectionTeams);
      setAiMode(project.aiMode === "student" ? "student" : "doctor");
      setSectionIds(project.sections.map((s) => s.sectionId));
    } else {
      setTitle("");
      setDescription("");
      setTeamSize("4");
      setApplyToAllSections(defaultSectionId == null);
      setAllowCrossSectionTeams(false);
      setAiMode("doctor");
      setSectionIds(defaultSectionId != null ? [defaultSectionId] : []);
      void getDoctorCourseById(courseId)
        .then((course) => {
          setAiMode(course.defaultTeamFormationStrategy === "student" ? "student" : "doctor");
        })
        .catch(() => {
          /* keep default */
        });
    }

    setPendingFiles([]);
    setError(null);
    setSaving(false);

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 24, stiffness: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, project, defaultSectionId, courseId, slideAnim, fadeAnim]);

  const buildPayload = (): CreateCourseProjectPayload => ({
    title,
    description,
    teamSize: Math.min(50, Math.max(1, Number(teamSize) || 4)),
    applyToAllSections,
    allowCrossSectionTeams,
    aiMode,
    sectionIds: applyToAllSections ? [] : sectionIds,
  });

  const pickDocuments = async () => {
    try {
      if (Platform.OS === "web") {
        const picked = await pickWebRosterFile();
        if (picked) {
          const lower = picked.name.toLowerCase();
          if (!lower.endsWith(".pdf") && !lower.endsWith(".doc") && !lower.endsWith(".docx")) {
            setError("Only PDF, DOC, and DOCX files are allowed.");
            return;
          }
          setPendingFiles((prev) => [...prev, { name: picked.name }]);
        }
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) return;

      const allowed = result.assets.filter((asset) => {
        const name = (asset.name ?? "").toLowerCase();
        return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
      });

      if (allowed.length < result.assets.length) {
        setError("Some files were skipped. Only PDF, DOC, and DOCX are allowed.");
      }

      setPendingFiles((prev) => [
        ...prev,
        ...allowed.map((asset) => ({ name: asset.name ?? "document" })),
      ]);
    } catch {
      setError("Could not pick files.");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }
    if (!applyToAllSections && sectionIds.length === 0) {
      setError("Select at least one section.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit && project) {
        await updateCourseProject(project.id, buildPayload());
        onSaved("Project updated");
      } else {
        await createCourseProject(courseId, buildPayload());
        if (pendingFiles.length > 0) {
          onSaved(
            "Course project created. Documents were not uploaded — file upload API is not available yet.",
          );
        } else {
          onSaved("Course project created");
        }
      }
      onClose();
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id: number) => {
    setSectionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, DOCTOR_SPACE.lg),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={[styles.sheetTitle, { fontSize: layout.scale(18) }]}>
                {isEdit ? "Edit course project" : "Create course project"}
              </Text>
              <Text style={[styles.sheetSubtitle, { fontSize: layout.scale(12) }]}>
                Configure team formation for students in this course.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <X size={20} color={colors.foreground} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field label="Project title" styles={styles} layout={layout}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter project title"
                placeholderTextColor={colors.muted}
                style={[styles.input, { fontSize: layout.scale(14) }]}
              />
            </Field>

            <Field label="Description" styles={styles} layout={layout}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Project overview for students"
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, { fontSize: layout.scale(14) }]}
              />
            </Field>

            <Field label="Project documents" styles={styles} layout={layout}>
              <View style={styles.uploadZone}>
                <FileUp size={22} color={colors.muted} strokeWidth={1.8} />
                <Text style={[styles.uploadHint, { fontSize: layout.scale(12) }]}>PDF, DOC, or DOCX</Text>
                <Pressable
                  onPress={() => void pickDocuments()}
                  style={({ pressed }) => [styles.outlineBtn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <Text style={[styles.outlineBtnText, { fontSize: layout.scale(12) }]}>Choose files</Text>
                </Pressable>
              </View>
              {pendingFiles.map((file, index) => (
                <View key={`${file.name}-${index}`} style={styles.fileRow}>
                  <Text style={[styles.fileName, { fontSize: layout.scale(11) }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Pressable
                    onPress={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                    hitSlop={8}
                  >
                    <X size={14} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
              <Text style={[styles.disclaimer, { fontSize: layout.scale(10) }]}>
                Backend integration pending: selected files are not uploaded until a course project
                documents API is added.
              </Text>
            </Field>

            <Field label="Team size" styles={styles} layout={layout}>
              <TextInput
                value={teamSize}
                onChangeText={setTeamSize}
                keyboardType="number-pad"
                style={[styles.input, { fontSize: layout.scale(14), maxWidth: 120 }]}
              />
            </Field>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { fontSize: layout.scale(13) }]}>Apply to all sections</Text>
              <Switch
                value={applyToAllSections}
                onValueChange={setApplyToAllSections}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={applyToAllSections ? colors.primary : "#f4f4f5"}
              />
            </View>

            {!applyToAllSections ? (
              <Field label="Sections" styles={styles} layout={layout}>
                <View style={styles.chipRow}>
                  {sections.map((section) => {
                    const selected = sectionIds.includes(section.id);
                    return (
                      <Pressable
                        key={section.id}
                        onPress={() => toggleSection(section.id)}
                        style={[styles.chip, selected && styles.chipActive]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { fontSize: layout.scale(11) },
                            selected && styles.chipTextActive,
                          ]}
                        >
                          {section.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>
            ) : null}

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { fontSize: layout.scale(13) }]}>
                Allow cross-section teams
              </Text>
              <Switch
                value={allowCrossSectionTeams}
                onValueChange={setAllowCrossSectionTeams}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={allowCrossSectionTeams ? colors.primary : "#f4f4f5"}
              />
            </View>

            <Field label="Team formation mode" styles={styles} layout={layout}>
              <View style={styles.segmentRow}>
                {(["doctor", "student"] as const).map((mode) => {
                  const active = aiMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setAiMode(mode)}
                      style={[styles.segment, active && styles.segmentActive]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { fontSize: layout.scale(12) },
                          active && styles.segmentTextActive,
                        ]}
                      >
                        {mode === "doctor" ? "Doctor generates" : "Student-led"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            {error ? <Text style={[styles.errorText, { fontSize: layout.scale(12) }]}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={({ pressed }) => [styles.footerOutline, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.footerOutlineText, { fontSize: layout.scale(14) }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSubmit()}
              disabled={saving || !title.trim()}
              style={({ pressed }) => [
                styles.footerPrimary,
                { opacity: pressed || saving || !title.trim() ? 0.85 : 1 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.footerPrimaryText, { fontSize: layout.scale(14) }]}>
                  {isEdit ? "Save changes" : "Create project"}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  children,
  styles,
  layout,
}: {
  label: string;
  children: ReactNode;
  styles: ReturnType<typeof createStyles>;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { fontSize: layout.scale(12) }]}>{label}</Text>
      {children}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      maxHeight: "92%",
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: DOCTOR_RADIUS.xl,
      borderTopRightRadius: DOCTOR_RADIUS.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.lg,
      paddingBottom: DOCTOR_SPACE.sm,
      zIndex: 2,
    },
    sheetHeaderText: {
      flex: 1,
      paddingRight: DOCTOR_SPACE.md,
    },
    sheetTitle: {
      fontWeight: "800",
      color: colors.foreground,
    },
    sheetSubtitle: {
      marginTop: 4,
      fontWeight: "500",
      color: colors.muted,
      lineHeight: 18,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: DOCTOR_RADIUS.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    scroll: {
      maxHeight: "100%",
    },
    scrollContent: {
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingBottom: DOCTOR_SPACE.md,
      gap: DOCTOR_SPACE.md,
    },
    field: {
      gap: DOCTOR_SPACE.sm,
    },
    fieldLabel: {
      fontWeight: "700",
      color: colors.foreground,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.sm,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    textArea: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.sm,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.md,
      minHeight: 96,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    uploadZone: {
      alignItems: "center",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.md,
      paddingVertical: DOCTOR_SPACE.lg,
      paddingHorizontal: DOCTOR_SPACE.md,
      backgroundColor: colors.background,
      gap: DOCTOR_SPACE.sm,
    },
    uploadHint: {
      fontWeight: "500",
      color: colors.foreground,
    },
    outlineBtn: {
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    outlineBtnText: {
      fontWeight: "700",
      color: colors.foreground,
    },
    fileRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: DOCTOR_SPACE.sm,
      paddingHorizontal: DOCTOR_SPACE.sm,
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    fileName: {
      flex: 1,
      fontWeight: "500",
      color: colors.foreground,
    },
    disclaimer: {
      fontWeight: "500",
      color: colors.muted,
      lineHeight: 16,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: DOCTOR_SPACE.md,
    },
    switchLabel: {
      flex: 1,
      fontWeight: "600",
      color: colors.foreground,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DOCTOR_SPACE.sm,
    },
    chip: {
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    chipText: {
      fontWeight: "600",
      color: colors.muted,
    },
    chipTextActive: {
      color: colors.primary,
    },
    segmentRow: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
    },
    segment: {
      flex: 1,
      paddingVertical: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
    },
    segmentActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    segmentText: {
      fontWeight: "700",
      color: colors.muted,
    },
    segmentTextActive: {
      color: colors.primary,
    },
    errorText: {
      fontWeight: "600",
      color: "#DC2626",
    },
    footer: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    footerOutline: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    footerOutlineText: {
      fontWeight: "700",
      color: colors.foreground,
    },
    footerPrimary: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.primary,
    },
    footerPrimaryText: {
      fontWeight: "800",
      color: "#fff",
    },
  });
}
