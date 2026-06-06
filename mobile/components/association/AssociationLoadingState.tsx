import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";

type Props = {
  message?: string;
};

export function AssociationLoadingState({ message = "Loading…" }: Props) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={ASSOC_COLORS.accent} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
    width: "100%",
  },
  text: {
    color: ASSOC_COLORS.muted,
    fontSize: 14,
  },
});
