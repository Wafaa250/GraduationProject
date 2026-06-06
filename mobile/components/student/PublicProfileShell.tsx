import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  children: ReactNode;
};

export function PublicProfileShell({ title, children }: Props) {
  const layout = useResponsiveLayout();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.topBar, { paddingHorizontal: layout.horizontalPadding }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={HUB_COLORS.foreground} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={[styles.body, { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.space("xxl") }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.cardBg,
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    fontSize: 16,
  },
  body: {
    flex: 1,
    paddingTop: 16,
    gap: 16,
  },
});
