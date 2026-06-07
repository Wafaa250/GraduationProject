import { router, type Href } from "expo-router";
import { LogOut, Settings, User } from "lucide-react-native";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DOCTOR_RADIUS, doctorElevatedShadow } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";
import { logout } from "@/lib/logout";

const MENU_MIN_WIDTH = 200;
const MENU_MAX_WIDTH = 236;
const MENU_ESTIMATED_HEIGHT = 168;
const ANCHOR_GAP = 8;
const SCREEN_MARGIN = 16;

export type AccountMenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  anchor: AccountMenuAnchor | null;
};

type MenuItem = {
  key: string;
  label: string;
  icon: typeof User;
  destructive?: boolean;
  onPress: () => void;
};

function computeMenuLayout(anchor: AccountMenuAnchor | null, screenWidth: number, screenHeight: number, bottomInset: number) {
  const menuWidth = Math.min(MENU_MAX_WIDTH, Math.max(MENU_MIN_WIDTH, screenWidth - SCREEN_MARGIN * 2));

  if (!anchor) {
    return { top: 56, left: SCREEN_MARGIN, width: menuWidth, flipUp: false };
  }

  const left = Math.max(SCREEN_MARGIN, Math.min(anchor.x, screenWidth - menuWidth - SCREEN_MARGIN));
  const spaceBelow = screenHeight - bottomInset - (anchor.y + anchor.height + ANCHOR_GAP);
  const flipUp = spaceBelow < MENU_ESTIMATED_HEIGHT;
  const top = flipUp
    ? Math.max(SCREEN_MARGIN, anchor.y - MENU_ESTIMATED_HEIGHT - ANCHOR_GAP)
    : anchor.y + anchor.height + ANCHOR_GAP;

  return { top, left, width: menuWidth, flipUp };
}

export function DoctorAccountMenuDropdown({ visible, onClose, anchor }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const translateYAnim = useRef(new Animated.Value(-4)).current;

  const window = Dimensions.get("window");
  const layout = useMemo(
    () => computeMenuLayout(anchor, window.width, window.height, insets.bottom),
    [anchor, window.width, window.height, insets.bottom],
  );

  useEffect(() => {
    if (!visible) {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.96);
      translateYAnim.setValue(layout.flipUp ? 4 : -4);
      return;
    }

    translateYAnim.setValue(layout.flipUp ? 4 : -4);

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 24,
        stiffness: 380,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, layout.flipUp, opacityAnim, scaleAnim, translateYAnim]);

  const closeThen = (href: Href) => {
    onClose();
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        router.push(href);
      }, 50);
    });
  };

  const items: MenuItem[] = [
    {
      key: "profile",
      label: "My Profile",
      icon: User,
      onPress: () => closeThen(DOCTOR_ROUTES.profile as Href),
    },
    {
      key: "settings",
      label: "Settings",
      icon: Settings,
      onPress: () => closeThen(DOCTOR_ROUTES.settings as Href),
    },
    {
      key: "logout",
      label: "Logout",
      icon: LogOut,
      destructive: true,
      onPress: () => {
        onClose();
        void logout();
      },
    },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close account menu" />
        </Animated.View>

        <Animated.View
          style={[
            styles.dropdown,
            {
              top: layout.top,
              left: layout.left,
              width: layout.width,
              opacity: opacityAnim,
              transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.menu}>
            {items.map((item, index) => {
              const Icon = item.icon;
              const showDivider = item.destructive && index > 0;
              const iconColor = item.destructive ? "#DC2626" : colors.primary;

              return (
                <View key={item.key}>
                  {showDivider ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={item.onPress}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && {
                        backgroundColor: item.destructive ? "rgba(220, 38, 38, 0.08)" : colors.primarySoft,
                      },
                    ]}
                    accessibilityRole="menuitem"
                    accessibilityLabel={item.label}
                  >
                    <Icon size={17} color={iconColor} strokeWidth={2.2} style={{ opacity: item.destructive ? 1 : 0.82 }} />
                    <Text style={[styles.menuLabel, item.destructive && styles.menuLabelDestructive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 23, 42, 0.1)",
    },
    dropdown: {
      position: "absolute",
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 6,
      ...doctorElevatedShadow(colors),
      ...Platform.select({
        ios: {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
        },
        android: { elevation: 14 },
        default: {},
      }),
    },
    menu: {
      paddingVertical: 2,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: DOCTOR_RADIUS.sm,
      marginHorizontal: 4,
      minHeight: 46,
    },
    menuLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      letterSpacing: -0.1,
    },
    menuLabelDestructive: {
      color: "#DC2626",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: 12,
      marginVertical: 3,
      opacity: 0.65,
    },
  });
