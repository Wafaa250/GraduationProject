import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type AccountTypeCardProps = {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AccountTypeCard({
  title,
  description,
  icon,
  selected,
  onPress,
  style,
}: AccountTypeCardProps) {
  const layout = useResponsiveLayout();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        {
          borderRadius: layout.radius.input,
          padding: layout.space("md"),
          minHeight: layout.scale(148),
        },
        selected ? styles.cardSelected : null,
        pressed ? styles.cardPressed : null,
        style,
      ]}
    >
      <View
        style={[
          styles.checkBadge,
          {
            width: layout.scale(22),
            height: layout.scale(22),
            borderRadius: layout.scale(11),
            top: layout.space("sm"),
            right: layout.space("sm"),
          },
          selected ? styles.checkBadgeSelected : null,
        ]}
      >
        {selected ? (
          <Ionicons name="checkmark" size={layout.scale(13)} color="#FFFFFF" />
        ) : null}
      </View>

      <View
        style={[
          styles.iconTile,
          {
            width: layout.scale(40),
            height: layout.scale(40),
            borderRadius: layout.scale(12),
            marginBottom: layout.space("sm"),
          },
          selected ? styles.iconTileSelected : null,
        ]}
      >
        <Ionicons
          name={icon}
          size={layout.scale(20)}
          color={AUTH_COLORS.primary}
        />
      </View>

      <Text
        style={[styles.title, { fontSize: layout.scale(14) }]}
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          {
            fontSize: layout.scale(12),
            lineHeight: layout.scale(12) * 1.45,
            marginTop: layout.space("xs"),
          },
        ]}
        maxFontSizeMultiplier={1.2}
      >
        {description}
      </Text>

      <Text
        style={[
          styles.cta,
          {
            fontSize: layout.scale(12),
            marginTop: layout.space("sm"),
          },
          selected ? styles.ctaSelected : null,
        ]}
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
      >
        {selected ? "Selected" : "Choose"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: AUTH_COLORS.cardBg,
    borderWidth: 2,
    borderColor: AUTH_COLORS.border,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardSelected: {
    borderColor: AUTH_COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  checkBadge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
  },
  checkBadgeSelected: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: AUTH_COLORS.primary,
  },
  iconTile: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  iconTileSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.16)",
  },
  title: {
    fontWeight: "700",
    color: AUTH_COLORS.foreground,
    flexShrink: 1,
  },
  description: {
    color: AUTH_COLORS.muted,
    flexShrink: 1,
    flex: 1,
  },
  cta: {
    fontWeight: "600",
    color: AUTH_COLORS.muted,
  },
  ctaSelected: {
    color: AUTH_COLORS.link,
  },
});
