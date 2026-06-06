import { StyleSheet, Text, View } from "react-native";

import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { messageAvatarInitials } from "@/lib/messageAvatarInitials";

type Props = {
  name: string;
  size: number;
};

export function MessageConversationAvatar({ name, size }: Props) {
  const { colors } = useHubTheme();
  const initials = messageAvatarInitials(name);

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
          borderColor: colors.primaryBorder,
        },
      ]}
      accessibilityLabel={`${name} avatar`}
    >
      <Text style={[styles.initials, { fontSize: size * 0.34, color: colors.primary }]}>
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
