import { StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export function DoctorOnboardingBadge() {
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.badge,
        {
          borderRadius: layout.scale(20),
          paddingHorizontal: layout.space("md"),
          paddingVertical: layout.space("sm"),
          marginBottom: layout.space("md"),
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: layout.scale(12) }]}>Doctor onboarding</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "center",
    backgroundColor: AUTH_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: AUTH_COLORS.primaryBorder,
  },
  text: {
    color: AUTH_COLORS.primary,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
