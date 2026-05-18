import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { companyColors } from "@/constants/companyTheme";
import { spacing } from "@/constants/responsiveLayout";

export function CompanyScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

export function CompanyBackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.back}>
      <Text style={styles.backText}>← {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: companyColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: companyColors.border,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  right: { paddingTop: 4 },
  sub: {
    fontSize: 12,
    fontWeight: "700",
    color: companyColors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: "800", color: companyColors.text },
  back: { marginBottom: spacing.sm, minHeight: 44, justifyContent: "center" },
  backText: { fontSize: 15, fontWeight: "700", color: companyColors.accentDark },
});
