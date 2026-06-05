import { StyleSheet, Text, View } from "react-native";

import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type AuthErrorBannerProps = {
  message: string;
};

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.banner,
        {
          borderRadius: layout.radius.input,
          paddingHorizontal: layout.space("md"),
          paddingVertical: layout.space("md"),
          marginBottom: layout.space("lg"),
        },
      ]}
      accessibilityRole="alert"
    >
      <Text style={[styles.text, { fontSize: layout.fontSize.label, lineHeight: layout.fontSize.label * 1.4 }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  text: {
    color: "#DC2626",
    flexShrink: 1,
  },
});
