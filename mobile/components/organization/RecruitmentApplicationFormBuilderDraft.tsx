import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  emptyFieldDraft,
  filterFieldsForCampaignForm,
  filterFieldsForPositionForm,
  newLocalFormField,
  validateFieldDraft,
  type FormFieldDraft,
  type LocalFormField,
  type PositionOption,
} from "@/utils/recruitmentFormFields";
import type { FormBuilderScope } from "@/components/organization/RecruitmentApplicationFormBuilder";
import {
  FieldEditor,
  FieldSummaryCard,
} from "@/components/organization/recruitmentApplicationFormBuilderParts";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

type Props = {
  fields: LocalFormField[];
  onChange: (fields: LocalFormField[]) => void;
  onEditingChange?: (editing: boolean) => void;
  disabled?: boolean;
  scope: FormBuilderScope;
  positions: PositionOption[];
  compact?: boolean;
};

function scopeDefaults(scope: FormBuilderScope): Partial<FormFieldDraft> {
  if (scope.type === "campaign") return { positionId: null, positionKey: null };
  if (scope.positionId != null) return { positionId: scope.positionId, positionKey: null };
  return { positionId: null, positionKey: scope.positionKey ?? null };
}

function filterDraftByScope(fields: LocalFormField[], scope: FormBuilderScope) {
  if (scope.type === "campaign") return filterFieldsForCampaignForm(fields);
  return filterFieldsForPositionForm(fields, {
    id: scope.positionId,
    key: scope.positionKey ?? (scope.positionId != null ? `pos-${scope.positionId}` : ""),
  });
}

export function RecruitmentApplicationFormBuilderDraft({
  fields,
  onChange,
  onEditingChange,
  disabled,
  scope,
  positions,
}: Props) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [newDraft, setNewDraft] = useState<FormFieldDraft | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, FormFieldDraft>>({});

  useEffect(() => {
    onEditingChange?.(editingId != null);
  }, [editingId, onEditingChange]);

  const sorted = useMemo(() => filterDraftByScope(fields, scope), [fields, scope]);

  const sectionTitle =
    scope.type === "campaign"
      ? "Shared campaign application form"
      : `Application form — ${scope.positionTitle}`;

  const reindex = (list: LocalFormField[]) =>
    list
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((f, i) => ({ ...f, displayOrder: i }));

  const startAdd = () => {
    setEditingId("new");
    const defaults = scopeDefaults(scope);
    if (scope.type === "position" && scope.positionKey) defaults.positionKey = scope.positionKey;
    setNewDraft(emptyFieldDraft(sorted.length, defaults));
  };

  const saveNew = () => {
    if (!newDraft) return;
    const err = validateFieldDraft(newDraft, positions);
    if (err) {
      Alert.alert("Validation", err);
      return;
    }
    onChange(reindex([...fields, { ...newDraft, clientId: newLocalFormField(newDraft.displayOrder).clientId }]));
    setNewDraft(null);
    setEditingId(null);
  };

  const saveEdit = (f: LocalFormField) => {
    const draft = editDrafts[f.clientId] ?? f;
    const err = validateFieldDraft(draft, positions);
    if (err) {
      Alert.alert("Validation", err);
      return;
    }
    onChange(
      reindex(fields.map((x) => (x.clientId === f.clientId ? { ...x, ...draft, clientId: x.clientId } : x))),
    );
    setEditingId(null);
    setEditDrafts((prev) => {
      const next = { ...prev };
      delete next[f.clientId];
      return next;
    });
  };

  const remove = (clientId: string) => {
    Alert.alert("Remove field", "Remove this field from the application form?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          onChange(reindex(fields.filter((f) => f.clientId !== clientId)));
          if (editingId === clientId) setEditingId(null);
        },
      },
    ]);
  };

  const move = (index: number, direction: -1 | 1) => {
    const scoped = filterDraftByScope(fields, scope);
    const next = index + direction;
    if (next < 0 || next >= scoped.length) return;
    const list = [...scoped];
    const a = list[index];
    const b = list[next];
    list[index] = { ...b, displayOrder: a.displayOrder };
    list[next] = { ...a, displayOrder: b.displayOrder };
    const updatedIds = new Set(list.map((x) => x.clientId));
    const others = fields.filter((f) => !updatedIds.has(f.clientId));
    onChange(reindex([...others, ...list]));
  };

  const patchEdit = (clientId: string, patch: Partial<FormFieldDraft>) => {
    setEditDrafts((prev) => {
      const base = prev[clientId] ?? fields.find((x) => x.clientId === clientId)!;
      return { ...prev, [clientId]: { ...base, ...patch } };
    });
  };

  const locked = disabled || editingId != null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{sectionTitle}</Text>

      {sorted.length === 0 && editingId !== "new" ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No fields yet</Text>
          <Pressable style={styles.addBtn} onPress={startAdd} disabled={disabled}>
            <Ionicons name="add-circle-outline" size={20} color={assocColors.accentDark} />
            <Text style={styles.addTxt}>Add first field</Text>
          </Pressable>
        </View>
      ) : null}

      {sorted.map((f, index) =>
        editingId === f.clientId ? (
          <FieldEditor
            key={f.clientId}
            title={`Edit field ${index + 1}`}
            draft={editDrafts[f.clientId] ?? f}
            onChange={(patch) => patchEdit(f.clientId, patch)}
            onSave={() => saveEdit(f)}
            onCancel={() => setEditingId(null)}
            positions={positions}
            lockScope
          />
        ) : (
          <FieldSummaryCard
            key={f.clientId}
            field={f}
            index={index}
            total={sorted.length}
            positions={positions}
            onEdit={() => setEditingId(f.clientId)}
            onDelete={() => remove(f.clientId)}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
            disabled={locked}
          />
        ),
      )}

      {editingId === "new" && newDraft ? (
        <FieldEditor
          title="New form field"
          draft={newDraft}
          onChange={(patch) => setNewDraft({ ...newDraft, ...patch })}
          onSave={saveNew}
          onCancel={() => {
            setEditingId(null);
            setNewDraft(null);
          }}
          isNew
          positions={positions}
          lockScope
        />
      ) : null}

      {editingId !== "new" ? (
        <Pressable style={styles.addBtn} onPress={startAdd} disabled={locked}>
          <Ionicons name="add-circle-outline" size={20} color={assocColors.accentDark} />
          <Text style={styles.addTxt}>Add field</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function validateNoOpenFormEditorMobile(editing: boolean): boolean {
  if (editing) {
    Alert.alert("Form editor open", "Save or cancel the field you are editing before continuing.");
    return false;
  }
  return true;
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  heading: {
    fontSize: 15,
    fontWeight: "800",
    color: assocColors.text,
    marginBottom: spacing.sm,
  },
  empty: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: assocColors.accentBorder,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: assocColors.text, marginBottom: spacing.sm },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: assocColors.accentMuted,
  },
  addTxt: { fontSize: 14, fontWeight: "700", color: assocColors.accentDark },
});
