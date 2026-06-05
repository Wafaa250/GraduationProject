import { StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type AnalysisNoteBannerProps = {
  message: string;
  variant?: "info" | "warning";
};

export function AnalysisNoteBanner({ message, variant = "warning" }: AnalysisNoteBannerProps) {
  const layout = useResponsiveLayout();
  const isWarning = variant === "warning";

  return (
    <View
      style={[
        styles.banner,
        {
          borderRadius: layout.radius.input,
          padding: layout.space("md"),
          marginBottom: layout.space("md"),
          backgroundColor: isWarning ? "rgba(245, 158, 11, 0.1)" : AUTH_COLORS.primarySoft,
          borderColor: isWarning ? "rgba(245, 158, 11, 0.3)" : AUTH_COLORS.primaryBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: layout.fontSize.footer,
            color: isWarning ? "#92400E" : AUTH_COLORS.foreground,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    borderWidth: 1,
  },
  text: {
    lineHeight: 20,
  },
});
