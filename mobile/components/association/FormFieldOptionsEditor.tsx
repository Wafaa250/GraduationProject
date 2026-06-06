import { Pressable, StyleSheet, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";

import { AssociationTextField } from "@/components/association/AssociationTextField";
import { ASSOC_COLORS } from "@/constants/associationTheme";

type Props = {
  options: string[];
  onChange: (options: string[]) => void;
  label?: string;
};

export function FormFieldOptionsEditor({ options, onChange, label = "Options" }: Props) {
  const updateOption = (index: number, value: string) => {
    onChange(options.map((opt, i) => (i === index ? value : opt)));
  };

  const addOption = () => onChange([...options, ""]);

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>Add at least two choices for this field type.</Text>
      {options.map((option, index) => (
        <View key={index} style={styles.row}>
          <View style={{ flex: 1 }}>
            <AssociationTextField
              label={`Option ${index + 1}`}
              value={option}
              onChangeText={(value) => updateOption(index, value)}
              placeholder={`Choice ${index + 1}`}
            />
          </View>
          {options.length > 2 ? (
            <Pressable onPress={() => removeOption(index)} hitSlop={8} style={styles.removeBtn}>
              <Minus size={16} color="#DC2626" strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>
      ))}
      <Pressable onPress={addOption} style={styles.addBtn}>
        <Plus size={14} color={ASSOC_COLORS.accentDark} strokeWidth={2.5} />
        <Text style={styles.addText}>Add option</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 4 },
  label: { fontWeight: "700", color: ASSOC_COLORS.foreground, fontSize: 14 },
  hint: { color: ASSOC_COLORS.muted, fontSize: 12, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  addText: { color: ASSOC_COLORS.accentDark, fontWeight: "700", fontSize: 13 },
});
