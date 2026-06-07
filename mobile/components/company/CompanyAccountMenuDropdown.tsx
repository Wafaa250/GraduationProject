import { router, type Href } from "expo-router";
import { LogOut, Settings, User } from "lucide-react-native";
import { useEffect, useRef } from "react";
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

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { COMPANY_RADIUS, companyElevatedShadow } from "@/components/company/ui/companyDesignSystem";
import type { CompanyColorScheme } from "@/constants/companyTheme";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { logout } from "@/lib/logout";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

const MENU_WIDTH = 272;

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
  companyName: string;
  email: string;
  showSettings: boolean;
};

type MenuItem = {
  key: string;
  label: string;
  icon: typeof User;
  destructive?: boolean;
  onPress: () => void;
};

export function CompanyAccountMenuDropdown({
  visible,
  onClose,
  anchor,
  companyName,
  email,
  showSettings,
}: Props) {
  const colors = useCompanyTheme();
  const styles = createStyles(colors);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const translateYAnim = useRef(new Animated.Value(-6)).current;

  useEffect(() => {
    if (!visible) {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.94);
      translateYAnim.setValue(-6);
      return;
    }

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 22,
        stiffness: 360,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacityAnim, scaleAnim, translateYAnim]);

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
      onPress: () => closeThen(COMPANY_ROUTES.profile as Href),
    },
    ...(showSettings
      ? [
          {
            key: "settings",
            label: "Settings",
            icon: Settings,
            onPress: () => closeThen(COMPANY_ROUTES.settings as Href),
          } satisfies MenuItem,
        ]
      : []),
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

  const screenWidth = Dimensions.get("window").width;
  const fallbackTop = 56;
  const fallbackRight = 16;

  const top = anchor ? anchor.y + anchor.height + 8 : fallbackTop;
  const right = anchor
    ? Math.max(12, screenWidth - anchor.x - anchor.width)
    : fallbackRight;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close account menu" />
        </Animated.View>

        <Animated.View
          style={[
            styles.dropdown,
            {
              top,
              right,
              width: MENU_WIDTH,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            },
          ]}
        >
          <View style={styles.identity}>
            <FeedAvatar name={companyName} size={40} roleType="company" />
            <View style={styles.identityText}>
              <Text style={styles.identityName} numberOfLines={1}>
                {companyName}
              </Text>
              {email ? (
                <Text style={styles.identityEmail} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.menu}>
            {items.map((item, index) => {
              const Icon = item.icon;
              const showDivider = item.destructive && index > 0;

              return (
                <View key={item.key}>
                  {showDivider ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={item.onPress}
                    style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.accentSoft }]}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Icon
                      size={17}
                      color={item.destructive ? "#DC2626" : colors.muted}
                      strokeWidth={2.2}
                    />
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

const createStyles = (colors: CompanyColorScheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    dropdown: {
      position: "absolute",
      backgroundColor: colors.cardBg,
      borderRadius: COMPANY_RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 12,
      ...companyElevatedShadow(colors),
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 20,
        },
        android: { elevation: 12 },
        default: {},
      }),
    },
    identity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingBottom: 12,
    },
    identityText: {
      flex: 1,
      minWidth: 0,
    },
    identityName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      letterSpacing: -0.2,
    },
    identityEmail: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: 10,
    },
    menu: {
      paddingTop: 4,
      paddingBottom: 2,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: COMPANY_RADIUS.sm,
      marginHorizontal: 4,
      minHeight: 44,
    },
    menuLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
    },
    menuLabelDestructive: {
      color: "#DC2626",
    },
  });
