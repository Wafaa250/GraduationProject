import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  colors?: HubColorScheme;
};

export function ConversationsListSheet({
  visible,
  title = "Conversations",
  onClose,
  children,
  colors: colorsOverride,
}: Props) {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useHubTheme();
  const colors = colorsOverride ?? themeColors;
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close conversations">
        <Pressable
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, layout.space("md")),
              borderTopLeftRadius: layout.radius.input + 4,
              borderTopRightRadius: layout.radius.input + 4,
              maxHeight: layout.height * 0.88,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={[styles.title, { fontSize: layout.fontSize.label }]}>{title}</Text>
          <View style={styles.content}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.cardBg,
      paddingHorizontal: 0,
      paddingTop: 10,
    },
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    title: {
      color: colors.foreground,
      fontWeight: "800",
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    content: {
      flex: 1,
      minHeight: 0,
    },
  });
}
