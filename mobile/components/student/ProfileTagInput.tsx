import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  maxLength?: number;
};

export function ProfileTagInput({
  label,
  placeholder = "Type and press Add",
  values,
  onChange,
  maxLength = 48,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const value = draft.trim();
    if (!value) return;
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(values.filter((v) => v !== tag));
  };

  return (
    <View style={{ marginBottom: layout.space("md"), width: "100%" }}>
      <Text style={[styles.label, { fontSize: layout.fontSize.label }]}>{label}</Text>
      <View style={[styles.wrap, { gap: layout.space("sm"), marginTop: layout.space("sm") }]}>
        {values.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => removeTag(tag)}
            style={[styles.chip, { borderRadius: layout.radius.input, paddingHorizontal: layout.space("md") }]}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${tag}`}
          >
            <Text style={[styles.chipText, { fontSize: layout.fontSize.footer }]}>{tag}</Text>
            <Ionicons name="close" size={14} color={colors.primary} />
          </Pressable>
        ))}
      </View>
      <View style={[styles.row, { gap: layout.space("sm"), marginTop: layout.space("sm") }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          maxLength={maxLength}
          onSubmitEditing={addTag}
          returnKeyType="done"
          style={[
            styles.input,
            {
              flex: 1,
              minHeight: layout.touchTarget,
              borderRadius: layout.radius.input,
              paddingHorizontal: layout.space("md"),
              fontSize: layout.fontSize.body,
            },
          ]}
        />
        <Pressable
          onPress={addTag}
          style={[
            styles.addBtn,
            {
              borderRadius: layout.radius.input,
              minHeight: layout.touchTarget,
              paddingHorizontal: layout.space("lg"),
            },
          ]}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  label: {
    fontWeight: "600",
    color: colors.foreground,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 8,
  },
  chipText: {
    color: colors.primary,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    color: colors.foreground,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
