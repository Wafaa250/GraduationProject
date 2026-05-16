import { useState } from "react";
import {
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
import {
  FORM_FIELD_TYPES,
  fieldAppliesToLabel,
  fieldTypeLabel,
  fieldUsesOptions,
  getApplyScope,
  type FormFieldDraft,
  type PositionOption,
} from "@/utils/recruitmentFormFields";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

export type FormFieldSummary = FormFieldDraft & {
  questionTitle: string;
  questionType: string;
  isRequired: boolean;
  helpText?: string | null;
};

export function FieldSummaryCard({
  field,
  index,
  total,
  positions,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled,
}: {
  field: FormFieldSummary;
  index: number;
  total: number;
  positions: PositionOption[];
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{field.questionTitle}</Text>
      <Text style={styles.summaryMeta}>
        {fieldTypeLabel(field.questionType)}
        {field.isRequired ? " · Required" : " · Optional"}
      </Text>
      <Text style={styles.appliesTo}>
        Applies to: {fieldAppliesToLabel(field, positions)}
      </Text>
      {field.helpText?.trim() ? (
        <Text style={styles.summaryHelp} numberOfLines={2}>
          {field.helpText.trim()}
        </Text>
      ) : null}
      <View style={styles.summaryActions}>
        <ActionChip label="Edit" icon="pencil-outline" onPress={onEdit} disabled={disabled} />
        <ActionChip label="Delete" icon="trash-outline" onPress={onDelete} disabled={disabled} danger />
        <ActionChip
          label="Up"
          icon="chevron-up"
          onPress={onMoveUp}
          disabled={disabled || index === 0}
        />
        <ActionChip
          label="Down"
          icon="chevron-down"
          onPress={onMoveDown}
          disabled={disabled || index >= total - 1}
        />
      </View>
    </View>
  );
}

export function ActionChip({
  label,
  icon,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[styles.chip, danger && styles.chipDanger, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={14} color={danger ? "#b91c1c" : assocColors.accentDark} />
      <Text style={[styles.chipTxt, danger && { color: "#b91c1c" }]}>{label}</Text>
    </Pressable>
  );
}

export function FieldEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
  title,
  isNew,
  positions,
  lockScope,
}: {
  draft: FormFieldDraft;
  onChange: (patch: Partial<FormFieldDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  title: string;
  isNew?: boolean;
  positions: PositionOption[];
  lockScope?: boolean;
}) {
  const scope = getApplyScope(draft);
  const selectedPositionKey =
    draft.positionKey ??
    (draft.positionId != null
      ? positions.find((p) => p.id === draft.positionId)?.key ?? ""
      : positions[0]?.key ?? "");

  const setScope = (next: "campaign" | "position") => {
    if (next === "campaign") {
      onChange({ positionId: null, positionKey: null });
      return;
    }
    const first = positions[0];
    if (!first) return;
    onChange({
      positionId: first.id ?? null,
      positionKey: first.id == null ? first.key : null,
    });
  };
  const usesOptions = fieldUsesOptions(draft.questionType);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  return (
    <View style={styles.editorCard}>
      <Text style={styles.editorTitle}>{title}</Text>

      <Text style={styles.fieldLabel}>Field label *</Text>
      <TextInput
        style={styles.input}
        value={draft.questionTitle}
        onChangeText={(t) => onChange({ questionTitle: t })}
        placeholder="e.g. Why do you want to join?"
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Field type *</Text>
      <Pressable
        style={styles.select}
        onPress={() => setTypePickerOpen(true)}
        disabled={saving}
      >
        <Text style={styles.selectTxt}>{fieldTypeLabel(draft.questionType)}</Text>
        <Text style={styles.chev}>▼</Text>
      </Pressable>

      <Modal visible={typePickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setTypePickerOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalH}>Field type</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {FORM_FIELD_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={styles.modalRow}
                  onPress={() => {
                    onChange({
                      questionType: t,
                      options: fieldUsesOptions(t) ? draft.options : ["", ""],
                    });
                    setTypePickerOpen(false);
                  }}
                >
                  <Text style={styles.modalRowTxt}>{fieldTypeLabel(t)}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalCancel} onPress={() => setTypePickerOpen(false)}>
              <Text style={styles.modalCancelTxt}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {!lockScope ? (
        <>
          <Text style={styles.fieldLabel}>Apply this field to *</Text>
          <View style={styles.scopeRow}>
            <Pressable
              style={[styles.scopeChip, scope === "campaign" && styles.scopeChipOn]}
              onPress={() => setScope("campaign")}
              disabled={saving}
            >
              <Text style={[styles.scopeChipTxt, scope === "campaign" && styles.scopeChipTxtOn]}>
                Entire campaign
              </Text>
            </Pressable>
            <Pressable
              style={[styles.scopeChip, scope === "position" && styles.scopeChipOn]}
              onPress={() => setScope("position")}
              disabled={saving || positions.length === 0}
            >
              <Text style={[styles.scopeChipTxt, scope === "position" && styles.scopeChipTxtOn]}>
                Specific position
              </Text>
            </Pressable>
          </View>
          {scope === "position" ? (
            <>
              <Text style={styles.fieldLabel}>Position *</Text>
              <View style={styles.scopeRow}>
                {positions.map((p) => (
                  <Pressable
                    key={p.key}
                    style={[
                      styles.scopeChip,
                      selectedPositionKey === p.key && styles.scopeChipOn,
                    ]}
                    onPress={() =>
                      onChange({
                        positionId: p.id ?? null,
                        positionKey: p.id == null ? p.key : null,
                      })
                    }
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.scopeChipTxt,
                        selectedPositionKey === p.key && styles.scopeChipTxtOn,
                      ]}
                      numberOfLines={1}
                    >
                      {p.roleTitle.trim() || "Untitled"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : (
        <Text style={styles.lockedScope}>
          Applies to: {fieldAppliesToLabel(draft, positions)}
        </Text>
      )}

      <Text style={styles.fieldLabel}>Description / help text (optional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
        value={draft.helpText}
        onChangeText={(t) => onChange({ helpText: t })}
        placeholder="Optional guidance shown below the label"
        multiline
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Placeholder (optional)</Text>
      <TextInput
        style={styles.input}
        value={draft.placeholder}
        onChangeText={(t) => onChange({ placeholder: t })}
        placeholder="Hint text inside the field"
        editable={!saving}
      />

      <View style={styles.switchRow}>
        <Text style={styles.fieldLabel}>Required field</Text>
        <Switch
          value={draft.isRequired}
          onValueChange={(v) => onChange({ isRequired: v })}
          disabled={saving}
        />
      </View>

      <Text style={styles.fieldLabel}>Display order</Text>
      <TextInput
        style={[styles.input, { maxWidth: 120 }]}
        value={String(draft.displayOrder)}
        onChangeText={(t) =>
          onChange({ displayOrder: parseInt(t.replace(/[^\d]/g, ""), 10) || 0 })
        }
        keyboardType="number-pad"
        editable={!saving}
      />

      {usesOptions ? (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={styles.fieldLabel}>Options</Text>
          {draft.options.map((opt, i) => (
            <View key={i} style={styles.optionRow}>
              <Text style={styles.optNum}>{i + 1}</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={opt}
                onChangeText={(t) => {
                  const next = [...draft.options];
                  next[i] = t;
                  onChange({ options: next });
                }}
                placeholder={`Option ${i + 1}`}
                editable={!saving}
              />
              <Pressable
                onPress={() => {
                  if (i > 0) {
                    const next = [...draft.options];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    onChange({ options: next });
                  }
                }}
                disabled={saving || i === 0}
                hitSlop={8}
              >
                <Ionicons name="chevron-up" size={18} color={assocColors.accentDark} />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (i < draft.options.length - 1) {
                    const next = [...draft.options];
                    [next[i], next[i + 1]] = [next[i + 1], next[i]];
                    onChange({ options: next });
                  }
                }}
                disabled={saving || i >= draft.options.length - 1}
                hitSlop={8}
              >
                <Ionicons name="chevron-down" size={18} color={assocColors.accentDark} />
              </Pressable>
              {draft.options.length > 2 ? (
                <Pressable
                  onPress={() => onChange({ options: draft.options.filter((_, j) => j !== i) })}
                  hitSlop={8}
                >
                  <Text style={styles.removeOpt}>×</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable
            style={styles.addOpt}
            onPress={() => onChange({ options: [...draft.options, ""] })}
            disabled={saving}
          >
            <Ionicons name="add" size={16} color={assocColors.accentDark} />
            <Text style={styles.addOptTxt}>Add option</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveTxt}>{saving ? "Saving…" : isNew ? "Add field" : "Save field"}</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
          <Text style={styles.cancelTxt}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  appliesTo: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: assocColors.muted,
  },
  scopeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  scopeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: "#fff",
  },
  scopeChipOn: {
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
  },
  scopeChipTxt: { fontSize: 12, fontWeight: "600", color: assocColors.text },
  scopeChipTxtOn: { color: assocColors.accentDark },
  lockedScope: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: assocColors.accentMuted,
    fontSize: 13,
    color: assocColors.text,
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
});
