import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function StudentWorkspaceScreen({
  title,
  subtitle,
  children,
  refreshing = false,
  onRefresh,
}: Props) {
  const layout = useResponsiveLayout();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.space("lg"),
            paddingBottom: layout.space("xxl"),
            gap: layout.space("lg"),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={HUB_COLORS.primary} />
          ) : undefined
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: layout.fontSize.title }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  content: {
    flexGrow: 1,
    width: "100%",
  },
  header: {
    width: "100%",
  },
  title: {
    fontWeight: "800",
    color: HUB_COLORS.foreground,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: HUB_COLORS.muted,
    lineHeight: 22,
  },
});
