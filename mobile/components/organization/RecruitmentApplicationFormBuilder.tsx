import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createRecruitmentCampaignQuestion,
  deleteRecruitmentCampaignQuestion,
  listRecruitmentCampaignQuestions,
  updateRecruitmentCampaignQuestion,
  type RecruitmentQuestion,
} from "@/api/organizationRecruitmentCampaignsApi";
import {
  draftToPayload,
  emptyFieldDraft,
  fieldToDraft,
  filterFieldsForCampaignForm,
  filterFieldsForPositionForm,
  validateFieldDraft,
  type FormFieldDraft,
  type PositionOption,
} from "@/utils/recruitmentFormFields";
import {
  ActionChip,
  FieldEditor,
  FieldSummaryCard,
} from "@/components/organization/recruitmentApplicationFormBuilderParts";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

export type FormBuilderScope =
  | { type: "campaign" }
  | {
      type: "position";
      positionTitle: string;
      positionId?: number;
      positionKey?: string;
    };

type Props = {
  campaignId: number;
  scope: FormBuilderScope;
  positions: PositionOption[];
  embedded?: boolean;
  compact?: boolean;
};

function scopeDefaults(scope: FormBuilderScope): Partial<FormFieldDraft> {
  if (scope.type === "campaign") return { positionId: null, positionKey: null };
  if (scope.positionId != null) return { positionId: scope.positionId, positionKey: null };
  return { positionId: null, positionKey: scope.positionKey ?? null };
}

function filterByScope(fields: RecruitmentQuestion[], scope: FormBuilderScope) {
  if (scope.type === "campaign") return filterFieldsForCampaignForm(fields);
  return filterFieldsForPositionForm(fields, {
    id: scope.positionId,
    key: scope.positionKey ?? (scope.positionId != null ? `pos-${scope.positionId}` : ""),
  });
}

