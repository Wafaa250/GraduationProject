import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const DEFAULT_GRADIENT_COLORS = ["#6366F1", "#7C3AED", "#A855F7"] as const;

type GradientAuthButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export function GradientAuthButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
}: GradientAuthButtonProps) {
  const layout = useResponsiveLayout();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.wrap,
        {
          borderRadius: layout.radius.button,
          opacity: isDisabled ? 0.45 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <LinearGradient
        colors={[
          ...(Array.isArray(AUTH_COLORS.gradient) && AUTH_COLORS.gradient.length >= 2
            ? AUTH_COLORS.gradient
            : DEFAULT_GRADIENT_COLORS),
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.button,
          {
            minHeight: layout.touchTarget,
            borderRadius: layout.radius.button,
            paddingHorizontal: layout.space("xxl"),
          },
        ]}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={[styles.text, { fontSize: layout.fontSize.button }]}>Please wait...</Text>
          </View>
        ) : (
          <View style={styles.loadingRow}>
            <Text style={[styles.text, { fontSize: layout.fontSize.button }]}>{label}</Text>
            {icon}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
