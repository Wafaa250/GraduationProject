import { StyleSheet, Text, View } from "react-native";

import { RegTextField } from "@/components/registration/RegTextField";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type SocialLinksSectionProps = {
  instagramUrl: string;
  facebookUrl: string;
  linkedInUrl: string;
  onInstagramChange: (value: string) => void;
  onFacebookChange: (value: string) => void;
  onLinkedInChange: (value: string) => void;
};

export function SocialLinksSection({
  instagramUrl,
  facebookUrl,
  linkedInUrl,
  onInstagramChange,
  onFacebookChange,
  onLinkedInChange,
}: SocialLinksSectionProps) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ width: "100%", marginTop: layout.space("md") }}>
      <Text style={[styles.heading, { fontSize: layout.fontSize.label }]}>Social links</Text>
      <Text style={[styles.subheading, { fontSize: layout.fontSize.footer, marginBottom: layout.space("md") }]}>
        Optional
      </Text>
      <RegTextField
        label="Instagram"
        value={instagramUrl}
        onChangeText={onInstagramChange}
        autoCapitalize="none"
        keyboardType="url"
        placeholder="https://instagram.com/..."
      />
      <RegTextField
        label="Facebook"
        value={facebookUrl}
        onChangeText={onFacebookChange}
        autoCapitalize="none"
        keyboardType="url"
        placeholder="https://facebook.com/..."
      />
      <RegTextField
        label="LinkedIn"
        value={linkedInUrl}
        onChangeText={onLinkedInChange}
        autoCapitalize="none"
        keyboardType="url"
        placeholder="https://linkedin.com/..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontWeight: "700",
    color: AUTH_COLORS.foreground,
  },
  subheading: {
    color: AUTH_COLORS.muted,
    marginTop: 2,
  },
});
