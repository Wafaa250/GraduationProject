import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { radius, spacing } from "@/constants/responsiveLayout";
import { assocColors } from "@/constants/associationTheme";

type Props = {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  subtitle?: string;
};

export function OrgScreenHeader({ title, subtitle, onBack, right }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.md) }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={assocColors.text} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <View style={styles.center}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: assocColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.bg,
    borderWidth: 1,
    borderColor: assocColors.border,
  },
  backSpacer: { width: 40 },
  pressed: { opacity: 0.88 },
  center: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: assocColors.text,
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: assocColors.muted,
  },
  right: { minWidth: 40, alignItems: "flex-end", justifyContent: "center" },
});
