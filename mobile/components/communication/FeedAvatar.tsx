import { Image } from "expo-image";
import { StyleSheet, Text, View, type ImageStyle, type ViewStyle } from "react-native";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import type { HubRoleType } from "@/constants/studentHubTheme";
import { getHubRoleAccent } from "@/lib/hubRoleAccent";
import { profileInitialsFromName } from "@/lib/profileAvatar";
import { resolveProfileImageUri } from "@/lib/profilePhotoUrl";

type Props = {
  name: string;
  size: number;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
  roleType?: HubRoleType;
  style?: ViewStyle | ImageStyle;
};

export function FeedAvatar({ name, size, avatarUrl, avatarBase64, roleType, style }: Props) {
  const { colors } = useHubTheme();
  const fromBase64 = avatarBase64 ? resolveProfileImageUri(avatarBase64) : null;
  const fromUrl = avatarUrl ? resolveApiFileUrl(avatarUrl) ?? avatarUrl : null;
  const src = fromBase64 ?? fromUrl;
  const initials = profileInitialsFromName(name);
  const roleAccent = roleType ? getHubRoleAccent(colors, roleType) : null;
  const roleColor = roleAccent?.fg ?? colors.primary;
  const roleBg = roleAccent?.bg ?? colors.primarySoft;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: roleType ? 2 : 0,
            borderColor: roleColor,
          },
          style as ImageStyle,
        ]}
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
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.34,
            lineHeight: size * 0.38,
            color: roleColor,
          },
        ]}
      >
        {initials}
      </Text>
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
