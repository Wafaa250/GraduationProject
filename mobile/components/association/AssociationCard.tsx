import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { ASSOC_CARD, associationCardStyles } from "@/constants/associationCardStyles";

type Props = {
  children: ReactNode;
  compact?: boolean;
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AssociationCard({ children, compact = false, flush = false, style }: Props) {
  return (
    <View
      style={[
        associationCardStyles.card,
        compact ? associationCardStyles.cardCompact : null,
        flush ? associationCardStyles.cardFlush : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export { ASSOC_CARD };
