import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  items: string[];
  emptyLabel?: string;
};

export function ChipList({ items, emptyLabel = "None listed" }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!items.length) {
    return <Text style={[styles.empty, { fontSize: layout.fontSize.body }]}>{emptyLabel}</Text>;
  }

  return (
    <View style={[styles.wrap, { gap: layout.space("sm") }]}>
      {items.map((item) => (
        <View
          key={item}
          style={[
            styles.chip,
            {
              borderRadius: layout.radius.input,
              paddingHorizontal: layout.space("md"),
              paddingVertical: layout.space("xs") + 2,
            },
          ]}
        >
          <Text style={[styles.chipText, { fontSize: layout.fontSize.footer }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useHubTheme>["colors"]) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      width: "100%",
    },
    chip: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    chipText: {
      color: colors.primary,
      fontWeight: "600",
    },
    empty: {
      color: colors.muted,
    },
  });
}
