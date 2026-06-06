import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export function AssociationVerifiedBadge() {
  const layout = useResponsiveLayout();

  return (
    <View style={[styles.badge, { borderRadius: 999, paddingHorizontal: layout.space("md") }]}>
      <Ionicons name="checkmark-circle" size={14} color={ASSOC_COLORS.success} />
      <Text style={[styles.text, { fontSize: layout.fontSize.footer }]}>Verified Organization</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ASSOC_COLORS.successMuted,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.successBorder,
    paddingVertical: 6,
  },
  text: {
    color: ASSOC_COLORS.success,
    fontWeight: "700",
  },
});
