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
import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createRecruitmentCampaignQuestion,
  deleteRecruitmentCampaignQuestion,
  listRecruitmentCampaignQuestions,
  updateRecruitmentCampaignQuestion,
  type RecruitmentQuestion,
} from "@/api/organizationRecruitmentCampaignsApi";
import { ApplicationFormPreview } from "@/components/organization/ApplicationFormPreview";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import {
  draftToPayload,
  emptyFieldDraft,
  fieldToDraft,
  fieldTypeLabel,
  fieldUsesOptions,
  filterQuestionsForPosition,
  validateFieldDraft,
  type FormFieldDraft,
} from "@/utils/recruitmentFormFields";

const EDITOR_FIELD_TYPES = [
  "ShortText",
  "Paragraph",
  "Dropdown",
  "MultipleChoice",
  "CheckboxList",
  "FileUpload",
  "Url",
  "Email",
  "Date",
  "YesNo",
] as const;

type Props = {
  campaignId: number;
  positionId: number;
  positionTitle: string;
};

type Selection = number | "new" | null;

export function positionApplicationFormPath(campaignId: number, positionId: number): Href {
  return `/organization/recruitment-campaigns/${campaignId}/positions/${positionId}/form` as Href;
}

export function PositionApplicationFormEditor({ campaignId, positionId, positionTitle }: Props) {
  const [allQuestions, setAllQuestions] = useState<RecruitmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [draft, setDraft] = useState<FormFieldDraft | null>(null);

  const questions = useMemo(
    () => filterQuestionsForPosition(allQuestions, positionId),
    [allQuestions, positionId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRecruitmentCampaignQuestions(campaignId);
      setAllQuestions(data);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selection === "new") {
      setDraft(emptyFieldDraft(questions.length, { positionId }));
      return;
    }
    if (typeof selection === "number") {
      const q = questions.find((x) => x.id === selection);
      setDraft(q ? fieldToDraft(q) : null);
      return;
    }
    setDraft(null);
  }, [selection, questions, positionId]);

  const selectedId = typeof selection === "number" ? selection : null;

  const saveQuestion = async () => {
    if (!draft) return;
    const err = validateFieldDraft(draft);
    if (err) {
      Alert.alert("Validation", err);
      return;
    }
    setSaving(true);
    try {
      const payload = draftToPayload({ ...draft, positionId }, positionId);
      if (selection === "new") {
        await createRecruitmentCampaignQuestion(campaignId, payload);
      } else if (typeof selection === "number") {
        await updateRecruitmentCampaignQuestion(campaignId, selection, payload);
      }
      await load();
      setSelection(null);
      setDraft(null);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = (id: number) => {
    Alert.alert("Delete question", "Remove this question from the application form?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await deleteRecruitmentCampaignQuestion(campaignId, id);
              if (selection === id) {
                setSelection(null);
                setDraft(null);
              }
              await load();
            } catch (e) {
              Alert.alert("Error", parseApiErrorMessage(e));
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  };

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= questions.length) return;
    const a = questions[index];
    const b = questions[next];
    setSaving(true);
    try {
      await Promise.all([
        updateRecruitmentCampaignQuestion(campaignId, a.id, { displayOrder: b.displayOrder }),
        updateRecruitmentCampaignQuestion(campaignId, b.id, { displayOrder: a.displayOrder }),
      ]);
      await load();
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const title = positionTitle.trim() || "Position";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={assocColors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Application form</Text>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageSub}>
          Design the form students complete when applying for this role. Tap a question in the preview
          to edit it.
        </Text>

        <View style={styles.previewHeader}>
          <Text style={styles.sectionTitle}>Live preview</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>Student view</Text>
          </View>
        </View>

        <ApplicationFormPreview
          fields={questions}
          title="Application form"
          selectedFieldId={selectedId}
          onFieldPress={(id) => setSelection(id)}
          interactive
        />

        {selection != null && draft ? (
          <QuestionSettings
            draft={draft}
            onChange={(patch) => setDraft({ ...draft, ...patch })}
            onSave={() => void saveQuestion()}
            onCancel={() => {
              setSelection(null);
              setDraft(null);
            }}
            onDelete={typeof selection === "number" ? () => removeQuestion(selection) : undefined}
            onMoveUp={
              typeof selection === "number"
                ? () => {
                    const idx = questions.findIndex((q) => q.id === selection);
                    if (idx > 0) void moveQuestion(idx, -1);
                  }
                : undefined
            }
            onMoveDown={
              typeof selection === "number"
                ? () => {
                    const idx = questions.findIndex((q) => q.id === selection);
                    if (idx >= 0 && idx < questions.length - 1) void moveQuestion(idx, 1);
                  }
                : undefined
            }
            saving={saving}
            isNew={selection === "new"}
            canMoveUp={
              typeof selection === "number" && questions.findIndex((q) => q.id === selection) > 0
            }
            canMoveDown={
              typeof selection === "number" &&
              questions.findIndex((q) => q.id === selection) < questions.length - 1
            }
          />
        ) : (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Questions</Text>
            {questions.length === 0 ? (
              <Text style={styles.emptyList}>No questions yet — your form is empty.</Text>
            ) : (
              questions.map((q, index) => (
                <Pressable key={q.id} onPress={() => setSelection(q.id)} style={styles.listItem}>
                  <Text style={styles.listNum}>{index + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{q.questionTitle}</Text>
                    <Text style={styles.listMeta}>
                      {fieldTypeLabel(q.questionType)}
                      {q.isRequired ? " · Required" : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={assocColors.muted} />
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {selection == null ? (
        <View style={styles.footer}>
          <Pressable
            onPress={() => setSelection("new")}
            disabled={saving}
            style={[styles.addBtn, saving && { opacity: 0.7 }]}
          >
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.addBtnTxt}>Add question</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function QuestionSettings({
  draft,
  onChange,
  onSave,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown,
  saving,
  isNew,
  canMoveUp,
  canMoveDown,
}: {
  draft: FormFieldDraft;
  onChange: (patch: Partial<FormFieldDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  saving?: boolean;
  isNew?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  const usesOptions = fieldUsesOptions(draft.questionType);

  return (
    <View style={styles.settingsCard}>
      <Text style={styles.sectionTitle}>{isNew ? "New question" : "Question settings"}</Text>

      <Text style={styles.fieldLabel}>Question label *</Text>
      <TextInput
        value={draft.questionTitle}
        onChangeText={(t) => onChange({ questionTitle: t })}
        placeholder="e.g. Why do you want to join?"
        placeholderTextColor={assocColors.subtle}
        style={styles.input}
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Question type</Text>
      <View style={styles.typeRow}>
        {EDITOR_FIELD_TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() =>
              onChange({
                questionType: t,
                options: fieldUsesOptions(t) ? draft.options : ["", ""],
              })
            }
            style={[styles.typeChip, draft.questionType === t && styles.typeChipOn]}
          >
            <Text style={[styles.typeChipTxt, draft.questionType === t && styles.typeChipTxtOn]}>
              {fieldTypeLabel(t)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Help text</Text>
      <TextInput
        value={draft.helpText}
        onChangeText={(t) => onChange({ helpText: t })}
        placeholder="Optional guidance"
        placeholderTextColor={assocColors.subtle}
        style={[styles.input, styles.textArea]}
        multiline
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Placeholder</Text>
      <TextInput
        value={draft.placeholder}
        onChangeText={(t) => onChange({ placeholder: t })}
        placeholder="Hint inside the field"
        placeholderTextColor={assocColors.subtle}
        style={styles.input}
        editable={!saving}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Required</Text>
        <Switch
          value={draft.isRequired}
          onValueChange={(v) => onChange({ isRequired: v })}
          disabled={saving}
          trackColor={{ false: "#e2e8f0", true: assocColors.accentBorder }}
          thumbColor={draft.isRequired ? assocColors.accent : "#f4f4f5"}
        />
      </View>

      {usesOptions ? (
        <>
          <Text style={styles.fieldLabel}>Answer options</Text>
          {draft.options.map((opt, i) => (
            <View key={i} style={styles.optRow}>
              <Text style={styles.optNum}>{i + 1}</Text>
              <TextInput
                value={opt}
                onChangeText={(t) => {
                  const next = [...draft.options];
                  next[i] = t;
                  onChange({ options: next });
                }}
                style={[styles.input, { flex: 1 }]}
                editable={!saving}
              />
              {draft.options.length > 2 ? (
                <Pressable
                  onPress={() => onChange({ options: draft.options.filter((_, j) => j !== i) })}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={22} color="#dc2626" />
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable
            onPress={() => onChange({ options: [...draft.options, ""] })}
            style={styles.addOpt}
            disabled={saving}
          >
            <Text style={styles.addOptTxt}>+ Add option</Text>
          </Pressable>
        </>
      ) : null}

      {!isNew && (onMoveUp || onMoveDown) ? (
        <View style={styles.reorderRow}>
          {onMoveUp ? (
            <Pressable
              onPress={onMoveUp}
              disabled={saving || !canMoveUp}
              style={[styles.reorderBtn, !canMoveUp && { opacity: 0.4 }]}
            >
              <Ionicons name="arrow-up" size={16} color={assocColors.text} />
              <Text style={styles.reorderTxt}>Up</Text>
            </Pressable>
          ) : null}
          {onMoveDown ? (
            <Pressable
              onPress={onMoveDown}
              disabled={saving || !canMoveDown}
              style={[styles.reorderBtn, !canMoveDown && { opacity: 0.4 }]}
            >
              <Ionicons name="arrow-down" size={16} color={assocColors.text} />
              <Text style={styles.reorderTxt}>Down</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable onPress={onSave} disabled={saving} style={styles.saveBtn}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnTxt}>{isNew ? "Add to form" : "Save question"}</Text>
          )}
        </Pressable>
        <Pressable onPress={onCancel} disabled={saving} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnTxt}>Cancel</Text>
        </Pressable>
      </View>

      {!isNew && onDelete ? (
        <Pressable onPress={onDelete} disabled={saving} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
          <Text style={styles.deleteBtnTxt}>Delete question</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 120,
    gap: spacing.md,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: assocColors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pageTitle: { fontSize: 22, fontWeight: "800", color: assocColors.text },
  pageSub: { fontSize: 14, color: assocColors.muted, lineHeight: 20 },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: assocColors.text },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  badgeTxt: { fontSize: 11, fontWeight: "700", color: assocColors.accentDark },
  listSection: { gap: spacing.sm },
  emptyList: { fontSize: 13, color: assocColors.muted, fontStyle: "italic" },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
  },
  listNum: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: assocColors.accentMuted,
    color: assocColors.accentDark,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 26,
  },
  listTitle: { fontSize: 14, fontWeight: "700", color: assocColors.text },
  listMeta: { fontSize: 12, color: assocColors.muted, marginTop: 2 },
  settingsCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.surface,
    gap: spacing.sm,
  },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: assocColors.text, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: assocColors.text,
    backgroundColor: assocColors.bg,
    minHeight: 48,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.bg,
  },
  typeChipOn: {
    borderColor: assocColors.accent,
    backgroundColor: assocColors.accentMuted,
  },
  typeChipTxt: { fontSize: 12, fontWeight: "600", color: assocColors.muted },
  typeChipTxtOn: { color: assocColors.accentDark },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: spacing.sm,
  },
  switchLabel: { fontSize: 14, fontWeight: "700", color: assocColors.text },
  optRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  optNum: { width: 20, fontWeight: "800", color: assocColors.muted, textAlign: "center" },
  addOpt: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: assocColors.border,
    alignItems: "center",
  },
  addOptTxt: { fontWeight: "700", color: assocColors.accentDark },
  reorderRow: { flexDirection: "row", gap: spacing.sm },
  reorderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.bg,
  },
  reorderTxt: { fontWeight: "700", fontSize: 13, color: assocColors.text },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  saveBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  saveBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancelBtn: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.surface,
  },
  cancelBtnTxt: { fontWeight: "700", color: assocColors.muted },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.sm,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deleteBtnTxt: { color: "#dc2626", fontWeight: "700" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: assocColors.bg,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    elevation: 6,
  },
  addBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
