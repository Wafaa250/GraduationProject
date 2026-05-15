import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { spacing } from "@/constants/responsiveLayout";
import { assocColors } from "@/constants/associationTheme";

type LinkDef = { label: string; url: string; icon: keyof typeof Ionicons.glyphMap };

export function SocialLinksRow({
  instagramUrl,
  facebookUrl,
  linkedInUrl,
}: {
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  linkedInUrl?: string | null;
}) {
  const links: LinkDef[] = [];
  const ig = instagramUrl?.trim();
  const fb = facebookUrl?.trim();
  const li = linkedInUrl?.trim();
  if (ig) links.push({ label: "Instagram", url: ig, icon: "logo-instagram" });
  if (fb) links.push({ label: "Facebook", url: fb, icon: "logo-facebook" });
  if (li) links.push({ label: "LinkedIn", url: li, icon: "logo-linkedin" });

  if (links.length === 0) return null;

  return (
    <View style={styles.row}>
      {links.map((l) => (
        <Pressable
          key={l.label}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
          onPress={() => {
            let u = l.url;
            if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
            void Linking.openURL(u);
          }}
          accessibilityRole="link"
          accessibilityLabel={l.label}
        >
          <Ionicons name={l.icon} size={20} color={assocColors.accentDark} />
          <Text style={styles.btnText}>{l.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
  },
  btnText: {
    fontSize: 13,
    fontWeight: "700",
    color: assocColors.accentDark,
  },
});
