import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  bordered?: boolean;
};

export function AssociationFormSection({ title, description, children, bordered = true }: Props) {
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.section,
        bordered ? styles.sectionBordered : null,
        { paddingTop: bordered ? layout.space("md") : 0, gap: layout.space("sm") },
      ]}
    >
      <View style={{ gap: 4 }}>
        <Text style={[styles.title, { fontSize: layout.fontSize.subtitle }]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={{ gap: layout.space("sm"), width: "100%" }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
  },
  sectionBordered: {
    borderTopWidth: 1,
    borderTopColor: ASSOC_COLORS.border,
  },
  title: {
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: ASSOC_COLORS.muted,
  },
});
