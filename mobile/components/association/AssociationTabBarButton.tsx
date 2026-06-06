import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { StyleSheet, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";

/** Mirrors web `.assoc-sidebar-nav-link.active` (peach bg, orange accent, rounded). */
export function AssociationTabBarButton({
  children,
  style,
  accessibilityState,
  ...rest
}: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected ?? false;

  return (
    <PlatformPressable
      {...rest}
      style={[style, styles.button, focused && styles.buttonActive]}
      pressColor={ASSOC_COLORS.accentSoft}
    >
      {focused ? <View style={styles.topAccent} /> : null}
      {children}
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginHorizontal: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  buttonActive: {
    backgroundColor: ASSOC_COLORS.navActive,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: "18%",
    right: "18%",
    height: 3,
    borderRadius: 2,
    backgroundColor: ASSOC_COLORS.accent,
  },
});
