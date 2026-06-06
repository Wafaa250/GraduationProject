import type { ReactNode } from "react";
import { useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Href } from "expo-router";

import { MobileNavHeader } from "@/components/navigation/MobileNavHeader";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  showBack?: boolean;
  fallbackHref?: Href | string;
  onBackPress?: () => void;
  navTitle?: string;
};

export function StudentWorkspaceScreen({
  title,
  subtitle,
  children,
  refreshing = false,
  onRefresh,
  showBack = false,
  fallbackHref,
  onBackPress,
  navTitle,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {showBack ? (
        <MobileNavHeader
          title={navTitle}
          fallbackHref={fallbackHref}
          onBackPress={onBackPress}
          backColor={colors.foreground}
          titleColor={colors.foreground}
          backgroundColor={colors.cardBg}
          borderColor={colors.border}
        />
      ) : null}
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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

function createStyles(colors: ReturnType<typeof useHubTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.foreground,
      letterSpacing: -0.4,
    },
    subtitle: {
      color: colors.muted,
      lineHeight: 22,
    },
  });
}
