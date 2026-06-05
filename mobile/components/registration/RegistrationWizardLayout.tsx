import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type RegistrationWizardLayoutProps = {
  stepLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  isLoading?: boolean;
  apiError?: string | null;
  backLinkLabel?: string;
  keyboardAvoiding?: boolean;
  badge?: ReactNode;
  customFooter?: ReactNode;
};

export function RegistrationWizardLayout({
  stepLabel,
  title,
  subtitle,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  isLoading = false,
  apiError = null,
  backLinkLabel = "← Back",
  keyboardAvoiding = false,
  badge = null,
  customFooter = null,
}: RegistrationWizardLayoutProps) {
  const layout = useResponsiveLayout();

  return (
    <AuthScreenLayout keyboardAvoiding={keyboardAvoiding}>
      <Text
        style={[
          styles.step,
          {
            fontSize: layout.scale(12),
            marginBottom: layout.space("md"),
          },
        ]}
      >
        {stepLabel}
      </Text>

      {badge}

      <Text style={[styles.title, { fontSize: layout.fontSize.title, lineHeight: layout.fontSize.title * 1.15 }]}>
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            fontSize: layout.fontSize.subtitle,
            lineHeight: layout.fontSize.subtitle * 1.5,
            marginTop: layout.space("sm"),
            marginBottom: layout.space("xl"),
          },
        ]}
      >
        {subtitle}
      </Text>

      {apiError ? <AuthErrorBanner message={apiError} /> : null}

      {children}

      {customFooter ?? (
        <View style={{ marginTop: layout.space("lg"), gap: layout.space("md") }}>
          <GradientAuthButton
            label={continueLabel}
            onPress={onContinue}
            loading={isLoading}
            disabled={isLoading}
          />
          <Pressable onPress={onBack} hitSlop={layout.space("sm")} disabled={isLoading}>
            <Text style={[styles.backLink, { fontSize: layout.fontSize.footer }]}>{backLinkLabel}</Text>
          </Pressable>
        </View>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  step: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    fontWeight: "600",
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    color: AUTH_COLORS.foreground,
    letterSpacing: -0.4,
  },
  subtitle: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    flexShrink: 1,
  },
  backLink: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    fontWeight: "500",
  },
});
