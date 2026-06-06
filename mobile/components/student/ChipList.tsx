import { StyleSheet, Text, View } from "react-native";

import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  items: string[];
  emptyLabel?: string;
};

export function ChipList({ items, emptyLabel = "None listed" }: Props) {
  const layout = useResponsiveLayout();

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

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  chip: {
    backgroundColor: HUB_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: HUB_COLORS.primaryBorder,
  },
  chipText: {
    color: HUB_COLORS.primary,
    fontWeight: "600",
  },
  empty: {
    color: HUB_COLORS.muted,
  },
});
