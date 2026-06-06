import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { doctorScreenStyle } from "@/components/doctor/ui/doctorDesignSystem";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";

type Props = {
  children: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  /** White header strip above content (messages, notifications). */
  headerSurface?: boolean;
};

export function DoctorScreen({ children, edges = ["top"], style, headerSurface }: Props) {
  const { colors } = useHubTheme();

  return (
    <SafeAreaView
      style={[doctorScreenStyle(colors), headerSurface && { backgroundColor: colors.cardBg }, style]}
      edges={edges}
    >
      {headerSurface ? <View style={[styles.headerBg, { backgroundColor: colors.cardBg }]} /> : null}
      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    bottom: undefined,
    height: 120,
  },
});
