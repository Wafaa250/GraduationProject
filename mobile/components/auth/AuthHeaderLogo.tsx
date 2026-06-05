import { StyleSheet, Text, View } from "react-native";

import SkillSwapMarkSvg from "@/assets/branding/skillswap-mark.svg";
import { AUTH_BRANDING } from "@/constants/authBranding";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

/**
 * Unified SkillSwap header for all authentication screens.
 * Mark orb + "SkillSwap" wordmark — one size, one spacing, one alignment.
 */
export function AuthHeaderLogo() {
  const layout = useResponsiveLayout();
  const markSize = layout.scale(AUTH_BRANDING.logoMarkSize);
  const gap = layout.scale(AUTH_BRANDING.logoGap);
  const fontSize = layout.scale(AUTH_BRANDING.logoWordmarkSize);

  return (
    <View
      style={[
        styles.wrapper,
        { marginBottom: layout.space(AUTH_BRANDING.logoMarginBottom) },
      ]}
      accessibilityRole="image"
      accessibilityLabel="SkillSwap"
    >
      <View style={[styles.lockup, { gap }]}>
        <SkillSwapMarkSvg width={markSize} height={markSize} />
        <Text
          style={[
            styles.wordmark,
            {
              fontSize,
              lineHeight: fontSize * 1.12,
              letterSpacing: fontSize * -0.03,
            },
          ]}
          maxFontSizeMultiplier={1.2}
        >
          <Text style={styles.skill}>Skill</Text>
          <Text style={styles.swap}>Swap</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
  },
  lockup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontWeight: "700",
  },
  skill: {
    color: AUTH_COLORS.foreground,
  },
  swap: {
    color: "#7B61B8",
  },
});
