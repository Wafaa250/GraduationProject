import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import type { Href } from "expo-router";

import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { navigateBack } from "@/lib/mobileBackNavigation";

type Props = {
  fallbackHref?: Href | string;
  color?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function MobileBackButton({
  fallbackHref,
  color = "#0F172A",
  onPress,
  accessibilityLabel = "Go back",
}: Props) {
  const layout = useResponsiveLayout();
  const size = layout.scale(24);
  const touchSize = layout.scale(44);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    navigateBack(fallbackHref);
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          width: touchSize,
          height: touchSize,
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <ChevronLeft size={size} color={color} strokeWidth={2.25} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
});
