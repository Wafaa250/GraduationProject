import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  listRecruitmentCampaignQuestions,
  type RecruitmentPositionInput,
} from "@/api/organizationRecruitmentCampaignsApi";
import { positionApplicationFormPath } from "@/components/organization/PositionApplicationFormEditor";
import { countQuestionsForPosition } from "@/utils/recruitmentFormFields";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

export type PositionDraft = RecruitmentPositionInput & { _key: string };

export function newPositionDraft(order: number): PositionDraft {
  return {
    _key: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roleTitle: "",
    neededCount: 1,
    description: "",
    requirements: "",
    requiredSkills: "",
    displayOrder: order,
  };
}

export function positionsFromCampaign(
  positions: Array<{
    id: number;
    roleTitle: string;
    neededCount: number;
    description?: string | null;
    requirements?: string | null;
    requiredSkills?: string | null;
    displayOrder: number;
  }>,
): PositionDraft[] {
  return positions.map((p) => ({
    _key: `pos-${p.id}`,
    id: p.id,
    roleTitle: p.roleTitle,
    neededCount: p.neededCount,
    description: p.description ?? "",
    requirements: p.requirements ?? "",
    requiredSkills: p.requiredSkills ?? "",
    displayOrder: p.displayOrder,
  }));
}

export function draftsToPayload(drafts: PositionDraft[]): RecruitmentPositionInput[] {
  return drafts.map((d, index) => ({
    id: d.id ?? undefined,
    roleTitle: d.roleTitle.trim(),
    neededCount: Number.isFinite(d.neededCount) && d.neededCount >= 1 ? d.neededCount : 1,
    description: d.description?.trim() || null,
    requirements: d.requirements?.trim() || null,
    requiredSkills: d.requiredSkills?.trim() || null,
    displayOrder: d.displayOrder ?? index,
  }));
}

type Props = {
  positions: PositionDraft[];
  onChange: (next: PositionDraft[]) => void;
  disabled?: boolean;
  campaignId?: number;
};

export function RecruitmentPositionsEditor({
  positions,
  onChange,
  disabled,
  campaignId,
}: Props) {
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (campaignId == null) return;
    let cancelled = false;
    void listRecruitmentCampaignQuestions(campaignId).then((questions) => {
      if (cancelled) return;
      const counts: Record<number, number> = {};
      for (const pos of positions) {
        if (pos.id != null) counts[pos.id] = countQuestionsForPosition(questions, pos.id);
      }
      setQuestionCounts(counts);
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId, positions]);

  const add = () => onChange([...positions, newPositionDraft(positions.length)]);

  const update = (key: string, patch: Partial<PositionDraft>) => {
    onChange(positions.map((p) => (p._key === key ? { ...p, ...patch } : p)));
  };

  const remove = (key: string) => {
    if (positions.length <= 1) return;
    onChange(positions.filter((p) => p._key !== key));
  };

  return (
    <View>
      <Text style={styles.heading}>Required positions</Text>
      <Text style={styles.hint}>
        Define each role, then design a dedicated application form per position.
      </Text>

      {positions.map((pos, index) => (
        <View key={pos._key} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Position {index + 1}</Text>
            {positions.length > 1 ? (
              <Pressable
                onPress={() => remove(pos._key)}
                disabled={disabled}
                style={styles.removeBtn}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
                <Text style={styles.removeTxt}>Remove</Text>
              </Pressable>
            ) : null}
          </View>

          <Field label="Role title" required>
            <TextInput
              value={pos.roleTitle}
              onChangeText={(t) => update(pos._key, { roleTitle: t })}
              placeholder="e.g. Graphic Designer, Organizer"
              placeholderTextColor={assocColors.subtle}
              style={styles.input}
              editable={!disabled}
            />
          </Field>

          <Field label="Needed count" required>
            <TextInput
              value={String(pos.neededCount)}
              onChangeText={(t) =>
                update(pos._key, {
                  neededCount: Math.max(1, parseInt(t.replace(/[^\d]/g, ""), 10) || 1),
                })
              }
              keyboardType="number-pad"
              style={styles.input}
              editable={!disabled}
            />
          </Field>

          <Field label="Description" optional>
            <TextInput
              value={pos.description ?? ""}
              onChangeText={(t) => update(pos._key, { description: t })}
              placeholder="What will this person do?"
              placeholderTextColor={assocColors.subtle}
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
              editable={!disabled}
            />
          </Field>

          <Field label="Requirements" optional>
            <TextInput
              value={pos.requirements ?? ""}
              onChangeText={(t) => update(pos._key, { requirements: t })}
              placeholder="Experience, availability, etc."
              placeholderTextColor={assocColors.subtle}
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
              editable={!disabled}
            />
          </Field>

          <Field label="Required skills" optional hint="Comma-separated">
            <TextInput
              value={pos.requiredSkills ?? ""}
              onChangeText={(t) => update(pos._key, { requiredSkills: t })}
              placeholder="Canva, Photoshop, Creativity"
              placeholderTextColor={assocColors.subtle}
              style={styles.input}
              editable={!disabled}
            />
          </Field>

          <Field label="Display order" optional>
            <TextInput
              value={String(pos.displayOrder ?? index)}
              onChangeText={(t) =>
                update(pos._key, { displayOrder: parseInt(t.replace(/[^\d]/g, ""), 10) || index })
              }
              keyboardType="number-pad"
              style={styles.input}
              editable={!disabled}
            />
          </Field>

          {campaignId != null && pos.id != null ? (
            <PositionFormLink
              campaignId={campaignId}
              positionId={pos.id}
              questionCount={questionCounts[pos.id] ?? 0}
              disabled={disabled}
            />
          ) : campaignId != null ? (
            <Text style={styles.formHint}>
              Save the campaign first, then return to design this position&apos;s application form.
            </Text>
          ) : null}
        </View>
      ))}

      <Pressable onPress={add} disabled={disabled} style={styles.addBtn}>
        <Ionicons name="add-circle-outline" size={20} color={assocColors.accentDark} />
        <Text style={styles.addTxt}>Add position</Text>
      </Pressable>
    </View>
  );
}

