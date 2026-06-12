import { StyleSheet, Text, TextInput, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "url";
  autoCapitalize?: "none" | "sentences" | "words";
  editable?: boolean;
};

export function AssociationTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  editable = true,
}: Props) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ gap: layout.space("xs"), marginBottom: layout.space("md") }}>
      <Text style={[styles.label, { fontSize: layout.fontSize.label }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ASSOC_COLORS.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        editable={editable}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { borderRadius: layout.radius.input, fontSize: layout.fontSize.body },
          error ? styles.inputError : null,
          !editable ? styles.inputDisabled : null,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.inputBg,
    color: ASSOC_COLORS.foreground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  inputDisabled: {
    opacity: 0.75,
    backgroundColor: ASSOC_COLORS.background,
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
  },
});
