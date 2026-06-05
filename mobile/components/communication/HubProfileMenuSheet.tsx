import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMe } from "@/api/meApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { logout } from "@/lib/logout";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { getItem } from "@/utils/authStorage";

type MenuAction = "profile" | "settings" | "logout";

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (action: MenuAction) => void;
};

type MenuItem = {
  key: MenuAction;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { key: "profile", label: "My Profile", icon: "person-outline" },
  { key: "settings", label: "Settings", icon: "settings-outline" },
  { key: "logout", label: "Logout", icon: "log-out-outline", destructive: true },
];

export function HubProfileMenuSheet({ visible, onClose, onNavigate }: Props) {
  const layout = useResponsiveLayout();
  const [displayName, setDisplayName] = useState("Student");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(320)).current;

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const me = await getMe();
      setDisplayName(me.name?.trim() || "Student");
      setAvatarBase64(me.profilePictureBase64 ?? null);
    } catch {
      const storedName = await getItem("name");
      if (storedName) setDisplayName(storedName);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      void loadProfile();
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        damping: 22,
        stiffness: 220,
        useNativeDriver: true,
      }).start();
      return;
    }
    sheetTranslateY.setValue(320);
  }, [visible, loadProfile, sheetTranslateY]);

  const handleItemPress = async (action: MenuAction) => {
    onClose();
    if (action === "logout") {
      await logout();
      return;
    }
    onNavigate(action);
  };

  const avatarSize = layout.scale(52);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />

        <Animated.View
          style={[
            styles.sheetSafe,
            {
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <SafeAreaView edges={["bottom"]}>
            <View
              style={[
                styles.sheet,
                {
                  borderTopLeftRadius: layout.radius.input + 4,
                  borderTopRightRadius: layout.radius.input + 4,
                  paddingHorizontal: layout.horizontalPadding,
                  paddingTop: layout.space("md"),
                  paddingBottom: layout.space("lg"),
                },
              ]}
            >
            <View style={[styles.handle, { marginBottom: layout.space("lg") }]} />

            <View style={[styles.profileRow, { gap: layout.space("md"), marginBottom: layout.space("lg") }]}>
              {loadingProfile ? (
                <View style={[styles.avatarPlaceholder, { width: avatarSize, height: avatarSize }]}>
                  <ActivityIndicator size="small" color={HUB_COLORS.primary} />
                </View>
              ) : (
                <FeedAvatar
                  name={displayName}
                  size={avatarSize}
                  avatarBase64={profilePhotoUrl(avatarBase64) ? avatarBase64 : null}
                  roleType="student"
                />
              )}
              <View style={styles.profileText}>
                <Text
                  style={[styles.profileName, { fontSize: layout.fontSize.title }]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <Text style={[styles.profileHint, { fontSize: layout.fontSize.footer }]}>Account menu</Text>
              </View>
            </View>

            <View style={[styles.menuList, { gap: layout.space("xs") }]}>
              {MENU_ITEMS.map((item, index) => (
                <View key={item.key}>
                  {item.destructive ? (
                    <View style={[styles.divider, { marginVertical: layout.space("sm") }]} />
                  ) : null}
                  <Pressable
                    onPress={() => void handleItemPress(item.key)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      {
                        minHeight: layout.scale(52),
                        borderRadius: layout.radius.input,
                        paddingHorizontal: layout.space("md"),
                      },
                      pressed ? styles.menuItemPressed : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Ionicons
                      name={item.icon}
                      size={layout.iconSize}
                      color={item.destructive ? "#DC2626" : HUB_COLORS.foreground}
                    />
                    <Text
                      style={[
                        styles.menuLabel,
                        {
                          fontSize: layout.fontSize.body,
                          color: item.destructive ? "#DC2626" : HUB_COLORS.foreground,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheetSafe: {
    width: "100%",
  },
  sheet: {
    backgroundColor: HUB_COLORS.tabBarBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.tabBarBorder,
    borderBottomWidth: 0,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: HUB_COLORS.border,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: HUB_COLORS.primarySoft,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  profileHint: {
    color: HUB_COLORS.muted,
    marginTop: 2,
  },
  menuList: {
    width: "100%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: HUB_COLORS.primarySoft,
  },
  menuLabel: {
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: HUB_COLORS.border,
  },
});
