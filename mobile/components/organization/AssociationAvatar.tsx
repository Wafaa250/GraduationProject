import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { radius } from "@/constants/responsiveLayout";
import { assocColors } from "@/constants/associationTheme";
import { resolveApiFileUrl } from "@/api/axiosInstance";

export type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, number> = { sm: 40, md: 56, lg: 88 };

export function AssociationAvatar({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  size?: AvatarSize;
}) {
  const dim = SIZES[size];
  const resolved = resolveApiFileUrl(logoUrl ?? undefined);
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "?";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (a + b).toUpperCase().slice(0, 2);
  }, [name]);

  if (resolved) {
    return (
      <Image
        source={{ uri: resolved }}
        style={[styles.img, { width: dim, height: dim, borderRadius: dim / 2 }]}
        accessibilityLabel={`${name} logo`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
        },
      ]}
    >
      <Text style={[styles.fallbackText, { fontSize: size === "lg" ? 28 : size === "md" ? 20 : 14 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  fallbackText: {
    fontWeight: "800",
    color: assocColors.accentDark,
  },
});
