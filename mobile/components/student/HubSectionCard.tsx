import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useHubDesign } from "@/hooks/use-hub-design";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Section card for padded screen layouts (profile, settings, detail pages). */
export function HubSectionCard({ title, description, children }: Props) {
  const hub = useHubDesign();
  const styles = useMemo(() => createStyles(hub), [hub]);

  return (
    <View style={styles.card}>
      <View>
        <Text style={[styles.title, hub.type.sectionTitle]}>{title}</Text>
        {description ? <Text style={[styles.description, hub.type.caption]}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function createStyles(hub: ReturnType<typeof useHubDesign>) {
  const { colors } = hub;
  return StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: hub.card.radius,
      padding: hub.card.padding,
      gap: hub.card.gap,
      ...hub.shadow,
    },
    title: {
      color: colors.foreground,
    },
    description: {
      color: colors.muted,
      marginTop: 4,
    },
  });
}
