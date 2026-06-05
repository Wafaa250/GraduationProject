import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { RegTextField } from "@/components/registration/RegTextField";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function ForgotPasswordScreen() {
  const layout = useResponsiveLayout();
  const [email, setEmail] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!email.trim()) {
      setApiError("Please enter your email address.");
      return;
    }
    router.push({
      pathname: "/forgot-password/verify",
      params: { email: email.trim() },
    });
  };

  return (
    <AuthScreenLayout keyboardAvoiding>
      <Text style={[styles.title, { fontSize: layout.fontSize.title, marginBottom: layout.space("sm") }]}>
        Forgot Password
      </Text>
      <Text style={[styles.subtitle, { fontSize: layout.fontSize.subtitle, marginBottom: layout.space("xl") }]}>
        We&apos;ll send a verification code to your account email.
      </Text>

      {apiError ? <AuthErrorBanner message={apiError} /> : null}

      <RegTextField
        label="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@university.edu"
      />

      <GradientAuthButton label="Send code" onPress={handleContinue} />

      <Text
        style={[styles.backLink, { fontSize: layout.fontSize.footer, marginTop: layout.space("xl") }]}
        onPress={() => router.push("/login")}
      >
        ← Back to Sign in
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
