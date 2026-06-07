import { StyleSheet, Text, View } from "react-native";

import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { supervisionStatusUi } from "@/lib/supervisionRequestUi";

type Props = {
  status: string;
  compact?: boolean;
};

export function SupervisionStatusBadge({ status, compact }: Props) {
  const layout = useResponsiveLayout();
  const ui = supervisionStatusUi(status);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: ui.bg,
          borderColor: ui.border,
          paddingHorizontal: compact ? layout.space("xs") + 2 : layout.space("sm"),
          paddingVertical: compact ? 3 : layout.space("xs"),
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: ui.dot }]} />
      <Text
        style={[
          styles.label,
          { color: ui.text, fontSize: compact ? layout.scale(10) : layout.scale(11) },
        ]}
        numberOfLines={1}
      >
        {ui.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontWeight: "700",
  },
});
