import { useMemo } from "react";

import {
  ProfileDropdownMenu,
  type ProfileDropdownTheme,
  type ProfileMenuAnchor,
} from "@/components/navigation/ProfileDropdownMenu";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { logout } from "@/lib/logout";

type MenuAction = "profile" | "settings" | "logout";

type Props = {
  visible: boolean;
  anchor: ProfileMenuAnchor | null;
  onClose: () => void;
  onNavigate: (action: MenuAction) => void;
};

function themeFromHub(colors: HubColorScheme): ProfileDropdownTheme {
  return {
    cardBg: colors.tabBarBg,
    border: colors.tabBarBorder,
    foreground: colors.foreground,
    muted: colors.muted,
    primarySoft: colors.primarySoft,
    shadow: "#0F172A",
  };
}

export function HubProfileMenuSheet({ visible, anchor, onClose, onNavigate }: Props) {
  const { colors } = useHubTheme();
  const theme = useMemo(() => themeFromHub(colors), [colors]);

  const items = useMemo(
    () => [
      {
        key: "profile",
        label: "My Profile",
        icon: "person-outline" as const,
        onPress: () => onNavigate("profile"),
      },
      {
        key: "settings",
        label: "Settings",
        icon: "settings-outline" as const,
        onPress: () => onNavigate("settings"),
      },
      {
        key: "logout",
        label: "Logout",
        icon: "log-out-outline" as const,
        destructive: true,
        onPress: () => void logout(),
      },
    ],
    [onNavigate],
  );

  return (
    <ProfileDropdownMenu
      visible={visible}
      anchor={anchor}
      onClose={onClose}
      items={items}
      theme={theme}
    />
  );
}
