import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { RegTextField } from "@/components/registration/RegTextField";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function ForgotPasswordVerifyScreen() {
  const layout = useResponsiveLayout();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const handleContinue = () => {
    if (code.trim().length !== 6) {
      setApiError("Enter the full 6-digit verification code.");
      return;
    }
    router.push({
      pathname: "/forgot-password/reset",
      params: { email: String(email ?? ""), code: code.trim() },
    });
  };

  return (
    <AuthScreenLayout keyboardAvoiding>
      <Text style={[styles.title, { fontSize: layout.fontSize.title, marginBottom: layout.space("sm") }]}>
        Verify Code
      </Text>
      <Text style={[styles.subtitle, { fontSize: layout.fontSize.subtitle, marginBottom: layout.space("xl") }]}>
        Enter the 6-digit code sent to {email || "your email"}.
      </Text>

      {apiError ? <AuthErrorBanner message={apiError} /> : null}

      <RegTextField
        label="Verification code"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        autoCapitalize="none"
        placeholder="000000"
      />

      <GradientAuthButton label="Verify code" onPress={handleContinue} />

      <Text
        style={[styles.backLink, { fontSize: layout.fontSize.footer, marginTop: layout.space("xl") }]}
        onPress={() => router.push("/forgot-password" as Href)}
      >
        ← Back
      </Text>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    color: AUTH_COLORS.foreground,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: AUTH_COLORS.muted,
    lineHeight: 22,
  },
  backLink: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    fontWeight: "500",
  },
});
