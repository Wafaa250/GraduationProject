import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import { forgotPassword } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { RegTextField } from "@/components/registration/RegTextField";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function ForgotPasswordScreen() {
  const layout = useResponsiveLayout();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleContinue = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setApiError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const message = await forgotPassword({ email: trimmed });
      setSuccessMessage(message);
      router.push({
        pathname: "/forgot-password/verify",
        params: { email: trimmed },
      });
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
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
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      <RegTextField
        label="Email address"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (apiError) setApiError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@university.edu"
      />

      <GradientAuthButton label="Send code" onPress={() => void handleContinue()} loading={loading} />

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
  success: {
    marginBottom: 12,
    color: AUTH_COLORS.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
  backLink: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    fontWeight: "500",
  },
});
