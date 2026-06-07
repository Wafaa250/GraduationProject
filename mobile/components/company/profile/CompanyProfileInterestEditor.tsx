import { X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { createCompanyProfileStyles } from "@/components/company/profile/companyProfileStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (tag: string) => void;
};

export function CompanyProfileInterestEditor({ values, onAdd, onRemove }: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);
  const [draft, setDraft] = useState("");

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  };

  return (
    <View>
      <Text style={styles.fieldLabel}>Areas of interest</Text>
      {values.length > 0 ? (
        <View style={[styles.chipWrap, { marginBottom: 12 }]}>
          {values.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => onRemove(tag)}
              style={({ pressed }) => [
                styles.chip,
                { flexDirection: "row", alignItems: "center", gap: 6, opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${tag}`}
            >
              <Text style={styles.chipText}>{tag}</Text>
              <X size={12} color={colors.accentInk} strokeWidth={2.5} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyText, { marginBottom: 12 }]}>No focus areas yet. Add one below.</Text>
      )}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Add an area of interest"
        placeholderTextColor={colors.muted}
        returnKeyType="done"
        onSubmitEditing={commitDraft}
        onBlur={commitDraft}
        style={styles.fieldInput}
      />
    </View>
  );
}
