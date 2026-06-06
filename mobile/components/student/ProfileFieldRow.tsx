import { StyleSheet, Text, View } from "react-native";

import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  label: string;
  value: string;
};

export function ProfileFieldRow({ label, value }: Props) {
  const layout = useResponsiveLayout();

  return (
    <View style={[styles.row, { paddingVertical: layout.space("xs") }]}>
      <Text style={[styles.label, { fontSize: layout.fontSize.footer }]}>{label}</Text>
      <Text style={[styles.value, { fontSize: layout.fontSize.body }]}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    gap: 2,
  },
  label: {
    color: HUB_COLORS.muted,
    fontWeight: "600",
  },
  value: {
    color: HUB_COLORS.foreground,
    lineHeight: 22,
  },
});
