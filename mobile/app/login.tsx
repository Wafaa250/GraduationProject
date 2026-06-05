import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { login } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { persistAuthSession } from "@/lib/authSession";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import { MOBILE_ROUTES, navigateHome } from "@/utils/homeNavigation";

export default function LoginScreen() {
  const layout = useResponsiveLayout();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (isLoading) return;

    if (!email.trim() || !password) {
      setApiError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      await persistAuthSession(result);
      await setStoredCompanyRole(result.companyRole ?? null);

      if (result.mustChangePassword) {
        router.replace(MOBILE_ROUTES.changePassword);
        return;
      }

      await navigateHome();
    } catch (error) {
      setApiError(
        parseApiErrorMessage(error) || "Invalid email or password. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const dynamic = useMemo(
    () => ({
      header: {
        marginBottom: layout.isCompactHeight ? layout.space("xxl") : layout.space("xxxl") + layout.space("sm"),
      },
      title: {
        fontSize: layout.fontSize.title,
        lineHeight: layout.fontSize.title * 1.18,
        marginBottom: layout.space("md"),
      },
      subtitle: {
        fontSize: layout.fontSize.subtitle,
        lineHeight: layout.fontSize.subtitle * 1.5,
      },
      form: { gap: layout.space("xl") },
      fieldGroup: { gap: layout.space("sm") },
      label: { fontSize: layout.fontSize.label },
      forgotLink: { fontSize: layout.fontSize.label },
      inputShell: {
        minHeight: layout.touchTarget,
        borderRadius: layout.radius.input,
        paddingHorizontal: layout.space("lg"),
      },
      leadingIcon: { marginRight: layout.space("md") },
      input: {
        fontSize: layout.fontSize.body,
        lineHeight: layout.fontSize.body * 1.375,
        paddingVertical: Platform.OS === "ios" ? layout.space("lg") : layout.space("md"),
      },
      trailingIconButton: {
        marginLeft: layout.space("sm"),
        padding: layout.space("xs"),
      },
      loginButtonWrap: { marginTop: layout.space("sm") },
      footer: {
        marginTop: layout.space("xxxl"),
        fontSize: layout.fontSize.footer,
        lineHeight: layout.fontSize.footer * 1.47,
      },
    }),
    [layout]
  );

  return (
    <AuthScreenLayout centerContent keyboardAvoiding>
      <View style={dynamic.header}>
        <Text style={[styles.title, dynamic.title]} maxFontSizeMultiplier={1.3}>
          Welcome back
        </Text>
        <Text style={[styles.subtitle, dynamic.subtitle]} maxFontSizeMultiplier={1.3}>
          Sign in to keep swapping skills with your community.
        </Text>
      </View>

      {apiError ? <AuthErrorBanner message={apiError} /> : null}

      <View style={dynamic.form}>
        <View style={dynamic.fieldGroup}>
          <Text style={[styles.label, dynamic.label]} maxFontSizeMultiplier={1.2}>
            Email
          </Text>
          <View style={[styles.inputShell, dynamic.inputShell]}>
            <Ionicons
              name="mail-outline"
              size={layout.iconSize}
              color={AUTH_COLORS.muted}
              style={dynamic.leadingIcon}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@university.edu"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              style={[styles.input, dynamic.input]}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={dynamic.fieldGroup}>
          <View style={styles.passwordLabelRow}>
            <Text style={[styles.label, dynamic.label, styles.labelFlex]} maxFontSizeMultiplier={1.2}>
              Password
            </Text>
            <Pressable
              hitSlop={layout.space("sm")}
              style={styles.forgotPressable}
              onPress={() => !isLoading && router.push("/forgot-password" as Href)}
            >
              <Text style={[styles.forgotLink, dynamic.forgotLink]} maxFontSizeMultiplier={1.2}>
                Forgot password?
              </Text>
            </Pressable>
          </View>
          <View style={[styles.inputShell, dynamic.inputShell]}>
            <Ionicons
              name="lock-closed-outline"
              size={layout.iconSize}
              color={AUTH_COLORS.muted}
              style={dynamic.leadingIcon}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              textContentType="password"
              autoComplete="password"
              style={[styles.input, dynamic.input]}
              editable={!isLoading}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={[styles.trailingIconButton, dynamic.trailingIconButton]}
              hitSlop={layout.space("sm")}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={layout.iconSize}
                color={AUTH_COLORS.muted}
              />
            </Pressable>
          </View>
        </View>

        <View style={dynamic.loginButtonWrap}>
          <GradientAuthButton
            label="Login"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>
      </View>

      <Text style={[styles.footer, dynamic.footer]} maxFontSizeMultiplier={1.3}>
        {"Don't have an account? "}
        <Text style={styles.footerLink} onPress={() => !isLoading && router.push("/register")}>
          Sign up
        </Text>
      </Text>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    letterSpacing: -0.5,
    color: AUTH_COLORS.foreground,
    flexShrink: 1,
  },
  subtitle: {
    color: AUTH_COLORS.muted,
    flexShrink: 1,
    width: "100%",
  },
  label: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
  labelFlex: {
    flexShrink: 1,
    marginRight: 8,
  },
  forgotLink: {
    fontWeight: "600",
    color: AUTH_COLORS.link,
    flexShrink: 0,
  },
  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 4,
  },
  forgotPressable: {
    flexShrink: 0,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: AUTH_COLORS.foreground,
  },
  trailingIconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    flexShrink: 1,
    width: "100%",
  },
  footerLink: {
    color: AUTH_COLORS.link,
    fontWeight: "700",
  },
});
