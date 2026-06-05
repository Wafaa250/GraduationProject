import { Image } from "expo-image";
import { StyleSheet, Text, View, type ImageStyle, type ViewStyle } from "react-native";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import { profileInitialsFromName } from "@/lib/profileAvatar";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { HUB_COLORS, type HubRoleType } from "@/constants/studentHubTheme";

type Props = {
  name: string;
  size: number;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
  roleType?: HubRoleType;
  style?: ViewStyle | ImageStyle;
};

export function FeedAvatar({ name, size, avatarUrl, avatarBase64, roleType, style }: Props) {
  const fromBase64 = avatarBase64 ? profilePhotoUrl(avatarBase64) : null;
  const fromUrl = avatarUrl ? resolveApiFileUrl(avatarUrl) ?? avatarUrl : null;
  const src = fromBase64 ?? fromUrl;
  const initials = profileInitialsFromName(name);
  const roleColor = roleType ? HUB_COLORS[roleType] : HUB_COLORS.primary;
  const roleBg = roleType ? HUB_COLORS.roleBg[roleType] : HUB_COLORS.primarySoft;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style as ImageStyle]}
        contentFit="cover"
        accessibilityLabel={`${name} avatar`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: roleBg,
          borderColor: roleColor,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.34, color: roleColor }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  initials: {
    fontWeight: "700",
  },
});
