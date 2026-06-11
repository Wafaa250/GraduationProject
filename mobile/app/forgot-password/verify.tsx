import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { forgotPassword, verifyResetCode } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { RegTextField } from "@/components/registration/RegTextField";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function ForgotPasswordVerifyScreen() {
  const layout = useResponsiveLayout();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = String(emailParam ?? "").trim();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!email) {
      router.replace("/forgot-password" as Href);
      return;
    }
    if (code.trim().length !== 6) {
      setApiError("Enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      await verifyResetCode({ email, code: code.trim() });
      router.push({
        pathname: "/forgot-password/reset",
        params: { email, code: code.trim() },
      });
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setApiError(null);
    try {
      const message = await forgotPassword({ email });
      setSuccessMessage(message);
      setCode("");
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <AuthScreenLayout keyboardAvoiding>
        <AuthErrorBanner message="Email is missing. Start again from the forgot password screen." />
        <GradientAuthButton label="Back" onPress={() => router.replace("/forgot-password" as Href)} />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout keyboardAvoiding>
      <Text style={[styles.title, { fontSize: layout.fontSize.title, marginBottom: layout.space("sm") }]}>
        Verify Code
      </Text>
      <Text style={[styles.subtitle, { fontSize: layout.fontSize.subtitle, marginBottom: layout.space("xl") }]}>
        Enter the 6-digit code sent to {email}.
      </Text>

      {apiError ? <AuthErrorBanner message={apiError} /> : null}
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      <RegTextField
        label="Verification code"
        value={code}
        onChangeText={(value) => {
          setCode(value);
          if (apiError) setApiError(null);
        }}
        keyboardType="numeric"
        autoCapitalize="none"
        placeholder="000000"
      />

      <GradientAuthButton label="Verify code" onPress={() => void handleContinue()} loading={loading} />

      <Text
        style={[styles.resendLink, { fontSize: layout.fontSize.footer, marginTop: layout.space("lg") }]}
        onPress={() => !resending && void handleResend()}
      >
        {resending ? "Sending code…" : "Resend verification code"}
      </Text>

      <Text
        style={[styles.backLink, { fontSize: layout.fontSize.footer, marginTop: layout.space("md") }]}
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
  success: {
    marginBottom: 12,
    color: AUTH_COLORS.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
  resendLink: {
    textAlign: "center",
    color: AUTH_COLORS.primary,
    fontWeight: "600",
  },
  backLink: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    fontWeight: "500",
  },
});
