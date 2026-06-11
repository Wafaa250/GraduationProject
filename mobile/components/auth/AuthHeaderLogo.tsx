import { PixelRatio, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import SkillSwapMarkSvg from "@/assets/branding/skillswap-mark.svg";
import { AUTH_BRANDING } from "@/constants/authBranding";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type SkillSwapBrandLockupProps = {
  /** `full` = orb + SkillSwap wordmark; `mark` = orb only */
  variant?: "full" | "mark";
  /** Optional override for mark size in px (before density rounding). */
  markSize?: number;
  style?: StyleProp<ViewStyle>;
};

function crispSize(value: number) {
  return PixelRatio.roundToNearestPixel(value);
}

/**
 * Official SkillSwap lockup — single source of truth for in-app branding.
 * Uses `skillswap-mark.svg` and auth wordmark tokens.
 */
export function SkillSwapBrandLockup({
  variant = "full",
  markSize: markSizeProp,
  style,
}: SkillSwapBrandLockupProps) {
  const layout = useResponsiveLayout();
  const markSize = crispSize(layout.scale(markSizeProp ?? AUTH_BRANDING.logoMarkSize));
  const gap = crispSize(layout.scale(AUTH_BRANDING.logoGap));
  const fontSize = layout.scale(AUTH_BRANDING.logoWordmarkSize);

  return (
    <View
      style={[styles.lockup, variant === "full" ? { gap } : null, style]}
      accessibilityRole="image"
      accessibilityLabel="SkillSwap"
    >
      <SkillSwapMarkSvg
        width={markSize}
        height={markSize}
        preserveAspectRatio="xMidYMid meet"
      />
      {variant === "full" ? (
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
      ) : null}
    </View>
  );
}

/**
 * Centered auth header lockup for login, register, and password flows.
 */
export function AuthHeaderLogo() {
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.wrapper,
        { marginBottom: layout.space(AUTH_BRANDING.logoMarginBottom) },
      ]}
    >
      <SkillSwapBrandLockup variant="full" />
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
    flexShrink: 0,
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
