import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { SS } from "@/constants/skillswapTheme";

type SkillSwapLogoProps = {
  size?: "sm" | "md" | "lg";
  centered?: boolean;
  style?: ViewStyle;
};

const SIZES = {
  sm: { box: 36, icon: 18, title: 20 },
  md: { box: 48, icon: 22, title: 24 },
  lg: { box: 56, icon: 26, title: 28 },
} as const;

export function SkillSwapLogo({ size = "md", centered = false, style }: SkillSwapLogoProps) {
  const dim = SIZES[size];

  return (
    <View style={[styles.row, centered && styles.centered, style]}>
      <LinearGradient
        colors={[...SS.gradientPrimary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.iconBox, { width: dim.box, height: dim.box, borderRadius: size === "sm" ? 12 : 16 }]}
      >
        <Ionicons name="sparkles" size={dim.icon} color={SS.primaryForeground} />
      </LinearGradient>
      <Text style={[styles.wordmark, { fontSize: dim.title }]}>SkillSwap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  centered: {
    alignSelf: "center",
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
    ...SS.shadowGlow,
  },
  wordmark: {
    fontWeight: "800",
    color: SS.foreground,
    letterSpacing: -0.3,
  },
});
