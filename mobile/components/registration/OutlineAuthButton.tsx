import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type OutlineAuthButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function OutlineAuthButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: OutlineAuthButtonProps) {
  const layout = useResponsiveLayout();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: layout.radius.button,
          minHeight: layout.touchTarget,
          opacity: isDisabled ? 0.45 : pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
      ) : (
        <Text style={[styles.text, { fontSize: layout.fontSize.button }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    paddingHorizontal: 20,
  },
  text: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
});
