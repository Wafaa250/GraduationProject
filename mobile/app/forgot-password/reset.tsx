import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { RegTextField } from "@/components/registration/RegTextField";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function ForgotPasswordResetScreen() {
  const layout = useResponsiveLayout();
  const { email } = useLocalSearchParams<{ email?: string; code?: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const handleContinue = () => {
    if (newPassword.length < 8) {
      setApiError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setApiError("Passwords do not match.");
      return;
    }
    router.replace("/login");
  };

  return (
    <AuthScreenLayout keyboardAvoiding>
      <Text style={[styles.title, { fontSize: layout.fontSize.title, marginBottom: layout.space("sm") }]}>
        Reset Password
      </Text>
      <Text style={[styles.subtitle, { fontSize: layout.fontSize.subtitle, marginBottom: layout.space("xl") }]}>
        Create a new password for {email || "your account"}.
      </Text>

      {apiError ? <AuthErrorBanner message={apiError} /> : null}

      <RegTextField
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <RegTextField
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <GradientAuthButton label="Update password" onPress={handleContinue} />

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
