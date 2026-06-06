import { Image, StyleSheet, Text, View } from "react-native";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { getAssociationInitials } from "@/lib/associationBrand";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, number> = {
  sm: 36,
  md: 72,
  lg: 96,
};

type Props = {
  name: string;
  logoUrl?: string | null;
  size?: AvatarSize;
};

export function AssociationAvatar({ name, logoUrl, size = "md" }: Props) {
  const layout = useResponsiveLayout();
  const px = layout.scale(SIZES[size]);
  const src = logoUrl ? resolveApiFileUrl(logoUrl) ?? logoUrl : null;
  const fontSize = size === "sm" ? layout.scale(12) : size === "md" ? layout.scale(22) : layout.scale(28);
  const radius = size === "lg" ? layout.radius.button : layout.radius.input;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[
          styles.image,
          {
            width: px,
            height: px,
            borderRadius: radius,
          },
        ]}
        accessibilityLabel={`${name} logo`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: px,
          height: px,
          borderRadius: radius,
        },
      ]}
      accessibilityLabel={`${name} logo`}
    >
      <Text style={[styles.initials, { fontSize }]}>{getAssociationInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 2,
    borderColor: ASSOC_COLORS.accentBorder,
    backgroundColor: ASSOC_COLORS.accentMuted,
    shadowColor: ASSOC_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  fallback: {
    borderWidth: 2,
    borderColor: ASSOC_COLORS.accentBorder,
    backgroundColor: ASSOC_COLORS.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ASSOC_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  initials: {
    fontWeight: "800",
    color: ASSOC_COLORS.accentDark,
    letterSpacing: -0.4,
  },
});
