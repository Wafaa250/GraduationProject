import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useHubDesign } from "@/hooks/use-hub-design";
import type { HubRoleType } from "@/constants/studentHubTheme";
import { getHubRoleAccent } from "@/lib/hubRoleAccent";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  active?: boolean;
  /** Role-specific accent (student, doctor, company, association). Defaults to student primary. */
  accent?: HubRoleType;
};

export function HubButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  active = false,
  accent = "student",
}: Props) {
  const hub = useHubDesign();
  const { colors } = hub;
  const roleAccent = getHubRoleAccent(colors, accent);
  const height = size === "sm" ? hub.button.heightSm : hub.button.height;
  const iconSize = size === "sm" ? 14 : hub.button.iconSize;

  const variantStyle =
    variant === "primary"
      ? {
          bg: roleAccent.buttonPrimary,
          border: roleAccent.buttonPrimary,
          text: roleAccent.buttonPrimaryText,
        }
      : variant === "secondary"
        ? {
            bg: active ? colors.inputBg : roleAccent.buttonSecondaryBg,
            border: active ? colors.border : roleAccent.buttonSecondaryBorder,
            text: active ? colors.muted : roleAccent.buttonSecondaryFg,
          }
        : {
            bg: colors.inputBg,
            border: colors.border,
            text: colors.foreground,
          };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          borderRadius: hub.radius.button,
          paddingHorizontal: hub.button.paddingHorizontal,
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
          opacity: pressed ? 0.88 : disabled ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          flex: fullWidth ? undefined : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? roleAccent.buttonPrimaryText : roleAccent.buttonSecondaryFg}
        />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons name={icon} size={iconSize} color={variantStyle.text} />
          ) : null}
          <Text
            style={[
              styles.label,
              {
                color: variantStyle.text,
                fontSize: size === "sm" ? 12 : hub.button.fontSize,
              },
            ]}
            numberOfLines={1}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minWidth: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontWeight: "600",
  },
});
