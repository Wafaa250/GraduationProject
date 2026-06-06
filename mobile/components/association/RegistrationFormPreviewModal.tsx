import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import type { EventRegistrationField, EventRegistrationForm } from "@/api/eventRegistrationFormApi";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  visible: boolean;
  form: EventRegistrationForm | null;
  eventTitle?: string;
  onClose: () => void;
};

function fieldPlaceholder(field: EventRegistrationField): string {
  return field.placeholder?.trim() || field.label;
}

export function RegistrationFormPreviewModal({ visible, form, eventTitle, onClose }: Props) {
  const layout = useResponsiveLayout();
  const fields = form?.fields.slice().sort((a, b) => a.displayOrder - b.displayOrder) ?? [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={[styles.header, { paddingHorizontal: layout.horizontalPadding }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Preview form</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {form?.title ?? "Registration form"}
              {eventTitle ? ` · ${eventTitle}` : ""}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close preview">
            <X size={22} color={ASSOC_COLORS.foreground} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: layout.space("xl"),
            gap: layout.space("md"),
          }}
        >
          <View style={[associationCardStyles.card, associationCardStyles.cardCompact]}>
            <Text style={styles.previewNote}>
              This is how students will see the registration form.
            </Text>
            {form?.description?.trim() ? (
              <Text style={styles.description}>{form.description.trim()}</Text>
            ) : null}
          </View>

          {fields.length === 0 ? (
            <Text style={styles.empty}>No questions added yet.</Text>
          ) : (
            fields.map((field) => (
              <View key={field.id} style={[associationCardStyles.card, associationCardStyles.cardCompact]}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.isRequired ? <Text style={styles.required}> *</Text> : null}
                </Text>
                {field.helpText?.trim() ? (
                  <Text style={styles.helpText}>{field.helpText.trim()}</Text>
                ) : null}
                <PreviewControl field={field} />
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function PreviewControl({ field }: { field: EventRegistrationField }) {
  if (field.fieldType === "Paragraph") {
    return (
      <TextInput
        editable={false}
        multiline
        placeholder={fieldPlaceholder(field)}
        placeholderTextColor={ASSOC_COLORS.muted}
        style={[styles.input, styles.inputMultiline]}
      />
    );
  }

  if (field.fieldType === "YesNo") {
    return (
      <View style={styles.yesNoRow}>
        <Text style={styles.yesNoChip}>Yes</Text>
        <Text style={styles.yesNoChip}>No</Text>
      </View>
    );
  }

  if (field.fieldType === "Dropdown") {
    return (
      <View style={styles.selectMock}>
        <Text style={styles.selectMockText}>
          {field.options?.[0] ?? "Select an option"}
        </Text>
      </View>
    );
  }

  if (field.fieldType === "MultipleChoice") {
    return (
      <View style={styles.choiceRow}>
        {(field.options?.length ? field.options : ["Option 1", "Option 2"]).map((opt) => (
          <Text key={opt} style={styles.choiceChip}>
            ○ {opt}
          </Text>
        ))}
      </View>
    );
  }

  if (field.fieldType === "CheckboxList") {
    return (
      <View style={styles.choiceRow}>
        {(field.options?.length ? field.options : ["Option 1", "Option 2"]).map((opt) => (
          <Text key={opt} style={styles.choiceChip}>
            ☐ {opt}
          </Text>
        ))}
      </View>
    );
  }

  if (field.fieldType === "FileUploadPlaceholder" || field.fieldType === "FileUpload") {
    return (
      <View style={styles.fileMock}>
        <Text style={styles.selectMockText}>Choose file (available when registration opens)</Text>
      </View>
    );
  }

  if (field.fieldType === "Date") {
    return (
      <View style={styles.selectMock}>
        <Text style={styles.selectMockText}>Select a date</Text>
      </View>
    );
  }

  if (field.fieldType === "Url") {
    return (
      <TextInput
        editable={false}
        placeholder="https://…"
        placeholderTextColor={ASSOC_COLORS.muted}
        style={styles.input}
      />
    );
  }

  if (field.fieldType === "Phone") {
    return (
      <TextInput
        editable={false}
        placeholder="+1 (555) 000-0000"
        placeholderTextColor={ASSOC_COLORS.muted}
        style={styles.input}
      />
    );
  }

  return (
    <TextInput
      editable={false}
      placeholder={fieldPlaceholder(field)}
      placeholderTextColor={ASSOC_COLORS.muted}
      keyboardType={field.fieldType === "Email" ? "email-address" : field.fieldType === "Number" ? "numeric" : "default"}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ASSOC_COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.cardBg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
  },
  headerSub: {
    fontSize: 13,
    color: ASSOC_COLORS.muted,
    marginTop: 2,
  },
  previewNote: {
    fontSize: 13,
    color: ASSOC_COLORS.muted,
    lineHeight: 18,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: ASSOC_COLORS.foreground,
  },
  empty: {
    fontSize: 14,
    color: ASSOC_COLORS.muted,
    textAlign: "center",
    paddingVertical: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
    marginBottom: 8,
  },
  required: {
    color: "#DC2626",
  },
  helpText: {
    fontSize: 12,
    color: ASSOC_COLORS.muted,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    borderRadius: 10,
    backgroundColor: ASSOC_COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: ASSOC_COLORS.foreground,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  yesNoRow: {
    flexDirection: "row",
    gap: 8,
  },
  yesNoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.cardBg,
    fontSize: 13,
    fontWeight: "600",
    color: ASSOC_COLORS.muted,
  },
  selectMock: {
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    borderRadius: 10,
    backgroundColor: ASSOC_COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectMockText: {
    fontSize: 14,
    color: ASSOC_COLORS.muted,
  },
  choiceRow: {
    gap: 6,
  },
  choiceChip: {
    fontSize: 13,
    color: ASSOC_COLORS.muted,
    paddingVertical: 4,
  },
  fileMock: {
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    borderRadius: 10,
    borderStyle: "dashed",
    backgroundColor: ASSOC_COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
});
