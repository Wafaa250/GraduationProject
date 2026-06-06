import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function HubSectionCard({ title, description, children }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius.input,
          padding: layout.space("lg"),
          gap: layout.space("md"),
        },
      ]}
    >
      <View>
        <Text style={[styles.title, { fontSize: layout.fontSize.label }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { fontSize: layout.fontSize.footer, marginTop: 4 }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useHubTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    title: {
      fontWeight: "700",
      color: colors.foreground,
    },
    description: {
      color: colors.muted,
      lineHeight: 18,
    },
  });
}
