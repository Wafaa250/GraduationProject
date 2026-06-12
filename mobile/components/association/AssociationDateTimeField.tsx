import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  createElement,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";
import {
  dateFromDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  maxDate?: Date | null;
};

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AssociationDateTimeField({
  label,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Select date and time",
  maxDate,
}: Props) {
  const layout = useResponsiveLayout();
  const [pickerOpen, setPickerOpen] = useState(false);
  const controlHeight = layout.scale(44);

  if (Platform.OS === "web") {
    const inputStyle: CSSProperties = {
      width: "100%",
      boxSizing: "border-box",
      minHeight: controlHeight,
      padding: "12px 14px",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: error ? "#DC2626" : ASSOC_COLORS.border,
      borderRadius: layout.radius.input,
      backgroundColor: disabled
        ? ASSOC_COLORS.background
        : ASSOC_COLORS.inputBg,
      color: ASSOC_COLORS.foreground,
      fontSize: layout.fontSize.body,
      fontFamily: "inherit",
      opacity: disabled ? 0.6 : 1,
      colorScheme: "light",
    };

    return (
      <View style={{ marginBottom: 12 }}>
        <Text
          style={[
            styles.fieldLabel,
            {
              fontSize: layout.fontSize.label,
              marginBottom: layout.space("xs"),
            },
          ]}
        >
          {label}
        </Text>
        {createElement("input", {
          type: "datetime-local",
          value: toDatetimeLocalValue(value),
          disabled,
          max: maxDate ? toDatetimeLocalValue(maxDate) : undefined,
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            onChange(dateFromDatetimeLocal(event.target.value));
          },
          style: inputStyle,
        })}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={() => !disabled && setPickerOpen(true)}
        disabled={disabled}
        style={[
          styles.dateField,
          { borderRadius: layout.radius.input, minHeight: controlHeight },
          error ? styles.dateFieldError : null,
          disabled ? styles.dateFieldDisabled : null,
        ]}
      >
        <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label }]}>
          {label}
        </Text>
        <Text
          style={[styles.dateValue, !value ? styles.datePlaceholder : null]}
          numberOfLines={2}
        >
          {value ? formatDateTime(value) : placeholder}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {pickerOpen ? (
        <DateTimePicker
          value={value ?? maxDate ?? new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={maxDate ?? undefined}
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            if (event.type === "dismissed" || !date) {
              setPickerOpen(false);
              return;
            }
            if (Platform.OS === "android") setPickerOpen(false);
            onChange(date);
            if (Platform.OS === "ios") setPickerOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
  },
  dateField: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.inputBg,
    justifyContent: "center",
    gap: 2,
  },
  dateFieldError: {
    borderColor: "#DC2626",
  },
  dateFieldDisabled: {
    opacity: 0.6,
  },
  dateValue: {
    color: ASSOC_COLORS.foreground,
    fontSize: 15,
    fontWeight: "500",
  },
  datePlaceholder: {
    color: ASSOC_COLORS.muted,
    fontWeight: "400",
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
  },
});
