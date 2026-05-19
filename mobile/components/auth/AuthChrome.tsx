import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { SS } from "@/constants/skillswapTheme";

type AuthChromeProps = {
  children: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
};

/** Lovable auth background: soft gradient surface (Onboarding / Sign in). */
export function AuthChrome({ children, edges = ["top", "left", "right"], style }: AuthChromeProps) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[...SS.gradientSurface]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SS.background,
  },
  safe: {
    flex: 1,
  },
});
