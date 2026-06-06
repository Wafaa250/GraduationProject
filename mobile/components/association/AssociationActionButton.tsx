import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  icon?: ReactNode;
};

export function AssociationActionButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  compact = false,
  icon,
}: Props) {
  const layout = useResponsiveLayout();

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      disabled={disabled || loading}
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "outline" && styles.outline,
        variant === "danger" && styles.danger,
        compact && styles.compact,
        { borderRadius: layout.radius.input, opacity: disabled || loading ? 0.6 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "outline" ? ASSOC_COLORS.accentDark : "#FFFFFF"} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.label,
              variant === "outline" && styles.labelOutline,
              variant === "danger" && styles.labelDanger,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  compact: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primary: {
    backgroundColor: ASSOC_COLORS.accent,
  },
  outline: {
    backgroundColor: ASSOC_COLORS.accentMuted,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  danger: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  labelOutline: {
    color: ASSOC_COLORS.accentDark,
  },
  labelDanger: {
    color: "#B91C1C",
  },
});
