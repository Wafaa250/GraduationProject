import { useMemo } from "react";
import { router, type Href } from "expo-router";

import {
  ProfileDropdownMenu,
  type ProfileDropdownTheme,
  type ProfileMenuAnchor,
} from "@/components/navigation/ProfileDropdownMenu";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { ASSOCIATION_ROUTES } from "@/lib/associationRoutes";
import { logout } from "@/lib/logout";

type Props = {
  visible: boolean;
  anchor: ProfileMenuAnchor | null;
  onClose: () => void;
};

const ASSOC_THEME: ProfileDropdownTheme = {
  cardBg: ASSOC_COLORS.cardBg,
  border: ASSOC_COLORS.border,
  foreground: ASSOC_COLORS.foreground,
  muted: ASSOC_COLORS.muted,
  primarySoft: ASSOC_COLORS.accentSoft,
  shadow: ASSOC_COLORS.cardShadow,
};

export function AssociationProfileMenuSheet({ visible, anchor, onClose }: Props) {
  const items = useMemo(
    () => [
      {
        key: "profile",
        label: "My Profile",
        icon: "person-outline" as const,
        onPress: () => router.push(ASSOCIATION_ROUTES.profile as Href),
      },
      {
        key: "settings",
        label: "Settings",
        icon: "settings-outline" as const,
        onPress: () => router.push(ASSOCIATION_ROUTES.profile as Href),
      },
      {
        key: "logout",
        label: "Logout",
        icon: "log-out-outline" as const,
        destructive: true,
        onPress: () => void logout(),
      },
    ],
    [],
  );

  return (
    <ProfileDropdownMenu
      visible={visible}
      anchor={anchor}
      onClose={onClose}
      items={items}
      theme={ASSOC_THEME}
    />
  );
}

export type { ProfileMenuAnchor };
