import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  description: string;
};

export function StudentPlaceholderScreen({ title, description }: Props) {
  const layout = useResponsiveLayout();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.content, { paddingHorizontal: layout.horizontalPadding }]}>
        <Text style={[styles.title, { fontSize: layout.fontSize.title }]}>{title}</Text>
        <Text style={[styles.description, { fontSize: layout.fontSize.body, marginTop: layout.space("md") }]}>
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    textAlign: "center",
  },
  description: {
    color: HUB_COLORS.muted,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
});
