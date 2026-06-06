import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function MessagesEmptyState({
  title = "No conversations yet",
  description = "Start connecting with students, doctors and organizations.",
  icon = "chatbubbles-outline",
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, { paddingHorizontal: layout.horizontalPadding }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={layout.scale(36)} color={colors.primary} />
      </View>
      <Text style={[styles.title, { fontSize: layout.fontSize.subtitle, marginTop: layout.space("lg") }]}>
        {title}
      </Text>
      <Text style={[styles.description, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
        {description}
      </Text>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 48,
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
    },
    description: {
      color: colors.muted,
      textAlign: "center",
      lineHeight: 24,
      maxWidth: 300,
    },
  });
