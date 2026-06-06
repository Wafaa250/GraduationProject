import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { ChevronDown, ChevronUp, Copy, Pencil, Trash2 } from "lucide-react-native";

import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationSelectField } from "@/components/association/AssociationSelectField";
import { AssociationTextField } from "@/components/association/AssociationTextField";
import { FormFieldOptionsEditor } from "@/components/association/FormFieldOptionsEditor";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { confirmAlert } from "@/lib/confirmAlert";

export type BuilderFieldRow = {
  id: number;
  label: string;
  fieldType: string;
  placeholder?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  options?: string[] | null;
  displayOrder: number;
};

export type BuilderFieldDraft = {
  label: string;
  fieldType: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  options: string[];
  displayOrder: number;
};

type Props = {
  fields: BuilderFieldRow[];
  fieldTypes: readonly string[];
  fieldTypeLabel: (type: string) => string;
  fieldUsesOptions: (type: string) => boolean;
  selection: number | "new" | null;
  draft: BuilderFieldDraft | null;
  saving: boolean;
  allowDuplicate?: boolean;
  onSelect: (selection: number | "new" | null) => void;
  onDraftChange: (draft: BuilderFieldDraft) => void;
  onSaveField: () => void;
  onDeleteField: (field: BuilderFieldRow) => void;
  onDuplicateField?: (field: BuilderFieldRow) => void;
  onMoveField: (field: BuilderFieldRow, direction: "up" | "down") => void;
  onCancelEdit: () => void;
};

export function FormFieldBuilderList({
  fields,
  fieldTypes,
  fieldTypeLabel,
  fieldUsesOptions,
  selection,
  draft,
  saving,
  allowDuplicate = false,
  onSelect,
  onDraftChange,
  onSaveField,
  onDeleteField,
  onDuplicateField,
  onMoveField,
  onCancelEdit,
}: Props) {
  const sorted = useMemo(
    () => fields.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [fields],
  );

  const editingExisting = typeof selection === "number";

  return (
    <View style={{ gap: 12, width: "100%" }}>
      <AssociationCard compact>
        <View style={styles.listHead}>
          <Text style={associationCardStyles.sectionTitle}>Questions</Text>
          <Text style={styles.count}>{sorted.length}</Text>
        </View>

        {sorted.length === 0 ? (
          <Text style={styles.empty}>No questions yet. Add one to build your form.</Text>
        ) : (
          sorted.map((field, index) => {
            const selected = selection === field.id;
            return (
              <View
                key={field.id}
                style={[styles.questionRow, selected ? styles.questionRowSelected : null]}
              >
                <Pressable style={{ flex: 1, minWidth: 0 }} onPress={() => onSelect(field.id)}>
                  <Text style={styles.questionLabel} numberOfLines={2}>
                    {field.label}
                    {field.isRequired ? " *" : ""}
                  </Text>
                  <Text style={styles.questionMeta}>{fieldTypeLabel(field.fieldType)}</Text>
                </Pressable>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => onMoveField(field, "up")}
                    disabled={index === 0 || saving}
                    hitSlop={6}
                  >
                    <ChevronUp
                      size={18}
                      color={index === 0 ? ASSOC_COLORS.border : ASSOC_COLORS.muted}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => onMoveField(field, "down")}
                    disabled={index === sorted.length - 1 || saving}
                    hitSlop={6}
                  >
                    <ChevronDown
                      size={18}
                      color={index === sorted.length - 1 ? ASSOC_COLORS.border : ASSOC_COLORS.muted}
                    />
                  </Pressable>
                  <Pressable onPress={() => onSelect(field.id)} hitSlop={6}>
                    <Pencil size={16} color={ASSOC_COLORS.accentDark} strokeWidth={2.25} />
                  </Pressable>
                  {allowDuplicate && onDuplicateField ? (
                    <Pressable onPress={() => onDuplicateField(field)} hitSlop={6} disabled={saving}>
                      <Copy size={16} color={ASSOC_COLORS.muted} strokeWidth={2.25} />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() =>
                      confirmAlert({
                        title: "Delete question",
                        message: `Remove "${field.label}" from the form?`,
                        confirmLabel: "Delete",
                        destructive: true,
                        onConfirm: () => onDeleteField(field),
                      })
                    }
                    hitSlop={6}
                  >
                    <Trash2 size={16} color="#DC2626" strokeWidth={2.25} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        {selection == null ? (
          <View style={{ marginTop: 10 }}>
            <AssociationActionButton label="Add question" variant="outline" onPress={() => onSelect("new")} />
          </View>
        ) : null}
      </AssociationCard>

      {selection != null && draft ? (
        <AssociationCard compact>
          <Text style={associationCardStyles.sectionTitle}>
            {editingExisting ? "Edit question" : "Add question"}
          </Text>
          <FormFieldEditor
            draft={draft}
            fieldTypes={fieldTypes}
            fieldTypeLabel={fieldTypeLabel}
            fieldUsesOptions={fieldUsesOptions}
            onChange={onDraftChange}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            <AssociationActionButton
              label={editingExisting ? "Save changes" : "Add question"}
              loading={saving}
              onPress={onSaveField}
            />
            <AssociationActionButton label="Cancel" variant="outline" onPress={onCancelEdit} />
          </View>
        </AssociationCard>
      ) : null}
    </View>
  );
}

function FormFieldEditor({
  draft,
  fieldTypes,
  fieldTypeLabel,
  fieldUsesOptions,
  onChange,
}: {
  draft: BuilderFieldDraft;
  fieldTypes: readonly string[];
  fieldTypeLabel: (type: string) => string;
  fieldUsesOptions: (type: string) => boolean;
  onChange: (draft: BuilderFieldDraft) => void;
}) {
  return (
    <View style={{ gap: 4 }}>
      <AssociationTextField
        label="Question title"
        value={draft.label}
        onChangeText={(label) => onChange({ ...draft, label })}
        placeholder="e.g. Why do you want to join?"
      />
      <AssociationSelectField
        label="Question type"
        value={draft.fieldType}
        onValueChange={(fieldType) => onChange({ ...draft, fieldType })}
        options={fieldTypes}
      />
      <AssociationTextField
        label="Placeholder (optional)"
        value={draft.placeholder}
        onChangeText={(placeholder) => onChange({ ...draft, placeholder })}
      />
      <AssociationTextField
        label="Help text (optional)"
        value={draft.helpText}
        onChangeText={(helpText) => onChange({ ...draft, helpText })}
      />
      <View style={styles.requiredRow}>
        <Text style={styles.requiredLabel}>Required</Text>
        <Switch
          value={draft.isRequired}
          onValueChange={(isRequired) => onChange({ ...draft, isRequired })}
          trackColor={{ false: ASSOC_COLORS.border, true: ASSOC_COLORS.accentSoft }}
          thumbColor={draft.isRequired ? ASSOC_COLORS.accent : ASSOC_COLORS.muted}
        />
      </View>
      {fieldUsesOptions(draft.fieldType) ? (
        <FormFieldOptionsEditor
          options={draft.options}
          onChange={(options) => onChange({ ...draft, options })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  count: {
    fontSize: 12,
    fontWeight: "700",
    color: ASSOC_COLORS.muted,
    backgroundColor: ASSOC_COLORS.accentSoft,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: ASSOC_COLORS.border,
  },
  questionRowSelected: {
    backgroundColor: ASSOC_COLORS.accentSoft,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  questionLabel: {
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
    fontSize: 14,
  },
  questionMeta: {
    color: ASSOC_COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  empty: {
    color: ASSOC_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  requiredRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  requiredLabel: {
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
    fontSize: 14,
  },
});
