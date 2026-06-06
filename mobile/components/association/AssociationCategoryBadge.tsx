import { StyleSheet, Text, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  category: string;
};

export function AssociationCategoryBadge({ category }: Props) {
  const layout = useResponsiveLayout();

  return (
    <View style={[styles.badge, { borderRadius: layout.radius.input, paddingHorizontal: layout.space("md") }]}>
      <Text style={[styles.text, { fontSize: layout.fontSize.footer }]}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: ASSOC_COLORS.accentMuted,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
    paddingVertical: 6,
  },
  text: {
    color: ASSOC_COLORS.accentDark,
    fontWeight: "700",
  },
});
