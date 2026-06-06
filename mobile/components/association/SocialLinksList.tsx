import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";

type LinkItem = {
  key: string;
  label: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function displayHost(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type Props = {
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  linkedInUrl?: string | null;
};

export function SocialLinksList({ instagramUrl, facebookUrl, linkedInUrl }: Props) {
  const links: LinkItem[] = [];
  if (instagramUrl?.trim()) {
    links.push({ key: "ig", label: "Instagram", url: instagramUrl, icon: "logo-instagram" });
  }
  if (facebookUrl?.trim()) {
    links.push({ key: "fb", label: "Facebook", url: facebookUrl, icon: "logo-facebook" });
  }
  if (linkedInUrl?.trim()) {
    links.push({ key: "li", label: "LinkedIn", url: linkedInUrl, icon: "logo-linkedin" });
  }

  if (links.length === 0) return null;

  return (
    <View style={{ gap: 8, width: "100%" }}>
      {links.map((link) => (
        <Pressable
          key={link.key}
          onPress={() => void Linking.openURL(normalizeUrl(link.url))}
          style={({ pressed }) => [styles.linkRow, pressed ? styles.linkRowPressed : null]}
        >
          <View style={styles.linkIcon}>
            <Ionicons name={link.icon} size={18} color={ASSOC_COLORS.accentDark} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.linkLabel}>{link.label}</Text>
            <Text style={styles.linkHost} numberOfLines={1}>
              {displayHost(link.url)}
            </Text>
          </View>
          <Ionicons name="open-outline" size={16} color={ASSOC_COLORS.subtle} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    backgroundColor: "#FAFAFA",
  },
  linkRowPressed: {
    backgroundColor: ASSOC_COLORS.accentMuted,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ASSOC_COLORS.accentSoft,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: ASSOC_COLORS.foreground,
  },
  linkHost: {
    fontSize: 12,
    color: ASSOC_COLORS.muted,
    marginTop: 1,
  },
});
