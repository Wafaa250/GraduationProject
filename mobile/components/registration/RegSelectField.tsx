import { Platform, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type RegSelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[] | string[];
  placeholder?: string;
  error?: string;
};

export function RegSelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  error,
}: RegSelectFieldProps) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ gap: layout.space("xs"), marginBottom: layout.space("md") }}>
      <Text style={[styles.label, { fontSize: layout.fontSize.label }]}>{label}</Text>
      <View
        style={[
          styles.shell,
          {
            borderRadius: layout.radius.input,
            minHeight: layout.touchTarget,
          },
          error ? styles.shellError : null,
        ]}
      >
        <Picker
          selectedValue={value || ""}
          onValueChange={(itemValue) => onValueChange(String(itemValue))}
          style={[
            styles.picker,
            {
              height: Platform.OS === "ios" ? layout.touchTarget : layout.touchTarget,
            },
          ]}
          dropdownIconColor={AUTH_COLORS.muted}
        >
          <Picker.Item label={placeholder} value="" color={AUTH_COLORS.muted} />
          {options.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
      {error ? <Text style={[styles.error, { fontSize: layout.scale(12) }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
  shell: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    overflow: "hidden",
    justifyContent: "center",
  },
  shellError: {
    borderColor: "#FCA5A5",
  },
  picker: {
    width: "100%",
    color: AUTH_COLORS.foreground,
  },
  error: {
    color: "#DC2626",
  },
});
