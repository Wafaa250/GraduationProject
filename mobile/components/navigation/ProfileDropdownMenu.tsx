import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  I18nManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type ProfileMenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ProfileDropdownMenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

export type ProfileDropdownTheme = {
  cardBg: string;
  border: string;
  foreground: string;
  muted: string;
  primarySoft: string;
  shadow: string;
};

type Props = {
  visible: boolean;
  anchor: ProfileMenuAnchor | null;
  onClose: () => void;
  items: ProfileDropdownMenuItem[];
  theme: ProfileDropdownTheme;
  menuWidth?: number;
};

const MENU_MIN_WIDTH = 180;
const MENU_MAX_WIDTH = 220;

export function ProfileDropdownMenu({
  visible,
  anchor,
  onClose,
  items,
  theme,
  menuWidth: menuWidthProp,
}: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { width: screenWidth } = useWindowDimensions();
  const isRTL = I18nManager.isRTL;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 320,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacityAnim, scaleAnim]);

  const menuStyle = useMemo(() => {
    const padding = layout.horizontalPadding;
    const width = menuWidthProp ?? Math.min(MENU_MAX_WIDTH, Math.max(MENU_MIN_WIDTH, screenWidth - padding * 2));

    if (!anchor) {
      return {
        top: insets.top + layout.scale(52),
        right: padding,
        width,
      };
    }

    const top = anchor.y + anchor.height + 8;
    const preferredRight = screenWidth - (anchor.x + anchor.width);
    let right = Math.max(padding, preferredRight);
    const maxRight = screenWidth - width - padding;
    right = Math.min(right, maxRight);

    if (isRTL) {
      const left = Math.max(padding, Math.min(anchor.x, screenWidth - width - padding));
      return { top, left, width };
    }

    return { top, right, width };
  }, [anchor, insets.top, isRTL, layout, menuWidthProp, screenWidth]);

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: "rgba(15, 23, 42, 0.12)" }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />

        <Animated.View
          style={[
            styles.menu,
            {
              top: menuStyle.top,
              ...(isRTL ? { left: menuStyle.left } : { right: menuStyle.right }),
              width: menuStyle.width,
              borderRadius: layout.radius.input,
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              shadowColor: theme.shadow,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.items}>
            {items.map((item, index) => (
              <View key={item.key}>
                {item.destructive && index > 0 ? (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                ) : null}
                <Pressable
                  onPress={() => {
                    onClose();
                    item.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    pressed ? { backgroundColor: theme.primarySoft } : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={item.destructive ? "#DC2626" : theme.muted}
                  />
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: item.destructive ? "#DC2626" : theme.foreground },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    position: "absolute",
    borderWidth: 1,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  items: {
    paddingVertical: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
    marginVertical: 4,
  },
});
