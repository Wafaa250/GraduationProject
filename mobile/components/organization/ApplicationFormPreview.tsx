import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { RecruitmentQuestion } from "@/api/organizationRecruitmentCampaignsApi";
import { defaultPlaceholder, normalizeFieldType } from "@/utils/recruitmentFormFields";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

type Props = {
  fields: RecruitmentQuestion[];
  title?: string;
  selectedFieldId?: number | null;
  onFieldPress?: (fieldId: number) => void;
  interactive?: boolean;
};

export function ApplicationFormPreview({
  fields,
  title = "Application form",
  selectedFieldId,
  onFieldPress,
  interactive,
}: Props) {
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  if (sorted.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No questions yet</Text>
        <Text style={styles.emptySub}>
          Add questions from the editor below. They will appear here exactly as students will see
          them.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <Text style={styles.formTitle}>{title}</Text>
      {!interactive ? (
        <Text style={styles.intro}>
          This is how your application will look. Fields are read-only until applications open.
        </Text>
      ) : null}
      {sorted.map((field) => (
        <PreviewField
          key={field.id}
          field={field}
          selected={interactive && selectedFieldId === field.id}
          interactive={interactive}
          onPress={onFieldPress ? () => onFieldPress(field.id) : undefined}
        />
      ))}
    </View>
  );
}

function PreviewField({
  field,
  selected,
  interactive,
  onPress,
}: {
  field: RecruitmentQuestion;
  selected?: boolean;
  interactive?: boolean;
  onPress?: () => void;
}) {
  const type = normalizeFieldType(field.questionType);
  const options = field.options?.filter((o) => o.trim()) ?? [];
  const ph = field.placeholder?.trim() || defaultPlaceholder(type);

  const blockStyle = [
    styles.block,
    interactive && styles.blockInteractive,
    interactive && selected && styles.blockSelected,
  ];

  const inner = (
    <>
      <Text style={styles.label}>
        {field.questionTitle}
        {field.isRequired ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
      </Text>
      {field.helpText?.trim() ? <Text style={styles.help}>{field.helpText.trim()}</Text> : null}
      {renderControl(type, ph, options)}
    </>
  );

  if (interactive && onPress) {
    return (
      <Pressable onPress={onPress} style={blockStyle}>
        {inner}
      </Pressable>
    );
  }

  return <View style={blockStyle}>{inner}</View>;
}

function renderControl(type: string, placeholder: string, options: string[]) {
  switch (type) {
    case "Paragraph":
      return (
        <View style={[styles.control, { minHeight: 96 }]}>
          <Text style={styles.ph}>{placeholder}</Text>
        </View>
      );
    case "MultipleChoice":
      return (
        <View style={{ gap: 8 }}>
          {options.map((opt) => (
            <View key={opt} style={styles.choice}>
              <View style={styles.radio} />
              <Text style={styles.choiceTxt}>{opt}</Text>
            </View>
          ))}
        </View>
      );
    case "CheckboxList":
      return (
        <View style={{ gap: 8 }}>
          {options.map((opt) => (
            <View key={opt} style={styles.choice}>
              <View style={styles.checkbox} />
              <Text style={styles.choiceTxt}>{opt}</Text>
            </View>
          ))}
        </View>
      );
    case "Dropdown":
      return (
        <View style={[styles.control, styles.rowBetween]}>
          <Text style={styles.ph}>{options[0] ?? "Select an option"}</Text>
          <Text style={styles.chev}>▼</Text>
        </View>
      );
    case "YesNo":
      return (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={styles.choice}>
            <View style={styles.radio} />
            <Text style={styles.choiceTxt}>Yes</Text>
          </View>
          <View style={styles.choice}>
            <View style={styles.radio} />
            <Text style={styles.choiceTxt}>No</Text>
          </View>
        </View>
      );
    case "FileUpload":
      return (
        <View style={[styles.control, styles.fileBox]}>
          <Ionicons name="cloud-upload-outline" size={24} color={assocColors.accent} />
          <Text style={[styles.ph, { marginTop: 8, textAlign: "center" }]}>{placeholder}</Text>
        </View>
      );
    case "Date":
      return (
        <View style={[styles.control, styles.rowBetween]}>
          <Text style={styles.ph}>{placeholder}</Text>
          <Ionicons name="calendar-outline" size={18} color={assocColors.muted} />
        </View>
      );
    default:
      return (
        <View style={styles.control}>
          <Text style={styles.ph}>{placeholder}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: assocColors.text,
    marginBottom: spacing.xs,
  },
  intro: {
    fontSize: 13,
    color: assocColors.muted,
    lineHeight: 18,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
  },
  block: { gap: 6 },
  blockInteractive: {
    padding: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "transparent",
  },
  blockSelected: {
    borderColor: assocColors.accent,
    backgroundColor: assocColors.accentMuted,
  },
  label: { fontSize: 14, fontWeight: "700", color: assocColors.text, lineHeight: 20 },
  help: { fontSize: 13, color: assocColors.muted, lineHeight: 18 },
  control: {
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.bg,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ph: { fontSize: 14, color: assocColors.subtle, fontWeight: "500" },
  chev: { fontSize: 12, color: assocColors.muted },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.bg,
  },
  choiceTxt: { flex: 1, fontSize: 14, color: assocColors.text },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: assocColors.border,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: assocColors.border,
  },
  fileBox: {
    alignItems: "center",
    minHeight: 100,
    borderStyle: "dashed",
    backgroundColor: assocColors.accentMuted,
  },
  empty: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: assocColors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: assocColors.muted, textAlign: "center", lineHeight: 20 },
});
