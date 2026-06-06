import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function HubSectionCard({ title, description, children }: Props) {
  const layout = useResponsiveLayout();

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

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    shadowColor: HUB_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  description: {
    color: HUB_COLORS.muted,
    lineHeight: 18,
  },
});
