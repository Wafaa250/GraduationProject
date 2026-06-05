import { Pressable, StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type SkillChipGridProps = {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  error?: string;
};

export function SkillChipGrid({ title, options, selected, onToggle, error }: SkillChipGridProps) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ marginBottom: layout.space("lg") }}>
      <Text style={[styles.title, { fontSize: layout.fontSize.label, marginBottom: layout.space("sm") }]}>
        {title}
      </Text>
      <View style={[styles.grid, { gap: layout.space("sm") }]}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <Pressable
              key={option}
              onPress={() => onToggle(option)}
              style={[
                styles.chip,
                {
                  borderRadius: layout.scale(12),
                  paddingHorizontal: layout.space("md"),
                  paddingVertical: layout.space("sm"),
                },
                isSelected ? styles.chipSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { fontSize: layout.scale(12) },
                  isSelected ? styles.chipTextSelected : null,
                ]}
                numberOfLines={2}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={[styles.error, { fontSize: layout.scale(12), marginTop: layout.space("xs") }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    maxWidth: "100%",
  },
  chipSelected: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
  },
  chipText: {
    color: AUTH_COLORS.muted,
    flexShrink: 1,
  },
  chipTextSelected: {
    color: AUTH_COLORS.primary,
    fontWeight: "600",
  },
  error: {
    color: "#DC2626",
  },
});
