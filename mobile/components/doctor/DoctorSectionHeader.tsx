import { ArrowRight } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionCount?: number;
};

export function DoctorSectionHeader({
  title,
  subtitle,
  actionLabel = "View all",
  onAction,
  actionCount,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, { marginTop: layout.space("lg"), marginBottom: layout.space("sm") }]}>
      <View style={styles.row}>
        <View style={[styles.accent, { backgroundColor: colors.primary, height: layout.scale(18) }]} />
        <View style={styles.titles}>
          <Text style={[styles.title, { fontSize: layout.scale(15) }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { fontSize: layout.scale(11.5), marginTop: 2 }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onAction ? (
          <Pressable onPress={onAction} hitSlop={8} style={styles.action}>
            <Text style={[styles.actionText, { fontSize: layout.scale(11.5) }]}>
              {actionLabel}
              {actionCount != null && actionCount > 0 ? ` ${actionCount}` : ""}
            </Text>
            <ArrowRight size={layout.scale(13)} color={colors.primary} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    wrap: {
      paddingTop: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    accent: {
      width: 3,
      borderRadius: 2,
      marginTop: 2,
    },
    titles: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
    },
    subtitle: {
      color: colors.muted,
      lineHeight: 15,
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingTop: 2,
      flexShrink: 0,
    },
    actionText: {
      color: colors.primary,
      fontWeight: "700",
    },
  });
