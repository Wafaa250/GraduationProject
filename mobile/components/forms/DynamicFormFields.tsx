import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Picker } from "@react-native-picker/picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { MobileUploadFile } from "@/api/mobileUpload";
import { HUB_COLORS } from "@/constants/studentHubTheme";

export type FormFieldDefinition = {
  id: number;
  label: string;
  type: string;
  placeholder?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  options?: string[] | null;
  displayOrder?: number;
};

export type FormFieldValue = {
  value: string;
  values: string[];
};

export type FormFieldsValueMap = Record<number, FormFieldValue>;

type Props = {
  fields: FormFieldDefinition[];
  values: FormFieldsValueMap;
  onChange: (fieldId: number, patch: Partial<FormFieldValue>) => void;
  normalizeType: (type: string) => string;
  fieldUsesOptions: (type: string) => boolean;
  /** Recruitment uses radio for MultipleChoice; events use picker (web select). */
  multipleChoiceStyle?: "radio" | "select";
  onFileUpload?: (fieldId: number, file: MobileUploadFile) => Promise<string>;
  fileUploadingId?: number | null;
  disabled?: boolean;
};

function emptyFieldValue(): FormFieldValue {
  return { value: "", values: [] };
}

function formatDateLabel(value: string): string {
  if (!value.trim()) return "Select a date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildEmptyFormValues(fields: FormFieldDefinition[]): FormFieldsValueMap {
  const map: FormFieldsValueMap = {};
  for (const field of fields) {
    map[field.id] = emptyFieldValue();
  }
  return map;
}

