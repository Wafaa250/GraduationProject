import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  label: string;
  value: string;
};

export function ProfileFieldRow({ label, value }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { fontSize: layout.fontSize.footer }]}>{label}</Text>
      <Text style={[styles.value, { fontSize: layout.fontSize.body }]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useHubTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      gap: 4,
      paddingVertical: 6,
    },
    label: {
      fontWeight: "600",
      color: colors.muted,
    },
    value: {
      color: colors.foreground,
      lineHeight: 20,
    },
  });
}
