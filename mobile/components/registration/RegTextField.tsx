import { StyleSheet, Text, TextInput, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type RegTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "url";
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
};

export function RegTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
}: RegTextFieldProps) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ gap: layout.space("xs"), marginBottom: layout.space("md") }}>
      <Text style={[styles.label, { fontSize: layout.fontSize.label }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            minHeight: multiline ? layout.scale(96) : layout.touchTarget,
            borderRadius: layout.radius.input,
            paddingHorizontal: layout.space("lg"),
            fontSize: layout.fontSize.body,
          },
          error ? styles.inputError : null,
        ]}
      />
      {error ? (
        <Text style={[styles.error, { fontSize: layout.scale(12) }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    color: AUTH_COLORS.foreground,
    width: "100%",
  },
  multiline: {
    textAlignVertical: "top",
    paddingTop: 12,
  },
  inputError: {
    borderColor: "#FCA5A5",
  },
  error: {
    color: "#DC2626",
  },
});
