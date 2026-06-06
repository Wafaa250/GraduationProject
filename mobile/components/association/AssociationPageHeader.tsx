import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function AssociationPageHeader({ eyebrow = "Student Organization", title, subtitle, action }: Props) {
  const layout = useResponsiveLayout();

  return (
    <View style={[styles.wrap, { gap: layout.space("md"), marginBottom: layout.space("lg") }]}>
      <Text style={[styles.eyebrow, { fontSize: layout.fontSize.footer }]}>{eyebrow}</Text>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { fontSize: layout.fontSize.title }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  eyebrow: {
    color: ASSOC_COLORS.accent,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: ASSOC_COLORS.muted,
    lineHeight: 22,
  },
});
