import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { SS } from "@/constants/skillswapTheme";

type LovableStepProgressProps = {
  steps: string[];
  currentStep: number;
};

/** Segment progress matching Lovable Onboarding.tsx step bars. */
export function LovableStepProgress({ steps, currentStep }: LovableStepProgressProps) {
  return (
    <View style={styles.wrap}>
      {steps.map((label, i) => (
        <View key={label} style={styles.segment}>
          {i <= currentStep ? (
            <LinearGradient
              colors={[...SS.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bar}
            />
          ) : (
            <View style={[styles.bar, styles.barMuted]} />
          )}
          <Text style={[styles.label, i <= currentStep ? styles.labelActive : styles.labelMuted]}>
            {String(i + 1).padStart(2, "0")} · {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    minWidth: 0,
  },
  bar: {
    height: 6,
    borderRadius: 999,
  },
  barMuted: {
    backgroundColor: "#e2e8f0",
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelActive: {
    color: SS.primaryBright,
  },
  labelMuted: {
    color: SS.muted,
  },
});