export function DynamicFormFields({
  fields,
  values,
  onChange,
  normalizeType,
  fieldUsesOptions,
  multipleChoiceStyle = "select",
  onFileUpload,
  fileUploadingId = null,
  disabled = false,
}: Props) {
  const sorted = useMemo(
    () =>
      [...fields].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id - b.id,
      ),
    [fields],
  );
  const [datePickerFieldId, setDatePickerFieldId] = useState<number | null>(null);

  const updateText = (fieldId: number, value: string) => {
    onChange(fieldId, { value, values: values[fieldId]?.values ?? [] });
  };

  const updateChoice = (fieldId: number, value: string) => {
    onChange(fieldId, { value, values: [] });
  };

  const toggleCheckbox = (fieldId: number, option: string, checked: boolean) => {
    const current = values[fieldId]?.values ?? [];
    const next = checked ? [...current, option] : current.filter((v) => v !== option);
    onChange(fieldId, { value: "", values: next });
  };

  const pickFile = async (fieldId: number) => {
    if (!onFileUpload || disabled) return;
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const file: MobileUploadFile = {
      uri: asset.uri,
      name: asset.name ?? `file-${Date.now()}`,
      mimeType: asset.mimeType ?? "application/octet-stream",
    };
    try {
      const fileUrl = await onFileUpload(fieldId, file);
      updateText(fieldId, fileUrl);
    } catch {
      // Caller surfaces upload errors.
    }
  };

  return (
    <>
      {sorted.map((field) => {
        const type = normalizeType(field.type);
        const draft = values[field.id] ?? emptyFieldValue();
        const options = field.options?.filter((o) => o.trim()) ?? [];
        const label = (
          <Text style={styles.label}>
            {field.label}
            {field.isRequired ? <Text style={styles.required}> *</Text> : null}
          </Text>
        );

        if (type === "Paragraph") {
          return (
            <View key={field.id} style={styles.field}>
              {label}
              <TextInput
                value={draft.value}
                onChangeText={(text) => updateText(field.id, text)}
                placeholder={field.placeholder ?? undefined}
                placeholderTextColor={HUB_COLORS.muted}
                multiline
                textAlignVertical="top"
                editable={!disabled}
                style={[styles.input, styles.textarea]}
              />
              {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
            </View>
          );
        }

        if (type === "CheckboxList" && options.length > 0) {
          return (
            <View key={field.id} style={styles.field}>
              {label}
              <View style={styles.choiceGroup}>
                {options.map((opt) => {
                  const checked = draft.values.includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      style={styles.choiceRow}
                      onPress={() => !disabled && toggleCheckbox(field.id, opt, !checked)}
                      disabled={disabled}
                    >
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={20}
                        color={checked ? HUB_COLORS.primary : HUB_COLORS.muted}
                      />
                      <Text style={styles.choiceLabel}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
            </View>
          );
        }

        if (type === "MultipleChoice" && options.length > 0 && multipleChoiceStyle === "radio") {
          return (
            <View key={field.id} style={styles.field}>
              {label}
              <View style={styles.choiceGroup}>
                {options.map((opt) => {
                  const selected = draft.value === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={styles.choiceRow}
                      onPress={() => !disabled && updateChoice(field.id, opt)}
                      disabled={disabled}
                    >
                      <Ionicons
                        name={selected ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={selected ? HUB_COLORS.primary : HUB_COLORS.muted}
                      />
                      <Text style={styles.choiceLabel}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
            </View>
          );
        }

        if (fieldUsesOptions(type) && options.length > 0) {
          return (
            <View key={field.id} style={styles.field}>
              {label}
              <View style={styles.pickerShell}>
                <Picker
                  selectedValue={draft.value}
                  onValueChange={(itemValue) => updateChoice(field.id, String(itemValue))}
                  enabled={!disabled}
                  mode={Platform.OS === "android" ? "dropdown" : undefined}
                  style={styles.picker}
                  dropdownIconColor={HUB_COLORS.muted}
                >
                  <Picker.Item label="Select an option" value="" color={HUB_COLORS.muted} />
                  {options.map((opt) => (
                    <Picker.Item key={opt} label={opt} value={opt} color={HUB_COLORS.foreground} />
                  ))}
                </Picker>
              </View>
              {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
            </View>
          );
        }

        if (type === "YesNo") {
          return (
            <View key={field.id} style={styles.field}>
              {label}
              <View style={styles.pickerShell}>
                <Picker
                  selectedValue={draft.value}
                  onValueChange={(itemValue) => updateChoice(field.id, String(itemValue))}
                  enabled={!disabled}
                  mode={Platform.OS === "android" ? "dropdown" : undefined}
                  style={styles.picker}
                  dropdownIconColor={HUB_COLORS.muted}
                >
                  <Picker.Item label="Select" value="" color={HUB_COLORS.muted} />
                  <Picker.Item label="Yes" value="Yes" color={HUB_COLORS.foreground} />
                  <Picker.Item label="No" value="No" color={HUB_COLORS.foreground} />
                </Picker>
              </View>
              {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
            </View>
          );
        }

        if (type === "FileUpload" && onFileUpload) {
          const uploading = fileUploadingId === field.id;
          const fileName = draft.value ? draft.value.split("/").pop() ?? "Uploaded file" : null;
          return (
            <View key={field.id} style={styles.field}>
              {label}
              <Pressable
                style={[styles.fileBox, disabled && styles.disabled]}
                onPress={() => void pickFile(field.id)}
                disabled={disabled || uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={HUB_COLORS.primary} />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={24} color={HUB_COLORS.primary} />
                )}
                <Text style={styles.fileBoxTitle}>
                  {fileName ?? field.placeholder ?? "Tap to upload a file"}
                </Text>
                {fileName ? (
                  <Text style={styles.fileBoxSub} numberOfLines={1}>
                    {draft.value}
                  </Text>
                ) : null}
              </Pressable>
              {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
            </View>
          );
        }

        if (type === "FileUploadPlaceholder") {
          return (
            <View key={field.id} style={styles.field}>
              {label}
              <View style={[styles.fileBox, styles.fileBoxDisabled]}>
                <Ionicons name="document-outline" size={24} color={HUB_COLORS.muted} />
                <Text style={styles.fileBoxTitle}>
                  {field.placeholder ?? "Upload will be available when registration opens"}
                </Text>
              </View>
              {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
            </View>
          );
        }

        if (type === "Date") {
          const showPicker = datePickerFieldId === field.id;
          return (
            <View key={field.id} style={styles.field}>
              {label}
              <Pressable
                style={[styles.input, styles.dateButton, disabled && styles.disabled]}
                onPress={() => !disabled && setDatePickerFieldId(field.id)}
                disabled={disabled}
              >
                <Text style={styles.dateText}>{formatDateLabel(draft.value)}</Text>
                <Ionicons name="calendar-outline" size={18} color={HUB_COLORS.muted} />
              </Pressable>
              {showPicker ? (
                <DateTimePicker
                  value={draft.value ? new Date(draft.value) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    if (Platform.OS === "android") setDatePickerFieldId(null);
                    if (event.type === "dismissed" || !date) {
                      if (Platform.OS === "ios") setDatePickerFieldId(null);
                      return;
                    }
                    updateText(field.id, toIsoDate(date));
                    if (Platform.OS === "ios") setDatePickerFieldId(null);
                  }}
                />
              ) : null}
              {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
            </View>
          );
        }

        const keyboardType =
          type === "Email"
            ? "email-address"
            : type === "Number"
              ? "decimal-pad"
              : type === "Phone"
                ? "phone-pad"
                : "default";

        return (
          <View key={field.id} style={styles.field}>
            {label}
            <TextInput
              value={draft.value}
              onChangeText={(text) => updateText(field.id, text)}
              placeholder={field.placeholder ?? undefined}
              placeholderTextColor={HUB_COLORS.muted}
              keyboardType={keyboardType}
              autoCapitalize={type === "Email" ? "none" : "sentences"}
              autoCorrect={type !== "Email" && type !== "Url"}
              editable={!disabled}
              style={styles.input}
            />
            {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6, marginBottom: 14 },
  label: { fontWeight: "600", color: HUB_COLORS.foreground, fontSize: 14 },
  required: { color: HUB_COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: HUB_COLORS.foreground,
    backgroundColor: HUB_COLORS.inputBg,
    fontSize: 15,
  },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  help: { fontSize: 12, color: HUB_COLORS.muted, lineHeight: 18 },
  choiceGroup: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    backgroundColor: HUB_COLORS.inputBg,
  },
  choiceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  choiceLabel: { color: HUB_COLORS.foreground, fontSize: 14, flex: 1 },
  pickerShell: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: HUB_COLORS.inputBg,
  },
  picker: { color: HUB_COLORS.foreground },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: { color: HUB_COLORS.foreground, fontSize: 15 },
  fileBox: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 8,
    borderStyle: "dashed",
    padding: 16,
    alignItems: "center",
    gap: 8,
    backgroundColor: HUB_COLORS.inputBg,
  },
  fileBoxDisabled: { opacity: 0.85 },
  fileBoxTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: HUB_COLORS.muted,
    textAlign: "center",
  },
  fileBoxSub: { fontSize: 11, color: HUB_COLORS.muted, maxWidth: "100%" },
  disabled: { opacity: 0.6 },
});
