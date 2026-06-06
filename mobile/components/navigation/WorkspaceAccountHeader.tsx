import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import {
  ProfileDropdownMenu,
  type ProfileDropdownTheme,
  type ProfileMenuAnchor,
} from "@/components/navigation/ProfileDropdownMenu";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { logout } from "@/lib/logout";
import { getItem } from "@/utils/authStorage";

type Props = {
  profileHref: Href;
  settingsHref: Href;
  avatarRole: "doctor" | "company";
};

const AUTH_THEME: ProfileDropdownTheme = {
  cardBg: AUTH_COLORS.cardBg,
  border: AUTH_COLORS.border,
  foreground: AUTH_COLORS.foreground,
  muted: AUTH_COLORS.muted,
  primarySoft: AUTH_COLORS.primarySoft,
  shadow: "#0F172A",
};

export function WorkspaceAccountHeader({ profileHref, settingsHref, avatarRole }: Props) {
  const layout = useResponsiveLayout();
  const avatarRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<ProfileMenuAnchor | null>(null);
  const [displayName, setDisplayName] = useState(avatarRole === "doctor" ? "Doctor" : "Company");

  const items = useMemo(
    () => [
      {
        key: "profile",
        label: "My Profile",
        icon: "person-outline" as const,
        onPress: () => router.push(profileHref),
      },
      {
        key: "settings",
        label: "Settings",
        icon: "settings-outline" as const,
        onPress: () => router.push(settingsHref),
      },
      {
        key: "logout",
        label: "Logout",
        icon: "log-out-outline" as const,
        destructive: true,
        onPress: () => void logout(),
      },
    ],
    [profileHref, settingsHref],
  );

  const openMenu = async () => {
    const storedName = await getItem("name");
    if (storedName) setDisplayName(storedName);
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height });
      setMenuOpen(true);
    });
  };

  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={[styles.bar, { paddingHorizontal: layout.horizontalPadding, minHeight: layout.scale(44) }]}>
          <View ref={avatarRef} collapsable={false}>
            <Pressable
              onPress={() => void openMenu()}
              hitSlop={8}
              accessibilityLabel="Open account menu"
            >
              <FeedAvatar
                name={displayName}
                size={layout.scale(36)}
                avatarBase64={null}
                roleType={avatarRole}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ProfileDropdownMenu
        visible={menuOpen}
        anchor={menuAnchor}
        onClose={() => {
          setMenuOpen(false);
          setMenuAnchor(null);
        }}
        items={items}
        theme={AUTH_THEME}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: AUTH_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: AUTH_COLORS.border,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 8,
  },
});
