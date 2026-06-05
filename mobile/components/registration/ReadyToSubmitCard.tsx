import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export function ReadyToSubmitCard() {
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius.button,
          padding: layout.space("lg"),
          marginBottom: layout.space("lg"),
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Ionicons name="checkmark-circle" size={layout.iconSize} color="#10B981" />
        <Text style={[styles.title, { fontSize: layout.fontSize.label }]}>Ready to submit</Text>
      </View>
      <Text style={[styles.body, { fontSize: layout.fontSize.footer, marginTop: layout.space("sm"), lineHeight: 20 }]}>
        Select Create account to complete registration. You may update your profile at any time after signing in.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "700",
    color: AUTH_COLORS.foreground,
  },
  body: {
    color: AUTH_COLORS.muted,
  },
});
