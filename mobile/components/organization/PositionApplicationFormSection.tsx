import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { LocalFormField, PositionOption } from "@/utils/recruitmentFormFields";
import { RecruitmentApplicationFormBuilder } from "@/components/organization/RecruitmentApplicationFormBuilder";
import { RecruitmentApplicationFormBuilderDraft } from "@/components/organization/RecruitmentApplicationFormBuilderDraft";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

type Props = {
  positionTitle: string;
  positionKey: string;
  positionId?: number;
  positions: PositionOption[];
  disabled?: boolean;
  campaignId?: number;
  formFields?: LocalFormField[];
  onFormFieldsChange?: (fields: LocalFormField[]) => void;
  onFormEditingChange?: (editing: boolean) => void;
};

export function PositionApplicationFormSection({
  positionTitle,
  positionKey,
  positionId,
  positions,
  disabled,
  campaignId,
  formFields,
  onFormFieldsChange,
  onFormEditingChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const scope = {
    type: "position" as const,
    positionTitle: positionTitle.trim() || "This position",
    positionId,
    positionKey: positionId == null ? positionKey : undefined,
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        disabled={disabled}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={18} color={assocColors.accentDark} />
        <Text style={styles.toggleText}>Position application form</Text>
      </Pressable>

      {open ? (
        <View style={styles.body}>
          {campaignId != null ? (
            <RecruitmentApplicationFormBuilder
              campaignId={campaignId}
              scope={scope}
              positions={positions}
              compact
            />
          ) : formFields && onFormFieldsChange ? (
            <RecruitmentApplicationFormBuilderDraft
              fields={formFields}
              onChange={onFormFieldsChange}
              onEditingChange={onFormEditingChange}
              disabled={disabled}
              scope={scope}
              positions={positions}
              compact
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
  },
  pressed: { opacity: 0.85 },
  toggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: assocColors.accentDark,
  },
  body: { marginTop: spacing.sm },
});
