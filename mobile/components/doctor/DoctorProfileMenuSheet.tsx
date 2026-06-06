import { router, type Href } from "expo-router";
import { LogOut, Settings, User, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  InteractionManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";
import { logout } from "@/lib/logout";

type Props = {
  visible: boolean;
  onClose: () => void;
  displayName: string;
  profilePhoto?: string | null;
};

type MenuItem = {
  key: string;
  label: string;
  icon: typeof User;
  destructive?: boolean;
  onPress: () => void;
};

export function DoctorProfileMenuSheet({ visible, onClose, displayName, profilePhoto }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);
  const slideAnim = useRef(new Animated.Value(320)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(320);
      fadeAnim.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 24,
        stiffness: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, slideAnim, fadeAnim]);

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

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close account menu" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View style={styles.profileRow}>
              <FeedAvatar name={displayName} size={48} avatarBase64={profilePhoto} roleType="doctor" />
              <View style={styles.profileText}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.profileRole}>Doctor account</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton} accessibilityLabel="Close">
              <X size={18} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.menu}>
            {items.map((item, index) => {
              const Icon = item.icon;
              const tint = item.destructive ? "#DC2626" : colors.primary;

              return (
                <View key={item.key}>
                  {item.destructive && index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={item.onPress}
                    style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.primarySoft }]}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: item.destructive ? "rgba(220,38,38,0.1)" : colors.primarySoft }]}>
                      <Icon size={18} color={tint} strokeWidth={2.2} />
                    </View>
                    <Text style={[styles.menuLabel, item.destructive && styles.menuLabelDestructive]}>{item.label}</Text>
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
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 23, 42, 0.45)",
    },
    sheet: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.border,
      paddingTop: 8,
      paddingHorizontal: 16,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
      minWidth: 0,
    },
    profileText: {
      flex: 1,
      minWidth: 0,
    },
    profileName: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.2,
    },
    profileRole: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: "600",
      marginTop: 2,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    menu: {
      paddingTop: 4,
      paddingBottom: 4,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 12,
    },
    menuIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    menuLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
    },
    menuLabelDestructive: {
      color: "#DC2626",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
  });
