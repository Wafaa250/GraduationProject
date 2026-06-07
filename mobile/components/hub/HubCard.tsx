import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useHubDesign } from "@/hooks/use-hub-design";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  noMargin?: boolean;
  padded?: boolean;
  /** Subtle top accent strip for role-branded cards. */
  accentColor?: string;
};

export function HubCard({ children, style, noMargin = false, padded = true, accentColor }: Props) {
  const hub = useHubDesign();
  const { colors } = hub;

  return (
    <View
      style={[
        styles.card,
        hub.shadow,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderRadius: hub.card.radius,
          padding: padded ? hub.card.padding : 0,
          marginHorizontal: hub.layout.horizontalPadding,
          marginBottom: noMargin ? 0 : hub.card.marginBottom,
        },
        style,
      ]}
    >
      {accentColor ? (
        <View style={[styles.accent, { backgroundColor: accentColor, borderTopLeftRadius: hub.card.radius, borderTopRightRadius: hub.card.radius }]} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});