export function RecruitmentApplicationFormBuilder({
  campaignId,
  scope,
  positions,
  embedded,
  compact,
}: Props) {
  const [fields, setFields] = useState<RecruitmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [newDraft, setNewDraft] = useState<FormFieldDraft | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<number, FormFieldDraft>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRecruitmentCampaignQuestions(campaignId);
      setFields(data);
      setEditDrafts({});
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => filterByScope(fields, scope), [fields, scope]);

  const startAdd = () => {
    setEditingId("new");
    setNewDraft(emptyFieldDraft(sorted.length, scopeDefaults(scope)));
  };

  const saveNew = async () => {
    if (!newDraft) return;
    const err = validateFieldDraft(newDraft, positions);
    if (err) {
      Alert.alert("Validation", err);
      return;
    }
    setSaving(true);
    try {
      await createRecruitmentCampaignQuestion(campaignId, draftToPayload(newDraft));
      setNewDraft(null);
      setEditingId(null);
      await load();
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (f: RecruitmentQuestion) => {
    const draft = editDrafts[f.id] ?? fieldToDraft(f);
    const err = validateFieldDraft(draft, positions);
    if (err) {
      Alert.alert("Validation", err);
      return;
    }
    setSaving(true);
    try {
      await updateRecruitmentCampaignQuestion(campaignId, f.id, draftToPayload(draft));
      setEditingId(null);
      await load();
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert("Remove field", "Remove this field from the application form?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          void (async () => {
            setSaving(true);
            try {
              await deleteRecruitmentCampaignQuestion(campaignId, id);
              if (editingId === id) setEditingId(null);
              await load();
            } catch (e) {
              Alert.alert("Error", parseApiErrorMessage(e));
            } finally {
              setSaving(false);
            }
          })(),
      },
    ]);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[next];
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

  const patchEdit = (id: number, patch: Partial<FormFieldDraft>) => {
    setEditDrafts((prev) => {
      const base = prev[id] ?? fieldToDraft(fields.find((x) => x.id === id)!);
      return { ...prev, [id]: { ...base, ...patch } };
    });
  };

  return (
    <View style={embedded ? styles.wrapEmbedded : styles.wrap}>
      <Text style={styles.title}>Student application form</Text>
      <Text style={styles.sub}>
        {embedded
          ? "Part of this recruitment ad—students complete these fields when they apply."
          : "Build the application form students will complete when applying to this recruitment campaign."}
      </Text>

      {loading ? (
        <ActivityIndicator color={assocColors.accent} style={{ marginVertical: spacing.lg }} />
      ) : (
        <>
          {sorted.length === 0 && editingId !== "new" ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Start your application form</Text>
              <Text style={styles.emptySub}>
                Add fields for portfolio links, experience, availability, or anything your org needs.
              </Text>
              <Pressable style={styles.addBtn} onPress={startAdd}>
                <Ionicons name="add-circle-outline" size={20} color={assocColors.accentDark} />
                <Text style={styles.addTxt}>Add first field</Text>
              </Pressable>
            </View>
          ) : null}

          {sorted.map((f, index) =>
            editingId === f.id ? (
              <FieldEditor
                key={f.id}
                title={`Edit field ${index + 1}`}
                draft={editDrafts[f.id] ?? fieldToDraft(f)}
                onChange={(patch) => patchEdit(f.id, patch)}
                onSave={() => void saveEdit(f)}
                onCancel={() => setEditingId(null)}
                saving={saving}
                positions={positions}
                lockScope
              />
            ) : (
              <FieldSummaryCard
                key={f.id}
                field={f}
                index={index}
                total={sorted.length}
                positions={positions}
                onEdit={() => setEditingId(f.id)}
                onDelete={() => remove(f.id)}
                onMoveUp={() => void move(index, -1)}
                onMoveDown={() => void move(index, 1)}
                disabled={saving || editingId === "new"}
              />
            ),
          )}

          {editingId === "new" && newDraft ? (
            <FieldEditor
              title="New form field"
              draft={newDraft}
              onChange={(patch) => setNewDraft({ ...newDraft, ...patch })}
              onSave={() => void saveNew()}
              onCancel={() => {
                setEditingId(null);
                setNewDraft(null);
              }}
              saving={saving}
              isNew
              positions={positions}
              lockScope
            />
          ) : null}

          {editingId !== "new" ? (
            <Pressable
              style={styles.addBtn}
              onPress={startAdd}
              disabled={saving}
            >
              <Ionicons name="add-circle-outline" size={20} color={assocColors.accentDark} />
              <Text style={styles.addTxt}>Add field</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  wrapEmbedded: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: assocColors.accentBorder,
  },
  title: { fontSize: 17, fontWeight: "900", color: assocColors.text },
  sub: {
    marginTop: 6,
    marginBottom: spacing.md,
    fontSize: 13,
    color: assocColors.muted,
    lineHeight: 18,
  },
  empty: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: assocColors.text, marginBottom: 8 },
  emptySub: {
    fontSize: 13,
    color: assocColors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: assocColors.surface,
  },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: assocColors.text, lineHeight: 22 },
  summaryMeta: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: assocColors.accentDark,
  },
  summaryHelp: { marginTop: 8, fontSize: 13, color: assocColors.muted, lineHeight: 18 },
  summaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.bg,
  },
  chipDanger: { borderColor: "#fecaca" },
  chipTxt: { fontSize: 12, fontWeight: "700", color: assocColors.accentDark },
  editorCard: {
    borderWidth: 2,
    borderColor: assocColors.accentBorder,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: assocColors.surface,
  },
  editorTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: assocColors.accentDark,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: assocColors.text,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
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
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    backgroundColor: assocColors.bg,
  },
  selectTxt: { fontSize: 15, fontWeight: "600", color: assocColors.text, flex: 1 },
  chev: { color: assocColors.muted, fontSize: 12 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    maxHeight: "80%",
  },
  modalH: { fontSize: 16, fontWeight: "800", marginBottom: spacing.sm, color: assocColors.text },
  modalRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
  },
  modalRowTxt: { fontSize: 15, color: assocColors.text, fontWeight: "600" },
  modalCancel: { padding: spacing.md, alignItems: "center" },
  modalCancelTxt: { color: assocColors.accentDark, fontWeight: "700" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  optNum: { width: 20, fontSize: 12, fontWeight: "800", color: assocColors.muted, textAlign: "center" },
  removeOpt: { fontSize: 18, fontWeight: "700", color: "#dc2626", paddingHorizontal: 4 },
  addOpt: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  addOptTxt: { fontSize: 13, fontWeight: "700", color: assocColors.accentDark },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  saveBtn: {
    flex: 1,
    minWidth: 120,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancelBtn: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelTxt: { fontWeight: "700", color: assocColors.muted },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
    marginTop: spacing.sm,
  },
  addTxt: { fontSize: 14, fontWeight: "800", color: assocColors.accentDark },
});
