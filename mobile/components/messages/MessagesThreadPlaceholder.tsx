import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title?: string;
  description?: string;
};

export function MessagesThreadPlaceholder({
  title = "Select a conversation",
  description = "Choose a conversation from the list to view messages.",
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }]}>
        <Ionicons name="chatbubbles-outline" size={layout.scale(28)} color={colors.primary} />
      </View>
      <Text style={[styles.title, { fontSize: layout.fontSize.label }]}>{title}</Text>
      <Text style={[styles.description, { fontSize: layout.fontSize.footer }]}>{description}</Text>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      backgroundColor: colors.background,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      marginBottom: 16,
    },
    title: {
      color: colors.foreground,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 8,
    },
    description: {
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "500",
    },
  });