function PositionFormLink({
  campaignId,
  positionId,
  questionCount,
  disabled,
}: {
  campaignId: number;
  positionId: number;
  questionCount: number;
  disabled?: boolean;
}) {
  const hasForm = questionCount > 0;
  const label = hasForm ? "Edit application form" : "Create application form";
  const meta = hasForm
    ? `${questionCount} question${questionCount === 1 ? "" : "s"}`
    : "No questions yet";

  return (
    <View style={styles.formLinkWrap}>
      <Pressable
        onPress={() => router.push(positionApplicationFormPath(campaignId, positionId))}
        disabled={disabled}
        style={[styles.formLinkBtn, disabled && { opacity: 0.6 }]}
      >
        <Ionicons name="clipboard-outline" size={20} color={assocColors.accentDark} />
        <Text style={styles.formLinkTxt}>{label}</Text>
      </Pressable>
      <Text style={styles.formLinkMeta}>{meta}</Text>
    </View>
  );
}

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <View style={{ height: spacing.sm }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontWeight: "800", color: assocColors.text, marginBottom: 4 },
  hint: {
    fontSize: 13,
    color: assocColors.muted,
    lineHeight: 18,
    marginBottom: spacing.md,
    fontWeight: "500",
  },
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 13, fontWeight: "900", color: assocColors.accentDark },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  removeTxt: { fontSize: 12, fontWeight: "700", color: "#dc2626" },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: assocColors.text },
  optional: { fontWeight: "500", color: assocColors.muted },
  fieldHint: { fontSize: 11, color: assocColors.muted, marginTop: 2 },
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
  textArea: { minHeight: 88 },
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
  formLinkWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
    borderStyle: "dashed",
    gap: 6,
  },
  formLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
  },
  formLinkTxt: { fontSize: 14, fontWeight: "800", color: assocColors.accentDark },
  formLinkMeta: { fontSize: 12, fontWeight: "600", color: assocColors.muted, textAlign: "center" },
  formHint: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
    fontSize: 12,
    color: assocColors.muted,
    lineHeight: 18,
  },
});
