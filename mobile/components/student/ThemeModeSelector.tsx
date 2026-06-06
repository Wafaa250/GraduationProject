import { Pressable, StyleSheet, Text, View } from "react-native";

import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import type { ThemeMode } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "light", label: "Light Mode" },
  { mode: "dark", label: "Dark Mode" },
  { mode: "system", label: "System Default" },
];

export function ThemeModeSelector() {
  const layout = useResponsiveLayout();
  const { colors, themeMode, setThemeMode } = useHubTheme();

  return (
    <View style={{ gap: layout.space("sm") }}>
      {OPTIONS.map((option) => {
        const selected = themeMode === option.mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => void setThemeMode(option.mode)}
            style={[
              styles.row,
              {
                borderRadius: layout.radius.input,
                paddingVertical: layout.space("md"),
                paddingHorizontal: layout.space("md"),
                borderColor: selected ? colors.primaryBorder : colors.border,
                backgroundColor: selected ? colors.primarySoft : colors.inputBg,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              {selected ? (
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                {
                  fontSize: layout.fontSize.body,
                  color: selected ? colors.primary : colors.foreground,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontWeight: "600",
  },
});
