import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthHeaderLogo } from "@/components/auth/AuthHeaderLogo";
import { AUTH_BRANDING } from "@/constants/authBranding";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type AuthScreenLayoutProps = {
  children: ReactNode;
  /** Vertically center content when it fits (login-style screens). */
  centerContent?: boolean;
  keyboardAvoiding?: boolean;
  showLogo?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AuthScreenLayout({
  children,
  centerContent = false,
  keyboardAvoiding = false,
  showLogo = true,
  contentStyle,
}: AuthScreenLayoutProps) {
  const layout = useResponsiveLayout();

  const paddingTop = layout.isCompactHeight
    ? layout.space(AUTH_BRANDING.screenPaddingTopCompact)
    : layout.space(AUTH_BRANDING.screenPaddingTop);

  const scrollContentStyle = {
    flexGrow: 1,
    justifyContent: centerContent ? ("center" as const) : undefined,
    paddingHorizontal: layout.horizontalPadding,
    paddingTop,
    paddingBottom: Math.max(
      layout.space(AUTH_BRANDING.screenPaddingBottom),
      layout.insets.bottom + layout.space("xxl"),
    ),
    ...(centerContent
      ? { minHeight: layout.height - layout.insets.top - layout.insets.bottom }
      : null),
  };

  const body = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={scrollContentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={!centerContent}
    >
      <View
        style={[
          styles.inner,
          { maxWidth: layout.maxContentWidth },
          contentStyle,
        ]}
      >
        {showLogo ? <AuthHeaderLogo /> : null}
        {children}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? layout.insets.top : 0}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  flex: {
    flex: 1,
  },
  inner: {
    width: "100%",
    alignSelf: "center",
  },
});
