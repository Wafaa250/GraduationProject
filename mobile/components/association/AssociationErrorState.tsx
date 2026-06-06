import { StyleSheet, Text, View } from "react-native";

import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { ASSOC_COLORS } from "@/constants/associationTheme";

type Props = {
  message: string;
  onRetry?: () => void;
  backLabel?: string;
  onBack?: () => void;
};

export function AssociationErrorState({ message, onRetry, backLabel, onBack }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {onRetry ? <AssociationActionButton label="Retry" onPress={onRetry} compact /> : null}
        {onBack && backLabel ? (
          <AssociationActionButton label={backLabel} variant="outline" onPress={onBack} compact />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 32,
    gap: 16,
  },
  message: {
    color: ASSOC_COLORS.muted,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
    maxWidth: 320,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
});
