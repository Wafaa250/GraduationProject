import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Href } from "expo-router";

import { MobileNavHeader } from "@/components/navigation/MobileNavHeader";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  children: ReactNode;
  fallbackHref?: Href;
  onBackPress?: () => void;
};

export function PublicProfileShell({ title, children, fallbackHref, onBackPress }: Props) {
  const layout = useResponsiveLayout();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <MobileNavHeader
        title={title}
        fallbackHref={fallbackHref}
        onBackPress={onBackPress}
        backColor={HUB_COLORS.foreground}
        titleColor={HUB_COLORS.foreground}
        backgroundColor={HUB_COLORS.cardBg}
        borderColor={HUB_COLORS.border}
      />
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
  body: {
    flex: 1,
    paddingTop: 16,
    gap: 16,
  },
});
