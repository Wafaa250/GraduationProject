import { Pressable, StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type AcademicYearPickerProps = {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (year: string) => void;
  error?: string;
  required?: boolean;
};

export function AcademicYearPicker({
  label,
  options,
  value,
  onChange,
  error,
  required,
}: AcademicYearPickerProps) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ marginBottom: layout.space("md") }}>
      <Text style={[styles.label, { fontSize: layout.fontSize.label, marginBottom: layout.space("sm") }]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={[styles.wrap, { gap: layout.space("sm") }]}>
        {options.map((year) => {
          const selected = value === year;
          return (
            <Pressable
              key={year}
              onPress={() => onChange(year)}
              style={[
                styles.chip,
                {
                  borderRadius: layout.radius.input,
                  paddingHorizontal: layout.space("md"),
                  paddingVertical: layout.space("md"),
                  minHeight: layout.scale(44),
                },
                selected ? styles.chipSelected : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.chipText,
                  { fontSize: layout.fontSize.footer },
                  selected ? styles.chipTextSelected : null,
                ]}
              >
                {year}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text style={[styles.error, { fontSize: layout.scale(12), marginTop: layout.space("xs") }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
  required: {
    color: "#DC2626",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  chip: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  chipSelected: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  chipText: {
    color: AUTH_COLORS.muted,
    fontWeight: "600",
    textAlign: "center",
  },
  chipTextSelected: {
    color: AUTH_COLORS.primary,
    fontWeight: "700",
  },
  error: {
    color: "#DC2626",
  },
});
